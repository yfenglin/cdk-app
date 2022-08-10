import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class NetworkingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const networkVpc = new ec2.Vpc(this, "network-vpc", {
      cidr: "10.0.0.0/16",
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

    const workloadVpc1 = new ec2.Vpc(this, "workload-vpc-1", {
      cidr: "10.1.0.0/16",
      natGateways: 1,
      maxAzs: 2,
    });

    const workloadVpc2 = new ec2.Vpc(this, "workload-vpc-2", {
      cidr: "10.2.0.0/16",
      natGateways: 1,
      maxAzs: 2,
    });

    const cfnVPCPeeringConnection = new ec2.CfnVPCPeeringConnection(this, "MyCfnVPCPeeringConnection", {
      peerVpcId: workloadVpc1.vpcId,
      vpcId: networkVpc.vpcId,
/*
      // the properties below are optional
      peerOwnerId: "peerOwnerId",
      peerRegion: "peerRegion",
      peerRoleArn: "peerRoleArn",
      tags: [
        {
          key: "key",
          value: "value",
        },
      ],*/
    });

/*
    const table = new dynamodb.Table(this, id, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.NUMBER },
      pointInTimeRecovery: true, // Enables continuous backups
    });

    declare const vpc: ec2.Vpc;
    const instance = new rds.DatabaseInstance(this, "Instance", {
      engine: rds.DatabaseInstanceEngine.oracleSe2({ version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 }),
      // optional, defaults to m5.large
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
      credentials: rds.Credentials.fromGeneratedSecret("syscdk"), // Optional - will default to 'admin' username and generated password
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    });*/
  }
}
