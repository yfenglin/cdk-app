#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, "CdkAppPipelineStack", "Prod", "main", {
    env: {
        region: 'us-east-1',
      }
});
/*
new PipelineStack(app, "CdkAppPipelineStackDev", "Dev", "dev", {
  env: {
      region: 'us-east-1',
    }
});*/