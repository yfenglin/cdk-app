import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class NetworkingStack extends Stack {
  vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, vpcName: string, cidr:string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, vpcName, {
      cidr,
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "public-subnet-1",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "public-subnet-2",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "private-subnet-1",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
        {
          name: "private-subnet-2",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
      ],
    });
  }
}
