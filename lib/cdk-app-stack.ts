import { OrgActivitiesStack } from "./org-activities-stack";
import { NetworkingStack } from "./networking-stack";
import { BasicVpcStack } from "./basic-vpc-stack";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Add and move accounts and OUs in AWS Organizations
    const orgActivitiesStack = new OrgActivitiesStack(this, "OrgActivitiesStack");
    //let orgReturn = JSON.parse(orgActivitiesStack.orgCreationBody);

    // Network
    const networkingStack = new NetworkingStack(this, "NetworkingStack", "network-vpc", "10.0.0.0/16", {
      env: {
        //account: "386541670073",
        region: "ca-central-1",
      },
    });

    const workloadVpc1 = new BasicVpcStack(this, "WorkloadVpcStack1", "workload-vpc-1", "10.1.0.0/16", {
      env: {
        //account: "745290997975",
        region: "ca-central-1",
      },
    });

    const workloadVpc2 = new BasicVpcStack(this, "WorkloadVpcStack2", "workload-vpc-2", "10.2.0.0/16", {
      env: {
        //account: "389681141134",
        region: "ca-central-1",
      },
    });

    const cfnTransitGateway = new ec2.CfnTransitGateway(
      this,
      "MyCfnTransitGateway",
      /* all optional props  {
        amazonSideAsn: 123,
        associationDefaultRouteTableId: "associationDefaultRouteTableId",
        autoAcceptSharedAttachments: "autoAcceptSharedAttachments",
        defaultRouteTableAssociation: "defaultRouteTableAssociation",
        defaultRouteTablePropagation: "defaultRouteTablePropagation",
        description: "description",
        dnsSupport: "dnsSupport",
        multicastSupport: "multicastSupport",
        propagationDefaultRouteTableId: "propagationDefaultRouteTableId",
        tags: [
          {
            key: "key",
            value: "value",
          },
        ],
        transitGatewayCidrBlocks: ["transitGatewayCidrBlocks"],
        vpnEcmpSupport: "vpnEcmpSupport",
      }*/
    );

    const cfnTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'MyCfnTransitGatewayAttachment', {
      subnetIds: [networkingStack.vpc.publicSubnets[0].subnetId, networkingStack.vpc.publicSubnets[1].subnetId],
      transitGatewayId: cfnTransitGateway.attrId,
      vpcId: networkingStack.vpc.vpcId,
    });
  }
}
