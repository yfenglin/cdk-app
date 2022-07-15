import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./pipeline-stage";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Piplines declaration
    const pipelineProd = new CodePipeline(this, "PipelineProd", {
      pipelineName: "PipelineProd",
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.gitHub("yjimmyl/cdk-app", "main"),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    
    const pipelineDev = new CodePipeline(this, "PipelineDev", {
      pipelineName: "PipelineDev",
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.gitHub("yjimmyl/cdk-app", "dev"),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // Add deployment stage to pipelines
    const deployProd = new PipelineStage(this, "Deploy-prod");
    const deployStageProd = pipelineProd.addStage(deployProd);
    const deployDev = new PipelineStage(this, "Deploy-dev");
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
