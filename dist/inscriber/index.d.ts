import { ethers } from "ethers";
/**
 * Inscription: mint & deploy
 */
export type Inscription = {
    p: string;
    op: string;
    tick: string;
    max?: string;
    lim?: string;
    amt?: string;
};
export type DeployInscription = Omit<Inscription, "amt">;
export type MintInscription = Omit<Inscription, "max" | "lim">;
/**
 * Inscribe Bot Configurations
 * @startBlock @startTimestamp
 * inscribe will start at specific block or timestamp
 *
 * @contract @functionAbi
 * must be set if minting transaction isn't a self-transaction
 *
 * @gasPrice @gasLimit
 * If not set, estimated gas will be used.
 */
export type Config = {
    startBlock?: number;
    startTimestamp?: number;
    isSelfTransaction: boolean;
    contract?: string;
    functionAbi?: string;
    secretPath?: string;
    value?: BigNumberish;
    gasPrice?: BigNumberish;
    gasLimit?: BigNumberish;
};
export type EvmConfig = Config & {
    chainId: ChainId;
};
export type CosmosConfig = Config & {
    prefix: string;
};
/**
 * on-chain Transaction
 */
export type Tx = {
    hash: string;
} | undefined;
export type BigNumberish = ethers.BigNumberish;
export type BytesLike = ethers.BytesLike;
export type ChainId = number;
export type Defferable<T> = Promise<T> | T;
export interface Provider {
    getBlockNumber(): Promise<number>;
    getGasPrice(): Promise<BigNumberish>;
    getBalance(address: string): Promise<BigNumberish>;
    estimateGas(transaction: TxRequest): Promise<BigNumberish>;
}
export interface TxRequest {
    to: string;
    from: string;
    nonce?: BigNumberish;
    gasLimit?: BigNumberish;
    gasPrice?: BigNumberish;
    data: BytesLike;
    value: BigNumberish;
    chainId?: number;
    type?: number;
    maxPriorityFeePerGas?: BigNumberish;
    maxFeePerGas?: BigNumberish;
}
export interface Signer {
    getAddress(): Promise<string>;
    sendTransaction(txRequest: TxRequest): Promise<Tx>;
}
/**
 * Abstract Inscriber
 */
export interface InscriberAbility {
    inscribe(inscription: Inscription): Promise<Tx>;
}
export interface Signable {
    loadSigner(address?: string): Defferable<Signer>;
    createSigner(): Defferable<Signer>;
    loadMnemonic(): string;
}
export declare abstract class Inscriber implements InscriberAbility, Signable {
    csvDelimiter: string;
    rpcs: string[];
    protected signer?: Signer;
    readonly config: Config;
    readonly secretPath: string;
    constructor(config: Config);
    abstract loadSigner(address?: string): Defferable<Signer>;
    abstract createSigner(): Defferable<Signer>;
    abstract inscribe(inscription: Inscription): Promise<Tx>;
    randomRpc(): string;
    loadMnemonic(address?: string): string;
}
