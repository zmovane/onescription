import * as evm from "./evmchains.json";
import * as cosmos from "./cosmoschains.json";

export const CHAINS_EVM: Record<string, { name: string; rpcs: string[] }> = evm;
export const CHAINS_COSMOS: Record<string, { name: string; rpcs: string[] }> = cosmos;
