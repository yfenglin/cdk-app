const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  console.log("Moving accounts:");
  const organizations = new AWS.Organizations();
  let res;

  var params = {
    AccountId: "exampleAcc",
    DestinationParentId: "ou-examplerootid111-exampleouid111",
    SourceParentId: "r-examplerootid111",
  };
  organizations.moveAccount(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {console.log(data)
    res = data;}; // successful response
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.parse(res),
  };
};
