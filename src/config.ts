import { readYaml } from "./utils";

type ChainsConfig = Record<string, { name: string, rpcs: string[] }>;

export const CHAINS_EVM = readYaml<ChainsConfig>("evmchains.config.yaml");
export const CHAINS_COSMOS = readYaml<ChainsConfig>("cosmoschains.config.yaml");