const AWS = require("aws-sdk");

exports.handler = async function (event) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "Test lambda dev\n" + JSON.stringify(event),
  };
};
