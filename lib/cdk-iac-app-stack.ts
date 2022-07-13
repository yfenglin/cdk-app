import {OrgActivitiesStack} from "./org-activities-stack";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkIacAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Add accounts to Organization
    //const addAccountsStack = new OrgActivitiesStack(this, "OrgActivitiesStack");

  }
}
