import {OrgActivitiesStack} from "./org-activities-stack";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
/*
    const testLambda = new lambda.Function(this, "TestLambdaFunc", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "testlam.handler",
    });*/

    // Add and move accounts and OUs in AWS Organizations
    const orgActivitiesStack = new OrgActivitiesStack(this, "OrgActivitiesStack");

  }
}
