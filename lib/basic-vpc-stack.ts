import { Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class BasicVpcStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    vpcName: string,
    cidr: string,
    props?: StackProps
  ) {
    super(scope, id, props);

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

    const routeTable = new ec2.CfnRouteTable(this, vpcName + "RouteTable", {
      vpcId: vpc.vpcId,
    });

    const transitGatewayAttrId = Fn.importValue('tgwId');

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
    //transitGatewayAttachment.addDependsOn(transitGateway);

    // Route other traffic to network VPC through TGW
    const workloadCfnRouteTGW = new ec2.CfnRoute(this, `${vpcName}CfnRouteTGW`, {
      routeTableId: routeTable.attrRouteTableId,
      destinationCidrBlock: "10.0.0.0/8",
      transitGatewayId: transitGatewayAttrId,
    });
    //workloadCfnRouteTGW.addDependsOn(transitGateway);
    //workloadCfnRouteTGW.addDependsOn(networkTransitGatewayAttachment); // VPC has to be attached to TGW first, else we get an error

    /*
  // Default routes
  const workloadCfnRoute = new ec2.CfnRoute(this, `${vpcName}CfnRoute`, {
    routeTableId: routeTable.attrRouteTableId,
    destinationCidrBlock: cidr,
    localGatewayId:
  });*/

    // Associate new route table with VPC's subnets
    for (let y = 0; y < vpc.isolatedSubnets.length; y++) {
      let subnet = vpc.isolatedSubnets[y];
      const routeTableAssoc = new ec2.CfnSubnetRouteTableAssociation(this, `routeTableAssoc-${vpcName}-subnet-${y}`, {
        subnetId: subnet.subnetId,
        routeTableId: routeTable.attrRouteTableId,
      });
    }
  }
}
