import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve('.env.local');
const generatedPath = resolve('src/generated/deployments.json');

if (!existsSync(envPath) || !existsSync(generatedPath)) {
  throw new Error('Scaffold environment or generated deployment metadata is missing.');
}

const env = readFileSync(envPath, 'utf8');
const network = env.match(/^NEXT_PUBLIC_NETWORK=(.+)$/m)?.[1]?.trim();
const contractId = env.match(/^NEXT_PUBLIC_ALIMONY_CONTRACT_ID=(.+)$/m)?.[1]?.trim();

if (!network || !contractId) {
  throw new Error('Set NEXT_PUBLIC_NETWORK and NEXT_PUBLIC_ALIMONY_CONTRACT_ID in frontend/.env.local.');
}

if (!/^[ST][A-Z0-9]{38,40}\.alimony-agreement$/.test(contractId)) {
  throw new Error('NEXT_PUBLIC_ALIMONY_CONTRACT_ID is not an alimony-agreement contract principal.');
}

const deployments = JSON.parse(readFileSync(generatedPath, 'utf8'));
deployments.network = network;
deployments.deployed_at ||= 'imported-existing-deployment';
deployments.contracts ??= {};
deployments.contracts['alimony-agreement'] = { contract_id: contractId };

writeFileSync(generatedPath, `${JSON.stringify(deployments, null, 2)}\n`);