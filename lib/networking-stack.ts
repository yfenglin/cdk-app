import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { CfnResourceShare } from "aws-cdk-lib/aws-ram";

export class NetworkingStack extends Stack {
  constructor(scope: Construct, id: string, vpcName: string, cidr: string, props?: StackProps) {
    super(scope, id, props);

    // Networking VPC
    let networkVpc = new ec2.Vpc(this, vpcName, {
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

    // TGW for connecting VPCs
    const transitGateway = new ec2.CfnTransitGateway(this, "MainCfnTransitGateway", {
      autoAcceptSharedAttachments: "enable",
    });

    // Attach Network VPC to the TGW
    const networkTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "NetworkCfnTransitGatewayAttachment",
      {
        subnetIds: [networkVpc.publicSubnets[0].subnetId, networkVpc.publicSubnets[1].subnetId],
        transitGatewayId: transitGateway.attrId,
        vpcId: networkVpc.vpcId,
      }
    );
    //networkTransitGatewayAttachment.addDependsOn(transitGateway);

    // Share TGW using RAM so it can be used by workload accounts
    const tgwArn = `arn:aws:ec2:${this.region}:${this.account}:transit-gateway/${transitGateway.attrId}`;
    new CfnResourceShare(this, "tgwRAMShare", {
      name: "networkTgwShare",
      allowExternalPrincipals: false,
      resourceArns: [tgwArn],
      principals: ["745290997975", "389681141134"],
    });

    new CfnOutput(this, "tgwIdRef", {
      value: transitGateway.attrId,
      exportName: "tgwId",
      description: "ID of the network account's transit gateway",
    });

    // RDS instance hosted in the networking VPC's private subnets
    const dbInstance = new rds.DatabaseInstance(this, "db-instance", {
      vpc: networkVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_2,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      multiAz: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 105,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: "cdkRDS",
      publiclyAccessible: false,
    });
  }
}
