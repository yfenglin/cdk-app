const AWS = require("aws-sdk");

exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const organizations = new AWS.Organizations();
  
  let res = {
    accCreateRes: [],
  };

  for (let i in event.emails) {
    const email = event.emails[i];
    console.log("Adding: " + email);

    const resp = await organizations
      .createAccount({
        AccountName: `Account - ${email.substring(0, email.indexOf("@"))}`,
        Email: email,
      })
      .promise();

    console.log("data: " + JSON.stringify(resp));
    res.accCreateRes.push(resp);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.parse(res),
  };
};
