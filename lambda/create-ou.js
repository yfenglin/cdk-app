const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const organizations = new AWS.Organizations();
  const props = event["ResourceProperties"];
  let allResults = {};
  let allErrors = {};

  // Create OUs
  const OUConfig = props["OUConfig"];
  let { orgIds, ouErrors } = await createOU(organizations, OUConfig);
  allResults.OrgIds = orgIds;
  allErrors.OUErrors = ouErrors;

  // Add accounts to Organization
  const accountsConfig = props["AccountsConfig"];
  let { accountCreationRequests, addAccountErrors } = await addAccounts(organizations, accountsConfig);
  allResults.AccountCreationRequests = accountCreationRequests;
  allErrors.AddAccountErrors = addAccountErrors;

  // Wait for account creation to be completed


  // Move accounts to OUs
  let { moveAccountResp, moveAccountErrors } = await moveAccounts(organizations, accountsConfig);
  allResults.AccountCreationRequests = accountCreationRequests;
  allErrors.AddAccountErrors = addAccountErrors;

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
  let orgIds = { Root: OUConfig.OrganizationRootId }; // Map org names to IDs
  let ouErrors = []; // Save errors from this operation

  for (let i in OUsToCreate) {
    let OUName = OUsToCreate[i].Name;
    let OUParentName = OUsToCreate[i].ParentName;
    let OUParentId = orgIds[OUParentName];

    console.log("OU Name: " + OUName + " Parent: " + OUParentName + " ParentId: " + OUParentId);

    let params = {
      Name: OUName,
      ParentId: OUParentId,
    };

    try {
      const resp = await organizations.createOrganizationalUnit(params).promise();
      orgIds[OUName] = resp.OrganizationalUnit.Id; // Map new OU's ID to its name
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
            orgIds[OUName] = resp.OrganizationalUnits[y].Id;
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
  console.log("OrgIds: " + JSON.stringify(orgIds));

  return {
    orgIds,
    ouErrors,
  };
}

async function addAccounts(organizations, accountsConfig) {
  const accountsToAdd = accountsConfig.OrganizationalUnits; // Array of accounts
  let addAccountErrors = [];

  let addAccountStatusIds = [];

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
      addAccountStatusIds.push(resp.CreateAccountStatus.Id);
    } catch (err) {
      console.log(err);
      addAccountStatusIds.push(err);
    }
  }

  return { addAccountStatusIds, addAccountErrors };
}

async function moveAccounts(organizations, accountsConfig){

}