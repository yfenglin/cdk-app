import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { IacPipelineStage } from "./pipeline-stage";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, "IacAppRepo", {
      repositoryName: "IacAppRepo",
    });
/*
    // Basic pipline declaration. Sets the initial structure of pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "WorkshopPipeline",
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.codeCommit(repo, "main"),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // Basic pipline declaration. Sets the initial structure of pipeline
    const pipelineDev = new CodePipeline(this, "PipelineDev", {
      pipelineName: "WorkshopPipeline",
      synth: new CodeBuildStep("SynthStep", {
        input: CodePipelineSource.codeCommit(repo, "dev"),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    const deploy = new IacPipelineStage(this, "Deploy");
    const deployStage = pipeline.addStage(deploy);
    const deployStageDev = pipelineDev.addStage(deploy);
*/
    /*
    deployStage.addPost(
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
