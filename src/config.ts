import fs from "fs";
import yaml from 'js-yaml';

const PATH_EVM_CHAINS = "evmchains.config.yaml";
const PATH_COSMOS_CHAINS = 'cosmoschains.config.yaml';

type ConfigEvmChains = Record<number, { name: string, rpcs: string[] }>;
type ConfigCosmosChains = Record<string, { name: string, rpcs: string[] }>;

export const EVM_CHAINS =
    yaml.load(fs.readFileSync(PATH_EVM_CHAINS, 'utf8')) as ConfigEvmChains;
export const COSMOS_CHAINS =
    yaml.load(fs.readFileSync(PATH_COSMOS_CHAINS, 'utf8')) as ConfigCosmosChains;