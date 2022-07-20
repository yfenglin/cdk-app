const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const organizations = new AWS.Organizations();
  let res;

  var params = {
    Name: "New OU",
    ParentId: "ou-jsik-0lqnlvzg",
  };
  console.log("Creating OU1");

  const resp = await organizations
    .createOrganizationalUnit(params, function (err, data) {
      console.log("Creating OU2");
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log("success");
        console.log(JSON.stringify(data));
        res = data;
      }
    })
    .promise();

  /*
  let orgIds = { "Root": event.OrganizationRootId }; // Map org names to IDs
  const OUs = event.OrganizationalUnits; // Array of OUs

  for (let i in OUs){
      console.log(OUs[i].Name + " parent: " + OUs[i].ParentName + " ParentId: " + orgIds[OUs[i].ParentName]);
      
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
      
  }*/

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: res,
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
