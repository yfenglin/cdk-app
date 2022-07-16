import { Duration, Stack, StackProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  CodeBuildStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./pipeline-stage";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Pipelines declaration
    const pipelineProd = new CodePipeline(this, "PipelineProd", {
      pipelineName: "PipelineProd",
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection("yjimmyl/cdk-app", "main", {
          connectionArn: "arn:aws:codestar-connections:us-east-1:051075623756:connection/77a15bc1-f10e-4f80-98cd-9acbed5d781f"
        }),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    const pipelineDev = new CodePipeline(this, "PipelineDev", {
      pipelineName: "PipelineDev",
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection("yjimmyl/cdk-app", "dev", {
          connectionArn: "arn:aws:codestar-connections:us-east-1:051075623756:connection/77a15bc1-f10e-4f80-98cd-9acbed5d781f"
        }),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // Add deployment stage to pipelines
    const deployProd = new PipelineStage(this, "Deploy-Prod");
    const deployStageProd = pipelineProd.addStage(deployProd);
    
    const deployDev = new PipelineStage(this, "Deploy-Dev");
    const deployStageDev = pipelineDev.addStage(deployDev);

    /*
    deployStageProd.addPost(
      new CodeBuildStep("TestAPIGatewayEndpoint", {
        projectName: "TestAPIGatewayEndpoint",
        envFromCfnOutputs: {
          ENDPOINT_URL: deploy.hcEndpoint,
        },
        commands: [
          "curl -Ssf $ENDPOINT_URL",
          "curl -Ssf $ENDPOINT_URL/hello",
          "curl -Ssf $ENDPOINT_URL/test",
        ],
      })
    );*/
  }
}
