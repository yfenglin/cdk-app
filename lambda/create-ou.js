const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  const organizations = new AWS.Organizations();

  const props = event["ResourceProperties"];
  const OUConfig = props["OUConfig"];
  const OUsToCreate = OUConfig.OrganizationalUnits; // Array of OUs
  let orgIds = { Root: OUConfig.OrganizationRootId }; // Map org names to IDs

  let allErrors = { OUErrors: [] };

  for (let i in OUsToCreate) {
    console.log(
      OUsToCreate[i].Name + " parent: " + OUsToCreate[i].ParentName + " ParentId: " + orgIds[OUsToCreate[i].ParentName]
    );

    var params = {
      Name: OUsToCreate[i].Name,
      ParentId: orgIds[OUsToCreate[i].ParentName],
    };

    try {
      const resp = await organizations.createOrganizationalUnit(params).promise();
      orgIds[OUsToCreate[i].Name] = resp.OrganizationalUnit.Id; // Map new OU's ID to its name
    } catch (err) {
      er = {
        message: err.message,
        code: err.code,
        requestId: err.requestId,
        erroredOU: { Name: OUsToCreate[i].Name, ParentName: OUsToCreate[i].ParentName },
      };
      errors.OUErrors.concat(er); // Add error
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: orgIds,
    errors: allErrors,
  };
};

/*
     data = {
      OrganizationalUnit: {
       Arn: "arn:aws:organizations::111111111111:ou/o-exampleorgid/ou-examplerootid111-exampleouid111", 
       Id: "ou-examplerootid111-exampleouid111", 
       Name: "AccountingOU"
      }
     }
     */
