import { OrgActivitiesStack } from "./org-activities-stack";
import { NetworkingStack } from "./networking-stack";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BasicVpcStack } from "./basic-vpc-stack";

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Add and move accounts and OUs in AWS Organizations
    const orgActivitiesStack = new OrgActivitiesStack(this, "OrgActivitiesStack", {
      env: {
        region: "us-east-1", // Set to us-east-1 since Organizations are not available in ca-central and changes are global anyways
      },
    });
    //let organizationsActivitiesResults = JSON.parse(orgActivitiesStack.orgCreationBody);

    // Networking VPC
    const networkingStack = new NetworkingStack(this, "NetworkingStack", "network-vpc", "10.0.0.0/16", {
      env: {
        account: "386541670073",
      },
    });

    // Workload VPCs
    const workloadVpc1 = new BasicVpcStack(this, "WorkloadVpcStack1", "workload-vpc-1", "10.1.0.0/16", {
      env: {
        account: "745290997975",
        //region: "us-east-1",
        //region: "ca-central-1",
      },
    });
    workloadVpc1.addDependency(networkingStack);

    // Prod
    const workloadVpc2 = new BasicVpcStack(this, "WorkloadVpcStack2", "workload-vpc-2", "10.2.0.0/16", {
      env: {
        account: "389681141134",
        //region: "us-east-1",
        //region: "ca-central-1",
      },
    });
    workloadVpc2.addDependency(networkingStack);
  }
}
