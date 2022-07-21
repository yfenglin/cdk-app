const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  const organizations = new AWS.Organizations();

  let orgIds = { Root: event.ResourceProperties.OrganizationRootId }; // Map org names to IDs
  const OUs = event.OrganizationalUnits; // Array of OUs

  for (let i in OUs) {
    //console.log(OUs[i].Name + " parent: " + OUs[i].ParentName + " ParentId: " + orgIds[OUs[i].ParentName]);
    var params = {
      Name: OUs[i].Name,
      ParentId: orgIds[OUs[i].ParentName],
    };

    try {
      const resp = await organizations.createOrganizationalUnit(params).promise();
      orgIds[OUs[i].Name] = resp.OrganizationalUnit.Id; // Map new OU's ID to its name
    } catch (err) {
        //if (err.code === "DuplicateOrganizationalUnitException")
        
      // Return with error
      return {
        statusCode: err.statusCode,
        headers: { "Content-Type": "text/plain" },
        body: {
          message: err.message,
          code: err.code,
          requestId: err.requestId,
          erroredOU: { Name: OUs[i].Name, ParentName: OUs[i].ParentName },
        },
      };
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: orgIds,
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
