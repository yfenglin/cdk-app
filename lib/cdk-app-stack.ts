import { OrgActivitiesStack } from "./org-activities-stack";
import { NetworkingStack } from "./networking-stack";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Add and move accounts and OUs in AWS Organizations
    const orgActivitiesStack = new OrgActivitiesStack(this, "OrgActivitiesStack");
    //let orgReturn = JSON.parse(orgActivitiesStack.orgCreationBody);

    // Network
    const networkingStack = new NetworkingStack(this, "NetworkingStack");
  }
}
