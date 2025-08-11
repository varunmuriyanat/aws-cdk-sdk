import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class GlueWorkflowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // IAM Role for Glue Jobs
    const glueRole = new iam.Role(this, 'GlueJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
    });

    glueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));

    glueRole.addToPolicy(new iam.PolicyStatement({
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
      role: glueRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: 's3://com.varunmuriyanat-scripts/glue-scripts/glue_job_01.py',
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

    // Glue Job 2 (depends on Job1)
    const job2 = new glue.CfnJob(this, 'Job2', {
      name: 'MyGlueJob2',
      role: glueRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: 's3://com.varunmuriyanat-scripts/glue-scripts/glue_job_02.py',
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

    // // Glue Workflow
    // const workflow = new glue.CfnWorkflow(this, 'MyWorkflow', {
    //   name: 'MyGlueWorkflow',
    // });

    // // Trigger for Job1 - scheduled every day at 1 AM UTC
    // const trigger1 = new glue.CfnTrigger(this, 'Trigger1', {
    //   name: 'TriggerJob1',
    //   workflowName: workflow.name,
    //   type: 'SCHEDULED',
    //   schedule: 'cron(0 1 * * ? *)',
    //   actions: [{ jobName: job1.name! }],
    //   startOnCreation: true,
    // });

    // // Trigger for Job2 - runs after Job1 succeeds
    // const trigger2 = new glue.CfnTrigger(this, 'Trigger2', {
    //   name: 'TriggerJob2',
    //   workflowName: workflow.name,
    //   type: 'CONDITIONAL',
    //   actions: [{ jobName: job2.name! }],
    //   predicate: {
    //     conditions: [
    //       {
    //         jobName: job1.name!,
    //         state: 'SUCCEEDED',
    //         logicalOperator: 'EQUALS',
    //       },
    //     ],
    //   },
    //   startOnCreation: true,
    // });

  }
}
