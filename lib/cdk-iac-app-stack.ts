import {OrgActivitiesStack} from "./org-activities-stack";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class CdkIacAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const addAccount = new lambda.Function(this, "TestLambdaFunc", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "testlam.handler",
    });

    // Add accounts to Organization
    //const orgActivitiesStack = new OrgActivitiesStack(this, "OrgActivitiesStack");

  }
}
