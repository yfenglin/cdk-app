const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  console.log("Creating OU");
  const organizations = new AWS.Organizations();
  let res;

  let orgIds = [{ Root: event.OrganizationRootId }]; // Map org names to IDs
  const OUs = event.OrganizationalUnits; // Array of OUs

  for (let i in OUs){
    var params = {
        Name: OUs[i].Name,
        ParentId: orgIds[OUs[i].ParentName],
      };

    organizations.createOrganizationalUnit(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
        } else {
          console.log(JSON.stringify(data));
          orgIds[OUs[i].Name] = data.OrganizationalUnit.Id;
        }
      });
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
