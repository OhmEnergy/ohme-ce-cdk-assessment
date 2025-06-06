import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as asg from 'aws-cdk-lib/aws-autoscaling';

export class ProdEcsClusterStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC Lookup and Subnet Selection
        const vpc = ec2.Vpc.fromLookup(this, 'VpcLookUp', {
            vpcName: 'ohme-assessment-prod-vpc',
        });

        const publicSubnets = vpc.selectSubnets({
            subnetGroupName: 'Public Subnet',
        });

        // Security Group -> Application Load Balancer SG
        const albSg = new ec2.SecurityGroup(this, 'ALB-SG', {
            securityGroupName: 'ohme-assessment-prod-alb-security-group',
            description:
                'The public facing security group for the application load balancer.',
            vpc: vpc,
            allowAllOutbound: false,
        });

        // ALB Inbound Traffic
        albSg.addIngressRule(
            ec2.Peer.ipv4('0.0.0.0/0'),
            ec2.Port.allTcp(),
            'Allow all inbound traffic',
        );

        // ALB Outbound Traffic
        albSg.addEgressRule(
            ec2.Peer.ipv4('0.0.0.0/0'),
            ec2.Port.allTcp(),
            'Allow all outbound traffic.',
        );

        // Security Group -> Auto Scaling Group SG
        const asgSg = new ec2.SecurityGroup(this, 'ASG-SG', {
            securityGroupName: 'ohme-assessment-prod-asg-security-group',
            description: 'The security group for the auto scaling group.',
            vpc: vpc,
            allowAllOutbound: false,
        });

        // ASG Inbound Traffic
        asgSg.addIngressRule(
            ec2.Peer.ipv4('0.0.0.0/0'),
            ec2.Port.allTcp(),
            'Allow all inbound traffic',
        );

        // ASG Outbound Traffic
        asgSg.addEgressRule(
            ec2.Peer.ipv4('0.0.0.0/0'),
            ec2.Port.allTcp(),
            'Allow all outbound traffic.',
        );

        // Application Load Balancer
        const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
            loadBalancerName: `ohme-assessment-prod-alb`,
            internetFacing: true,
            vpc,
            vpcSubnets: publicSubnets,
            securityGroup: albSg,
        });

        // ALB Listener
        alb.addListener('Listener-80', {
            port: 80,
            open: false,
            /**
             * A default action is required for the ALB listener. This is a
             * catch-all action that returns a 200 response to the client. See
             * https://github.com/aws/aws-cdk/issues/12015 for more information.
             */
            defaultAction: elbv2.ListenerAction.fixedResponse(200, {
                messageBody: 'This is the ALB Default Action on port 80.',
            }),
        });

        // IAM Role
        const asgIamRole = new iam.Role(this, 'ASG-Iam-Role', {
            roleName: 'ohme-assessment-prod-asg-iam-role',
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        });

        asgIamRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                'AmazonSSMManagedInstanceCore',
            ),
        );

        // Launch Template
        const launchTemplate = new ec2.LaunchTemplate(this, 'Launch-Template', {
            launchTemplateName: 'ohme-assessment-prod-launch-template',
            machineImage: ecs.EcsOptimizedImage.amazonLinux2023(
                // AWS Graviton hardware type
                ecs.AmiHardwareType.ARM,
            ),
            userData: ec2.UserData.forLinux(),
            role: asgIamRole,
            securityGroup: asgSg,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T4G,
                ec2.InstanceSize.MEDIUM,
            ),
        });

        // Auto Scaling Group
        const asgGroup = new asg.AutoScalingGroup(this, 'ASG', {
            autoScalingGroupName: 'ohme-assessment-prod-asg',
            vpc: vpc,
            vpcSubnets: publicSubnets,
            launchTemplate: launchTemplate,
            minCapacity: 1,
            maxCapacity: 4,
        });

        // Capacity Provider
        const capacityProvider = new ecs.AsgCapacityProvider(
            this,
            'AsgCapacityProvider',
            {
                capacityProviderName: 'ohme-assessment-prod-capacity-provider',
                autoScalingGroup: asgGroup,
                enableManagedScaling: true,
                enableManagedTerminationProtection: true,
                enableManagedDraining: true,
            },
        );

        // ECS Cluster
        const ecsCluster = new ecs.Cluster(this, 'EcsCluster', {
            vpc: vpc,
            clusterName: 'ohme-assessment-prod-ecs-cluster',
        });
        ecsCluster.addAsgCapacityProvider(capacityProvider);
    }
}
