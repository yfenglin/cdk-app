import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";

export class OrgActivitiesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Policy for modifying Organizations
    const orgPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ["*"],
          actions: [/*
            "organizations:CreateAccount",
            "organizations:DescribeOrganization",
            "organizations:CreateOrganization",
            "organizations:CreateOrganizationalUnit",
            "organizations:DescribeCreateAccountStatus",
            "organizations:MoveAccount",*/
            "iam:CreateServiceLinkedRole",
            "organizations:*"
          ],
        }),
      ],
    });

    // Attach policies to role
    const organizationsRole = new iam.Role(this, "OrganizationsRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Allow adding acccounts to Organization",
      inlinePolicies: {
        orgPolicy: orgPolicy,
      },
    });

    organizationsRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    // Lambda function to add AWS accounts to Organization
    const addAccount = new lambda.Function(this, "AddAccountHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "add-aws-accounts.handler",
      role: organizationsRole, // Attach role
    });

    const createOU = new lambda.Function(this, "CreateOUHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "create-ou.handler",
      role: organizationsRole, // Attach role
    });

    // OU creation
    const orgCreationCR = new cr.AwsCustomResource(this, "CreateOUTrigger", {
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          effect: iam.Effect.ALLOW,
          resources: [createOU.functionArn],
        }),
      ]),
      timeout: Duration.minutes(15),
      onCreate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: createOU.functionName,
          InvocationType: "Event",
          // Required: Provide Root organization id, declare parent OUs before their children
          Payload: 
          `{
            "OrganizationRootId": "r-jsik",
            "OrganizationalUnits": [
              {
                "Name": "Workload",
                "ParentName": "Root"
              },
              {
                "Name": "Network",
                "ParentName": "Root"
              },
              {
               "Name": "Prod",
               "ParentName": "Workload"
              },
              {
                "Name": "Dev",
                "ParentName": "Workload"
              }
            ]
          }`,
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
      onUpdate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: createOU.functionName,
          InvocationType: "Event",
          Payload:
          `{
            "OrganizationRootId": "r-jsik",
            "OrganizationalUnits": [
              {
                "Name": "Workload",
                "ParentName": "Root"
              },
              {
                "Name": "Network",
                "ParentName": "Root"
              },
              {
               "Name": "Prod",
               "ParentName": "Workload"
              },
              {
                "Name": "Dev",
                "ParentName": "Workload"
              }
            ]
          }`,
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
    });

    /*
    // Custom Resources to call addAccount lambda function on Create
    const accountCreationCR = new cr.AwsCustomResource(this, "AddAccountTrigger", {
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

    //lambdaTrigger.getResponseField("Payload.accCreateRes");

    /*
    const accountStatusCR = new cr.AwsCustomResource(this, 'API2', {
  onCreate: {
    service: '...',
    action: '...',
    parameters: {
      text: accountCreationCR.getResponseField("Payload.accCreateRes");
    },
    physicalResourceId: cr.PhysicalResourceId.of('...'),
  },
  policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
  }),
});
    */
  }
}
