#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ImageAnalysisStack } from '../lib/image-analysis-api-stack';

const app = new cdk.App();
new ImageAnalysisStack(app, 'ImageAnalysisApiStack', {

});