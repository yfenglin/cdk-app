import { Stack, StackProps } from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource, CodeBuildStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./pipeline-stage";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, env: string, branch: string, props?: StackProps) {
    super(scope, id, props);

    // Pipelines declaration
    const pipeline = new CodePipeline(this, `CodePipeline${env}`, {
      pipelineName: `Pipeline${env}`,
      crossAccountKeys: true,
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection("yjimmyl/cdk-app", branch, {
          connectionArn:
            "arn:aws:codestar-connections:us-east-1:051075623756:connection/77a15bc1-f10e-4f80-98cd-9acbed5d781f",
        }),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // Add deployment stage to pipelines
    const deploy = new PipelineStage(this, `Deploy-${env}`);
    const deployStage = pipeline.addStage(deploy);
  }
}
