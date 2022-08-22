import { OrgActivitiesStack } from "./org-activities-stack";
import { NetworkingStack } from "./networking-stack";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

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

    // Networking
    const networkingVpc = new NetworkingStack(this, "NetworkingStack", "network-vpc", "10.0.0.0/16", {
      env: {
        account: "386541670073",
        //region: "ca-central-1",
      },
    });

    /*
    // For workload VPCs
    for (let i = 0; i < workloadVpcs.length; i++) {
      let vpc = workloadVpcs[i].vpc;
      let routeTable = workloadVpcs[i].routeTable;
      let vpcName = workloadVpcs[i].vpcName;
      //let cidr = workloadVpcs[i].cidr;

      // Attach VPC to the TGW
      const transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
        this,
        `${vpcName}CfnTransitGatewayAttachment`,
        {
          vpcId: vpc.vpcId,
          subnetIds: [vpc.isolatedSubnets[0].subnetId],
          transitGatewayId: transitGateway.attrId,
        }
      );
      transitGatewayAttachment.addDependsOn(transitGateway);

      /*
      // Default routes
      const workloadCfnRoute = new ec2.CfnRoute(this, `${vpcName}CfnRoute`, {
        routeTableId: routeTable.attrRouteTableId,
        destinationCidrBlock: cidr,
        localGatewayId:
      });*

      // Route other traffic to network VPC through TGW
      const workloadCfnRouteTGW = new ec2.CfnRoute(this, `${vpcName}CfnRouteTGW`, {
        routeTableId: routeTable.attrRouteTableId,
        destinationCidrBlock: "10.0.0.0/8",
        transitGatewayId: transitGateway.attrId,
      });
      workloadCfnRouteTGW.node.addDependency(transitGateway);
      workloadCfnRouteTGW.addDependsOn(networkTransitGatewayAttachment); // VPC has to be attached to TGW first, else we get a

      // Associate new route table with VPC's subnets
      for (let y = 0; y < vpc.isolatedSubnets.length; y++) {
        let subnet = vpc.isolatedSubnets[y];
        const routeTableAssoc = new ec2.CfnSubnetRouteTableAssociation(this, `routeTableAssoc-${vpcName}-subnet-${y}`, {
          subnetId: subnet.subnetId,
          routeTableId: routeTable.attrRouteTableId,
        });
      }
    }*/
  }
}
