import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ecsPatterns = require('@aws-cdk/aws-ecs-patterns');
import route53 = require('@aws-cdk/aws-route53');
import acm = require('@aws-cdk/aws-certificatemanager');
import cdk = require('@aws-cdk/core');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Fargate Cluster
    // NOTE: Limit AZs to avoid reaching resource quotas
    const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'R53Zone', {
      zoneName: 'jasonumiker.com',
      hostedZoneId: 'Z3MGKRT2K1FTPC'
    })
    const cert = acm.Certificate.fromCertificateArn(this, 'Cert', "arn:aws:acm:ap-southeast-2:505070718513:certificate/4acc2716-8555-49ec-adec-8f565c135eee");

    // Instantiate Fargate Service with just cluster and image
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'nyan-service', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../nyan-cat'),
      },
      domainName: "nyancat-cdk.jasonumiker.com",
      domainZone: zone,
      certificate: cert,
    });
  }
}
