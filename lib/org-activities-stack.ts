import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";

export class OrgActivitiesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Policy to allow adding acccounts to Organization
    const orgPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ["*"],
          actions: [
            "organizations:CreateAccount",
            "organizations:DescribeOrganization",
            "iam:CreateServiceLinkedRole",
          ],
        }),
      ],
    });

    // Attach policies to role
    const addAccountRole = new iam.Role(this, "AddAccountRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Allow adding acccounts to Organization",
      inlinePolicies: {
        orgPolicy: orgPolicy,
      },
    });

    addAccountRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // Lambda function to add AWS accounts to Organization
    const addAccount = new lambda.Function(this, "AddAccountHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "addaccount.handler",
      role: addAccountRole, // Attach role
    });

    // Custom Resources to call addAccount lambda function on Create
    const lambdaTrigger = new cr.AwsCustomResource(this, "AddAccountTrigger", {
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          effect: iam.Effect.ALLOW,
          resources: [addAccount.functionArn],
        }),
      ]),
      timeout: Duration.minutes(15),
      onCreate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: addAccount.functionName,
          InvocationType: "Event",
          Payload: `{
                  "emails": [
                    "cheaplolrp@gmail.com",
                    "cheaplol.rp@gmail.com"
                  ]
                }`,
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
      onUpdate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: addAccount.functionName,
          InvocationType: "Event",
          Payload: `{
                  "emails": [
                    "cheaplolrp@gmail.com",
                    "cheaplol.rp@gmail.com"
                  ]
                }`,
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
    });
  }
}
