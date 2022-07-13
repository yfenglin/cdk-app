import { CdkIacAppStack } from './cdk-iac-app-stack';
import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class IacPipelineStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const stack = new CdkIacAppStack(this, "IacStack");
  }
}
