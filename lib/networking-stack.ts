import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { BasicVpcStack } from "./basic-vpc-stack";
import { CfnResourceShare } from "aws-cdk-lib/aws-ram";

export class NetworkingStack extends Stack {
  constructor(scope: Construct, id: string, vpcName: string, cidr: string, props?: StackProps) {
    super(scope, id, props);

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

    // Our TGW for connecting VPCs
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
    networkTransitGatewayAttachment.addDependsOn(transitGateway);

    // Share TGW ID with RAM for use by workload accounts
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

    // Dev acc
    const workloadVpc1 = new BasicVpcStack(this, "WorkloadVpcStack1", "workload-vpc-1", "10.1.0.0/16", {
      env: {
        account: "745290997975",
        //region: "us-east-1",
        //region: "ca-central-1",
      },
    });
    workloadVpc1.addDependency(this);

    // Prod
    const workloadVpc2 = new BasicVpcStack(this, "WorkloadVpcStack2", "workload-vpc-2", "10.2.0.0/16", {
      env: {
        account: "389681141134",
        //region: "us-east-1",
        //region: "ca-central-1",
      },
    });
    workloadVpc2.addDependency(this);

    // create RDS instance
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
