import { randomInt } from "crypto";
import { ethers } from "ethers";
import { readFileSync, existsSync } from "fs";
import { parse } from 'csv-parse/sync';

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
}
export type DeployInscription = Omit<Inscription, "amt">
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
}

// Currently support evm & cosmos
export type EvmConfig = Config & { chainId: ChainId };
export type CosmosConfig = Config & { prefix: string };

/**
 * on-chain Transaction
 */
export type Tx = { hash: string } | undefined;
export type BigNumberish = ethers.BigNumberish;
export type BytesLike = ethers.BytesLike;
export type ChainId = number;
export type Defferable<T> = Promise<T> | T;
export interface Provider {
  getBlockNumber(): Promise<number>;
  getGasPrice(): Promise<BigNumberish>;
  getBalance(address: string): Promise<BigNumberish>;
  estimateGas(transaction: TxRequest): Promise<BigNumberish>
}
export interface TxRequest {
  to: string,
  from: string,
  nonce?: BigNumberish,
  gasLimit?: BigNumberish,
  gasPrice?: BigNumberish,
  data: BytesLike,
  value: BigNumberish,
  chainId?: number
  type?: number;
  maxPriorityFeePerGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;
}

export interface Signer {
  getAddress(): Promise<string>
  sendTransaction(txRequest: TxRequest): Promise<Tx>
}

/**
 * Abstract Inscriber
 */
export interface InscriberAbility {
  inscribe(inscription: Inscription): Promise<Tx>
  inscribeText(data: string): Promise<Tx>
}

export interface Signable {
  connectSignerFromMnemonic(mnemonic: string): Defferable<Signable>;
  connectSignerFromPrivateKey(privateKey: string): Defferable<Signable>;

  /**
   * @param secretPath
   * Generate a new signer and automatically save the address and corresponding 
   * mnemonic to the specified path. 
   * If the path is not specified, it will be saved to secret.csv by default.
   */
  createSigner(secretPath?: string): Defferable<Signable>;

  /**
   * @param address
   * if the address isn't set, the first address will be used as the signer.
   */
  connectSignerFromSecretCsv(address?: string): Defferable<Signable>;
  connectMnemonicFromSecretCsv(address?: string): string;
}

export abstract class Inscriber implements InscriberAbility, Signable {
  csvDelimiter = ',';
  rpcs: string[] = [];
  protected signer?: Signer;
  readonly config: Config;
  readonly secretPath: string;
  constructor(config: Config) {
    this.config = config;
    this.secretPath = config.secretPath || "./secret.csv";
  }
  abstract connectSignerFromMnemonic(mnemonic: string): Defferable<typeof this>;
  abstract connectSignerFromPrivateKey(privateKey: string): Defferable<typeof this>
  abstract connectSignerFromSecretCsv(address?: string): Defferable<typeof this>;

  abstract inscribe(inscription: Inscription): Promise<Tx>;
  abstract inscribeText(data: string): Promise<Tx>;
  abstract createSigner(secretPath?: string): Defferable<typeof this>;

  randomRpc(): string {
    return this.rpcs[randomInt(this.rpcs.length)];
  }
  connectMnemonicFromSecretCsv(address?: string): string {
    let input: string;
    let records: { address: string, mnemonic: string }[] = [];
    if (!existsSync(this.secretPath)) {
      throw Error(`${this.secretPath} not found`);
    }
    input = readFileSync(this.secretPath, 'utf-8');
    const header = 'address,mnemonic\n';
    records = parse(header + input, {
      columns: true,
      skip_empty_lines: true,
      delimiter: this.csvDelimiter,
    });
    if (records.length === 0)
      throw Error("Empty signers");
    let mnemonic: string | undefined;
    if (address) {
      const record = records.find((i) => i.address === address);
      if (!record) throw Error("Signer not found");
      mnemonic = record.mnemonic.trim();
    } else {
      mnemonic = records[0].mnemonic.trim();
    }
    return mnemonic;
  }
}