const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const organizations = new AWS.Organizations();
  const props = event["ResourceProperties"];
  let allResults = {};
  let allErrors = {};

  // Create OUs
  const OUConfig = props["OUConfig"];
  let { orgNameToId, ouErrors } = await createOU(organizations, OUConfig);
  allResults.OrgIds = orgNameToId;
  allErrors.OUErrors = ouErrors;

  // Add accounts to Organization
  const accountsConfig = props["AccountsConfig"];
  let { addAccountStatuses, addAccountErrors } = await addAccounts(organizations, accountsConfig);
  allResults.AddAccountStatuses = addAccountStatuses;
  allErrors.AddAccountErrors = addAccountErrors;

  // Wait for account creation to be completed (For all requests: State = "SUCCEEDED")
  let { emailToAccountId, accountCreationStatuses, accountCreationErrors } = await accountCreationStatus(
    organizations,
    addAccountStatuses
  );
  allResults.AccountCreationStatuses = accountCreationStatuses;
  allErrors.AccountCreationErrors = accountCreationErrors;

  // Move accounts to OUs
  let moveAccountErrors = await moveAccounts(organizations, accountsConfig, emailToAccountId, orgNameToId);
  allErrors.MoveAccountErrors = moveAccountErrors;

  return {
    Data: {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: allResults,
      errors: allErrors,
    },
  };
};

async function createOU(organizations, OUConfig) {
  const OUsToCreate = OUConfig.OrganizationalUnits; // Array of OUs
  let orgNameToId = { Root: OUConfig.OrganizationRootId }; // Map org names to IDs
  let ouErrors = []; // Save errors from this operation

  for (let i in OUsToCreate) {
    let OUName = OUsToCreate[i].Name;
    let OUParentName = OUsToCreate[i].ParentName;
    let OUParentId = orgNameToId[OUParentName];

    console.log("OU Name: " + OUName + " Parent: " + OUParentName + " ParentId: " + OUParentId);

    let params = {
      Name: OUName,
      ParentId: OUParentId,
    };

    try {
      const resp = await organizations.createOrganizationalUnit(params).promise();
      orgNameToId[OUName] = resp.OrganizationalUnit.Id; // Map new OU's ID to its name
    } catch (err) {
      // If OU already exists
      if (err.code === "DuplicateOrganizationalUnitException") {
        console.log(err.code);
        // Find OU through its parent
        const resp = await organizations
          .listOrganizationalUnitsForParent({
            ParentId: OUParentId,
          })
          .promise();

        // Save OU's ID
        for (let y in resp.OrganizationalUnits) {
          if (resp.OrganizationalUnits[y].Name === OUName) {
            orgNameToId[OUName] = resp.OrganizationalUnits[y].Id;
          }
        }
      } else {
        console.log(err, err.stack);
        let er = {
          message: err.message,
          code: err.code,
          requestId: err.requestId,
          erroredOU: { Name: OUName, ParentName: OUParentName },
        };
        ouErrors.push(er); // Add error
      }
    }
  }
  console.log("OrgIds: " + JSON.stringify(orgNameToId));

  return {
    orgNameToId,
    ouErrors,
  };
}

async function addAccounts(organizations, accountsConfig) {
  const accountsToAdd = accountsConfig.Accounts; // Array of accounts to add
  let addAccountStatuses = [];
  let addAccountErrors = [];

  for (let i in accountsToAdd) {
    const accountName = accountsToAdd[i].Name;
    const accountEmail = accountsToAdd[i].Email;
    console.log("Adding to Organization: " + accountEmail);

    let params = {
      AccountName: accountName || `Account - ${accountEmail.substring(0, accountEmail.indexOf("@"))}`,
      Email: accountEmail,
    };

    try {
      const resp = await organizations.createAccount(params).promise();
      resp.CreateAccountStatus.Email = accountEmail;
      addAccountStatuses.push(resp.CreateAccountStatus);
    } catch (err) {
      console.log(err);
      addAccountStatuses.push(err);
    }
  }

  return { addAccountStatuses, addAccountErrors };
}

/*
 Go through each request one by one
 Check every minute if a request succeeded or failed
 If it did, check the next
 Total of 5 minutes for all requests to be successful
 Wait up to 5 minutes for one request to be successful but check all requests eventually (1 loop)
*/
async function accountCreationStatus(organizations, accountCreationRequests) {
  let accountCreationStatuses = [];
  let accountCreationErrors = [];
  let emailToAccountId = {};
  let sleepTimeLeft = 300;

  // Check account creation statuses
  for (let i = 0; i < accountCreationRequests.length; i++) {
    const requestId = accountCreationRequests[i].Id;
    const accEmail = accountCreationRequests[i].Email;

    let params = {
      CreateAccountRequestId: requestId,
    };

    try {
      const resp = await organizations.describeCreateAccountStatus(params).promise();
      console.log(JSON.stringify(resp));
      if (resp.CreateAccountStatus.State === "SUCCEEDED") {
        emailToAccountId[accEmail] = resp.CreateAccountStatus.AccountId; // Map emails to IDs
        accountCreationStatuses.push(resp.CreateAccountStatus);
      } else if (resp.CreateAccountStatus.State === "IN_PROGRESS") {
        await sleep(20000); // Wait 20 seconds before trying again
        sleepTimeLeft -= 20;
        if (sleepTimeLeft > 0) {
          i--; // Check same request in next loop, or if out of time, check the next request
        }
      } else {
        // Case where State === "FAILED"
        resp.CreateAccountStatus.Email = accEmail; // Save email
        accountCreationStatuses.push(resp.CreateAccountStatus);
      }
    } catch (err) {
      console.log(err);
      accountCreationErrors.push(err);
    }
  }

  return { emailToAccountId, accountCreationStatuses, accountCreationErrors };
}

async function moveAccounts(organizations, accountsConfig, emailToAccountId, orgNameToId) {
  const accounts = accountsConfig.Accounts;
  let moveAccountErrors = [];

  for (let i in accounts) {
    const accountEmail = accounts[i].Email;
    const targetOUName = accounts[i].OrganizationalUnit;
    console.log(`Moving ${accountEmail} to ${targetOUName}`);

    var params = {
      AccountId: emailToAccountId[accountEmail],
      DestinationParentId: orgNameToId[targetOUName],
      SourceParentId: orgNameToId["Root"],
    };

    try {
      const resp = await organizations.moveAccount(params).promise();
    } catch (err) {
      console.log(err);
      moveAccountErrors.push(err);
    }
  }

  return moveAccountErrors;
}

// Sleep helper function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
