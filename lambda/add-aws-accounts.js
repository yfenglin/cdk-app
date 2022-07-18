const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  console.log("Adding accounts");
  const organizations = new AWS.Organizations();
  let res = {
    accCreateRes: []
  };

  for (let i in event.emails) {
    const email = event.emails[i];
    console.log("Adding: " + email);

    const resp = await organizations
      .createAccount(
        {
          AccountName: `Account - ${email.substring(0, email.indexOf("@"))}`,
          Email: email,
        },
        function (err, data) {
          if (err) {
            console.log("error:" + err, err.stack);
          } else {
            console.log("data: " + JSON.stringify(data));
            res.accCreateRes.push(data);
          }
        }
      )
      .promise();
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.parse(res),
  };
};
