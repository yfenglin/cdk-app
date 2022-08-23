import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class BasicVpcStack extends Stack {
  constructor(scope: Construct, id: string, vpcName: string, cidr: string, props?: StackProps) {
    super(scope, id, props);

    // Hardcoded TGW id
    const transitGatewayAttrId = "tgw-04295f91eb5aa8c5d";

    // VPC with isolated subnet
    const vpc = new ec2.Vpc(this, vpcName, {
      cidr,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "isolated-subnet-1",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Attach VPC to the TGW
    const transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `${vpcName}CfnTransitGatewayAttachment`,
      {
        vpcId: vpc.vpcId,
        subnetIds: [vpc.isolatedSubnets[0].subnetId],
        transitGatewayId: transitGatewayAttrId,
      }
    );

    // New route table
    const routeTable = new ec2.CfnRouteTable(this, vpcName + "RouteTable", {
      vpcId: vpc.vpcId,
    });

    // Route traffic to network VPC through TGW
    const workloadCfnRouteTGW = new ec2.CfnRoute(this, `${vpcName}CfnRouteTGW`, {
      routeTableId: routeTable.attrRouteTableId,
      destinationCidrBlock: "10.0.0.0/8",
      transitGatewayId: transitGatewayAttrId,
    });
    workloadCfnRouteTGW.addDependsOn(transitGatewayAttachment); // VPC has to be attached to TGW first, or else we get an error

    // Associate new route table with VPC's subnets
    for (let i = 0; i < vpc.isolatedSubnets.length; i++) {
      let subnet = vpc.isolatedSubnets[i];
      const routeTableAssoc = new ec2.CfnSubnetRouteTableAssociation(this, `routeTableAssoc-${vpcName}-subnet-${i}`, {
        subnetId: subnet.subnetId,
        routeTableId: routeTable.attrRouteTableId,
      });
    }
  }
}
