import { ethers } from "ethers";
import { readFileSync, existsSync } from "fs";
import { parse } from 'csv-parse/sync';
import { randomInt } from "./utils";

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
export type InscriptionText = `data:${string}`

/**
 * Inscribe Bot Configurations, currently support evm & cosmos
 * 
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
  os: "evm" | "cosmos";
  startBlock?: number;
  startTimestamp?: number;
  isSelfTransaction: boolean;
  recipient?: string;
  contract?: string;
  functionAbi?: string;
  secretPath?: string;
  value?: BigNumberish;
  gasPrice?: BigNumberish;
  gasLimit?: BigNumberish;
}

/**
 * on-chain Transaction
 */
export type Tx = { hash?: string, err?: any };
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
  getAddress(): Promise<string>;
  connect(provider: Provider): Signer | undefined;
  sendTransaction(txRequest: TxRequest): Promise<Tx>;
}

/**
 * Abstract Inscriber
 */
export interface InscriberAbility {
  inscribe(inscription: Inscription): Promise<Tx>
  inscribeText(data: string): Promise<Tx>
}

export interface Signable {
  connectSigner(signer: Signer): Defferable<Signable>;
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
  connectSignerFromSecretCsv(options: { secretpath?: string; address?: string }): Defferable<Signable>;
}

export interface ChainInfoProvider {
  getBlockHeight(): Promise<number>
}

export abstract class Inscriber implements InscriberAbility, Signable, ChainInfoProvider {
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
  abstract connectSignerFromSecretCsv(options: { secretpath?: string; address?: string }): Defferable<typeof this>;

  abstract inscribe(inscription: Inscription): Promise<Tx>;
  abstract inscribeText(data: string): Promise<Tx>;
  abstract createSigner(secretPath?: string): Defferable<typeof this>;

  abstract getBlockHeight(): Promise<number>;

  randomRpc(): string {
    return this.rpcs[randomInt(0, this.rpcs.length - 1)];
  }

  connectSigner(signer: Signer): Defferable<this> {
    this.signer = signer;
    return this;
  }

  protected readMnemonicFromSecretCsv(options?: { secretPath?: string; address?: string }): string {
    let input: string;
    let records: { address: string, mnemonic: string }[] = [];
    const secretPath = options?.secretPath ?? this.secretPath
    if (!existsSync(secretPath)) {
      throw Error(`${secretPath} not found`);
    }
    input = readFileSync(secretPath, 'utf-8');
    const header = 'address,mnemonic\n';
    records = parse(header + input, {
      columns: true,
      skip_empty_lines: true,
      delimiter: this.csvDelimiter,
    });
    if (records.length === 0)
      throw Error("Empty signers");
    let mnemonic: string | undefined;
    if (options?.address) {
      const record = records.find((i) => i.address === options?.address);
      if (!record) throw Error("Signer not found");
      mnemonic = record.mnemonic.trim();
    } else {
      mnemonic = records[0].mnemonic.trim();
    }
    return mnemonic;
  }
}
