#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevEcsClusterStack } from '../lib/dev/appStack';
import { QaEcsClusterStack } from '../lib/qa/appStack';
import { ProdEcsClusterStack } from '../lib/prod/appStack';

const app = new cdk.App();

// Dev ECS Cluster Stack
const AssessmentDevEcsClusterStack = new DevEcsClusterStack(
    app,
    'DevEcsClusterStack',
    {
        stackName: `ohme-assessment-dev-ecs-cluster-stack`,
        description: 'Dev ECS Cluster Stack',
        env: {
            account: '123456789012',
            region: 'eu-west-2',
        },
    },
);
cdk.Tags.of(AssessmentDevEcsClusterStack).add('Environment', 'dev');

// QA ECS Cluster Stack
const AssessmentQaEcsClusterStack = new QaEcsClusterStack(
    app,
    'QaEcsClusterStack',
    {
        stackName: `ohme-assessment-qa-ecs-cluster-stack`,
        description: 'QA ECS Cluster Stack',
        env: {
            account: '123456789012',
            region: 'eu-west-2',
        },
    },
);
cdk.Tags.of(AssessmentQaEcsClusterStack).add('Environment', 'qa');

// Prod ECS Cluster Stack
const AssessmentProdEcsClusterStack = new ProdEcsClusterStack(
    app,
    'ProdEcsClusterStack',
    {
        stackName: `ohme-assessment-prod-ecs-cluster-stack`,
        description: 'Prod ECS Cluster Stack',
        env: {
            account: '123456789012',
            region: 'eu-west-2',
        },
    },
);
cdk.Tags.of(AssessmentProdEcsClusterStack).add('Environment', 'prod');
