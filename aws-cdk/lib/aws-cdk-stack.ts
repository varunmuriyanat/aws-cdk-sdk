import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as emr from 'aws-cdk-lib/aws-emr';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    const validateLambda = new lambda.Function(this, 'ValidateLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'validate.handler', // filename.handlerFunction
      code: lambda.Code.fromAsset('lambda/validate'), // directory with your code
      timeout: cdk.Duration.seconds(10),
    });

    // not covered under the free plan
    // // Basic EMR cluster
    // new emr.CfnCluster(this, 'MyEmrCluster', {
    //   name: 'basic-emr-cluster',
    //   releaseLabel: 'emr-6.15.0', // Use a recent EMR release
    //   applications: [
    //     { name: 'Hadoop' },
    //     { name: 'Spark' }
    //   ],
    //   instances: {
    //     masterInstanceGroup: {
    //       instanceCount: 1,
    //       instanceType: 'm5.xlarge',
    //     },
    //     coreInstanceGroup: {
    //       instanceCount: 2,
    //       instanceType: 'm5.xlarge',
    //     },
    //     ec2SubnetId: 'subnet-xxxxxxxx', // Replace with your subnet ID
    //     ec2KeyName: 'my-key-pair', // Optional: replace with your EC2 key pair name
    //   },
    //   jobFlowRole: 'EMR_EC2_DefaultRole',
    //   serviceRole: 'EMR_DefaultRole',
    //   visibleToAllUsers: true,
    //   logUri: 's3://com.varunmuriyanat-emr-logs/',
    // });

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
      name: crawlerNameParam.valueAsString,
      schedule: {
        scheduleExpression: 'cron(0 2 * * ? *)', // every day at 2 AM UTC
      },
      recrawlPolicy: {
        recrawlBehavior: 'CRAWL_NEW_FOLDERS_ONLY',
      },
    });

    // IAM Role for Glue Jobs
        const glueJobRole = new iam.Role(this, 'GlueJobRole', {
          assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
        });
    
        glueJobRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));    

        glueJobRole.addToPolicy(new iam.PolicyStatement({
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket",
          ],
          resources: [
            "arn:aws:s3:::com.varunmuriyanat-scripts",
            "arn:aws:s3:::com.varunmuriyanat-scripts/*",
            "arn:aws:s3:::com.varunmuriyanat.output",
            "arn:aws:s3:::com.varunmuriyanat.output/*",
            "arn:aws:s3:::com.varunmuriyanat.input",
            "arn:aws:s3:::com.varunmuriyanat.input/*"
          ],
        }));
    
        // Glue Job 1
        const job1 = new glue.CfnJob(this, 'Job1', {
          name: 'MyGlueJob1',
          role: glueJobRole.roleArn,
          command: {
            name: 'glueetl',
            scriptLocation: 's3://com.varunmuriyanat-scripts/glue_job_01.py',
            pythonVersion: '3',
          },
          glueVersion: '3.0',
          numberOfWorkers: 2,
          workerType: 'G.1X',
          defaultArguments: {
            '--job-language': 'python',
            '--enable-continuous-cloudwatch-log': 'true',
            '--enable-metrics': '',
          },
          maxRetries: 1,
        });
  }
}
 
const app = new cdk.App();
new AwsCdkStack(app, 'S3BucketStack');
app.synth();