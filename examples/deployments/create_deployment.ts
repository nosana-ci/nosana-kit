import { NosanaClient } from '../../src';

import { NGINX_JOB, HELLO_JOB } from './jobs';

export async function createDeployment(client: NosanaClient) {

  const deployment = await client.api.deployments.create({
    name: 'my first deployment',
    market: '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq',
    replicas: 1,
    timeout: 60,
    strategy: 'SIMPLE',
    job_definition: HELLO_JOB,
  });

  return deployment;
}
