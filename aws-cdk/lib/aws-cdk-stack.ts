import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import { Construct } from 'constructs';
 
export class AwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define parameters
    const bucketNameParam = new cdk.CfnParameter(this, 'BucketName', {
      type: 'String',
      description: 'The name of the S3 bucket',
      default: 'com.varunmuriyanat.input-files',
    });

    const crawlerNameParam = new cdk.CfnParameter(this, 'CrawlerName', {
      type: 'String',
      description: 'The name of the Glue crawler',
      default: 'input-files-crawler',
    });

    const s3Bucket = new s3.Bucket(this, 'muriyanv', {
      bucketName: bucketNameParam.valueAsString,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    s3Bucket.grantRead(new iam.AccountRootPrincipal());

    // Glue database
    const glueDatabase = new glue.CfnDatabase(this, 'MyGlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: 'landing_db'
      }
    });

    // Glue service role
    const glueRole = new iam.Role(this, 'GlueCrawlerRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole')
      ]
    });
    s3Bucket.grantRead(glueRole);

    // Glue crawler
    new glue.CfnCrawler(this, 'MyGlueCrawler', {
      role: glueRole.roleArn,
      databaseName: glueDatabase.ref,
      targets: {
        s3Targets: [
          { path: `s3://${s3Bucket.bucketName}/` }
        ]
      },
      name: crawlerNameParam.valueAsString
    });
  }
}
 
const app = new cdk.App();
new AwsCdkStack(app, 'S3BucketStack');
app.synth();