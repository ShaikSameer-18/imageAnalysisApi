import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ImageAnalysisStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for temporary image storage (optional)
    const bucket = new s3.Bucket(this, 'ImageAnalysisBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Remove bucket on stack deletion
      autoDeleteObjects: true,
    });

    // DynamoDB Table to store image analysis results
    const table = new dynamodb.Table(this, 'ImageAnalysisTable', {
      partitionKey: { name: 'imageUrl', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Lambda Function Role with permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRekognitionReadOnlyAccess'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

    // Lambda Function for Image Analysis
    const imageAnalysisLambda = new lambda.Function(this, 'ImageAnalysisLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),  // Directory for Lambda code
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
      role: lambdaRole,
    });

    // API Gateway to expose the Lambda
    const api = new apigateway.RestApi(this, 'ImageAnalysisAPI', {
      restApiName: 'Image Analysis Service',
    });

    const imageResource = api.root.addResource('analyze');
    imageResource.addMethod('POST', new apigateway.LambdaIntegration(imageAnalysisLambda));
  }
}
