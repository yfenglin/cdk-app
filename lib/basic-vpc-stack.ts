import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class BasicVpcStack extends Stack {
  vpcName: string;
  cidr: string
  vpc: ec2.Vpc;
  routeTable: ec2.CfnRouteTable;

  constructor(scope: Construct, id: string, vpcName: string, cidr: string, props?: StackProps) {
    super(scope, id, props);

    this.vpcName = vpcName;
    this.cidr = cidr;

    this.vpc = new ec2.Vpc(this, vpcName, {
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
    this.routeTable = new ec2.CfnRouteTable(this.vpc, vpcName + "RouteTable", {
      vpcId: this.vpc.vpcId,
    });
  }
}
