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

    // Networking
    const networkingVpc = new NetworkingStack(this, "NetworkingStack", "network-vpc", "10.0.0.0/16", {
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

    const workloadVpcs = [workloadVpc1, workloadVpc2];

    // create RDS instance
    const dbInstance = new rds.DatabaseInstance(this, "db-instance", {
      vpc: networkingVpc.vpc,
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

    let vpcsStacks = [networkingVpc, workloadVpc1, workloadVpc2];

    const transitGateway = new ec2.CfnTransitGateway(this, "MainCfnTransitGateway");

    // Attach network VPC to the TGW
    const networkTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "NetworkCfnTransitGatewayAttachment",
      {
        subnetIds: [networkingVpc.vpc.publicSubnets[0].subnetId, networkingVpc.vpc.publicSubnets[1].subnetId],
        transitGatewayId: transitGateway.attrId,
        vpcId: networkingVpc.vpc.vpcId,
      }
    );

    // For workload VPCs
    for (let i = 0; i < workloadVpcs.length; i++) {
      let vpc = workloadVpcs[i].vpc;
      let routeTable = workloadVpcs[i].routeTable;
      let vpcName = workloadVpcs[i].vpcName;
      let cidr = workloadVpcs[i].cidr;

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

      // Default routes
      const workloadCfnRoute = new ec2.CfnRoute(this, `${vpcName}CfnRoute`, {
        routeTableId: routeTable.attrRouteTableId,
        destinationCidrBlock: cidr,
      });

      // Route other traffic to network VPC through TGW
      const workloadCfnRouteTGW = new ec2.CfnRoute(this, `${vpcName}CfnRouteTGW`, {
        routeTableId: routeTable.attrRouteTableId,
        destinationCidrBlock: "10.0.0.0/8",
        transitGatewayId: transitGateway.attrId,
      });
      workloadCfnRouteTGW.addDependsOn(transitGateway);

      // Associate new route table with VPC's subnets
      for (let y = 0; y < workloadVpcs[i].vpc.isolatedSubnets.length; y++) {
        let subnet = vpc.isolatedSubnets[y];
        const routeTableAssoc = new ec2.CfnSubnetRouteTableAssociation(
          this,
          `${subnet.subnetId}_${routeTable.attrRouteTableId}`,
          {
            subnetId: subnet.subnetId,
            routeTableId: routeTable.attrRouteTableId,
          }
        );
      }
    }
    /*
    const workload1TransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "Workload1CfnTransitGatewayAttachment",
      {
        subnetIds: [workloadVpc1.vpc.isolatedSubnets[0].subnetId],
        transitGatewayId: transitGateway.attrId,
        vpcId: workloadVpc1.vpc.vpcId,
      }
    );
    const workload2TransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "Workload2CfnTransitGatewayAttachment",
      {
        subnetIds: [workloadVpc2.vpc.isolatedSubnets[0].subnetId],
        transitGatewayId: transitGateway.attrId,
        vpcId: workloadVpc2.vpc.vpcId,
      }
    );*/

    /*
    // Default routes
    const Workload1CfnRoute = new ec2.CfnRoute(this, "Workload1CfnRoute", {
      routeTableId: workloadVpc1.routeTable.attrRouteTableId,
      destinationCidrBlock: workloadVpc1.cidr,
    });
    const Workload2CfnRoute = new ec2.CfnRoute(this, "Workload1CfnRoute", {
      routeTableId: workloadVpc2.routeTable.attrRouteTableId,
      destinationCidrBlock: workloadVpc2.cidr,
    });*/

    /*
    // Route workload traffic to network VPC through TGW
    const Workload1CfnRouteTGW = new ec2.CfnRoute(this, "Workload1CfnRoute", {
      routeTableId: workloadVpc1.routeTable.attrRouteTableId,
      destinationCidrBlock: "10.0.0.0/8",
      transitGatewayId: transitGateway.attrId,
    });
    Workload1CfnRouteTGW.addDependsOn(transitGateway);

    const Workload2CfnRouteTGW = new ec2.CfnRoute(this, "Workload1CfnRoute", {
      routeTableId: workloadVpc2.routeTable.attrRouteTableId,
      destinationCidrBlock: "10.0.0.0/8",
      transitGatewayId: transitGateway.attrId,
    });
    Workload2CfnRouteTGW.addDependsOn(transitGateway);
*/

    // Replace default VPC route tables
  }
}
