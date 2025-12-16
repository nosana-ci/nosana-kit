// @ts-nocheck
import { NosanaClient } from '../../src/index.js';
import { createTestClient } from './utils/createTestClient.js';
import { createDeployment } from './create_deployment.js';
import { HELLO_JOB } from './jobs/index.js';
import { ApiDeployment, Deployment } from '@nosana/api';

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const client: NosanaClient = await createTestClient();

const args = process.argv.slice(2);

console.log(`Running deployment command: ${args.join(' ')}`);

async function command() {
  let deployment: ApiDeployment |  | undefined = undefined;
  switch (args[0]) {
    case 'listVaults':
      return await client.api.deployments.vaults.list();
    case 'createVault':
      return await client.api.deployments.vaults.create();
    case 'create':
      return await createDeployment(client);
    case 'list':
      return await client.api.deployments.list();
    case 'get':
      return await client.api.deployments.get(args[1]);
    case 'tasks':
      const dep = await client.api.deployments.get(args[1]);
      console.log(await dep.getTasks());
      break;
    case 'start':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.start();
      return deployment;
    case 'stop':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.stop();
      return deployment;
    case 'updateTimeout':
      deployment = await client.api.deployments.pipe(args[1], (deployment) =>
        deployment.updateTimeout(60 * 10),
      );
      return deployment;
    case 'archive':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.archive();
      return deployment;
    case 'balance':
      deployment = await client.api.deployments.get(args[1]);
      return await deployment.vault.getBalance();
    case 'topup':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.vault.topup({ SOL: 0.015, NOS: 0.5 });
      return await deployment.vault.getBalance();
    case 'header':
      deployment = await client.api.deployments.get(args[1]);
      console.log(await deployment.generateAuthHeader());
      return;
    case 'getJob':
      deployment = await client.api.deployments.get(args[1]);
      console.log(await deployment.getJob(args[2]));
      return;
    case 'withdraw':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.vault.withdraw();
      return await deployment.vault.getBalance();
    case 'withdraw-all':
      const deployments = await client.api.deployments.list();
      for (const deployment of deployments) {
        await deployment.vault.withdraw().catch(() => { });
      }
      return;
    case 'balance-all':
      const deploymentsb = await client.api.deployments.list();
      for (const deployment of deploymentsb) {
        console.log(await deployment.vault.getBalance().catch(() => { }));
      }
      return;
    case 'createRevision':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.createRevision(HELLO_JOB);
      return deployment;
    case 'updateActiveRevision':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.updateActiveRevision(parseInt(args[2], 10));
      return deployment;
    case 'updateSchedule':
      deployment = await client.api.deployments.get(args[1]);
      await deployment.updateSchedule(args[2]);
      return deployment;
    case 'createAndDeploy':
      return await client.api.deployments.pipe(
        {
          name: 'my first deployment',
          market: 'rdRYm53F9nj7VWenCvuJw4Zf85KEo5op9kAiQk52kFh',
          replicas: 1,
          timeout: 60,
          strategy: 'SIMPLE',
          job_definition: HELLO_JOB,
        },
        async (deployment) => {
          console.log(`Successfully created deployment ${deployment.id}`);
          console.log('Topping up deployment vault');
          await deployment.vault.topup({ SOL: 0.015, NOS: 0.5 });
        },
        async (deployment) => {
          console.log('Starting deployment');
          await deployment.start();
        },
        async (deployment) => {
          console.log('Waiting 30 seconds for job to be deployed');
          await sleep(30);
          deployment = await client.api.deployments.get(deployment.id);
        },
        async (deployment) => {
          await sleep(5);
          console.log(`Withdrawing all tokens from vault`);
          await deployment.vault.withdraw();
        },
      );
  }
}

console.log(await command());
