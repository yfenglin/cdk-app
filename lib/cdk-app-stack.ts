import { OrgActivitiesStack } from "./org-activities-stack";
import { NetworkingStack } from "./networking-stack";
import { BasicVpcStack } from "./basic-vpc-stack";
import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Add and move accounts and OUs in AWS Organizations
    const orgActivitiesStack = new OrgActivitiesStack(this, "OrgActivitiesStack", {
      env: {
        region: "us-east-1", // Set to us-east-1 since Organizations is global anyways and not available in ca-central-1
      },
    });
    //let organizationsActivitiesResults = JSON.parse(orgActivitiesStack.orgCreationBody);

    // Network
    const networkingStack = new NetworkingStack(this, "NetworkingStack", "network-vpc", "10.0.0.0/16", {
      env: {
        //account: "386541670073",
        //region: "ca-central-1",
      },
    });

    const workloadVpc1 = new BasicVpcStack(this, "WorkloadVpcStack1", "workload-vpc-1", "10.1.0.0/16", {
      env: {
        //account: "745290997975",
        //region: "ca-central-1",
      },
    });

    const workloadVpc2 = new BasicVpcStack(this, "WorkloadVpcStack2", "workload-vpc-2", "10.2.0.0/16", {
      env: {
        //account: "389681141134",
        //region: "ca-central-1",
      },
    });

    // 👇 create RDS instance
    const dbInstance = new rds.DatabaseInstance(this, "db-instance", {
      vpc: networkingStack.vpc,
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

    let vpcsStacks = [networkingStack, workloadVpc1, workloadVpc2];

    const cfnTransitGateway = new ec2.CfnTransitGateway(
      this,
      "MyCDKCfnTransitGateway"
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

    /*let vpcsAttachments = [];
    for (let i = 0; i < vpcsStacks.length; i++){
    }*/
    // Attach VPCs to the TGW
    const networkTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "NetworkCfnTransitGatewayAttachment",
      {
        subnetIds: [networkingStack.vpc.publicSubnets[0].subnetId, networkingStack.vpc.publicSubnets[1].subnetId],
        transitGatewayId: cfnTransitGateway.attrId,
        vpcId: networkingStack.vpc.vpcId,
      }
    );
    const workload1TransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "Workload1CfnTransitGatewayAttachment",
      {
        subnetIds: [workloadVpc1.vpc.isolatedSubnets[0].subnetId],
        transitGatewayId: cfnTransitGateway.attrId,
        vpcId: workloadVpc1.vpc.vpcId,
      }
    );
    const workload2TransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "Workload2CfnTransitGatewayAttachment",
      {
        subnetIds: [workloadVpc2.vpc.isolatedSubnets[0].subnetId],
        transitGatewayId: cfnTransitGateway.attrId,
        vpcId: workloadVpc2.vpc.vpcId,
      }
    );
  }
}
