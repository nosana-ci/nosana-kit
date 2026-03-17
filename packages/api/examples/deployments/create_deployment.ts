import { NosanaApi } from '../../src/index.js';

import { NGINX_JOB, HELLO_JOB } from './jobs';

export async function createDeployment(client: NosanaApi) {

  const deployment = await client.deployments.create({
    name: 'my first deployment',
    market: '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq',
    replicas: 1,
    timeout: 60,
    strategy: 'SIMPLE',
    job_definition: HELLO_JOB,
  });

  return deployment;
}
