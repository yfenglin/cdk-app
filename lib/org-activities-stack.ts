import { CustomResource, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";
const fs = require("fs");

export class OrgActivitiesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const organizationConfig = JSON.parse(fs.readFileSync("./aws_config/organization.json", "utf8"));

    // Policy for modifying Organizations
    const orgPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ["*"],
          actions: [
            "organizations:CreateAccount",
            "organizations:CreateOrganizationalUnit",
            "organizations:DescribeOrganization",
            "organizations:DescribeOrganizationalUnit",
            "organizations:DescribeCreateAccountStatus",
            "organizations:ListOrganizationalUnitsForParent",
            "organizations:MoveAccount",
            "iam:CreateServiceLinkedRole",
          ],
        }),
      ],
    });

    // Attach policies to role
    const organizationsRole = new iam.Role(this, "OrganizationsRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Allow modifying Organization",
      inlinePolicies: {
        orgPolicy: orgPolicy,
      },
    });
    organizationsRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
    );

    // Lambda function to create OUs, add AWS accounts to Organization, and move those accounts to OUs
    const createOrg = new lambda.Function(this, "CreateOrgHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: Duration.minutes(10),
      code: lambda.Code.fromAsset("lambda"),
      handler: "create-org.handler",
      role: organizationsRole, // Attach role
    });

    // Provider that invokes OUHandler
    const orgCreationProvider = new cr.Provider(this, "OrgCreationProvider", {
      onEventHandler: createOrg,
    });

    // Custom Resource using provider
    const orgCreationCR = new CustomResource(this, "OrgCreationTrigger", {
      serviceToken: orgCreationProvider.serviceToken,
      properties: organizationConfig,
    });

    // Values returned from the custom resource
    const orgFunction = orgCreationCR.getAtt("body").toString();
  }
}
