import { BigNumber, ethers } from "ethers";
import { CHAINS_EVM } from "../chains";
import { Defferable, EvmConfig, Inscriber, Inscription, Provider, Tx } from "./inscriber";
import { appendFileSync } from "fs";
import assert from "assert";

export class EvmInscriber extends Inscriber {

  constructor(config: EvmConfig) {
    super(config);
    this.rpcs = CHAINS_EVM[`${config.chainId}`]?.rpcs ?? [];
  }

  async inscribe(inp: Inscription): Promise<Tx> {
    const inputText = this.buildCallData(inp);
    return this.inscribeText(inputText);
  }

  async inscribeText(data: string): Promise<Tx> {
    const from = await this.signer?.getAddress()!;
    const to = this.config.isSelfTransaction ? from : this.config.contract!;
    const value = this.config.value || BigNumber.from(0);
    assert(this.signer);
    const tx = { from, to, data, value };
    const gasPrice = this.config.gasPrice ?? (await this.randomProvider().getGasPrice());
    const gasLimit = this.config.gasLimit ?? await this.randomProvider().estimateGas(tx);
    return await this.signer.sendTransaction({ ...tx, gasPrice, gasLimit });
  }

  randomProvider(): Provider {
    return new ethers.providers.JsonRpcProvider(this.randomRpc())
  }

  stringify(inp: Inscription): string {
    return `data:,${JSON.stringify(inp)}`
  }

  buildCallData(inp: Inscription): string {
    return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(this.stringify(inp)))
  }

  createSigner(): Defferable<this> {
    const signer = ethers.Wallet.createRandom();
    const { address, privateKey } = signer;
    const record = `${address}${this.csvDelimiter}${privateKey}\r\n`;
    appendFileSync(this.secretPath, record);
    this.signer = signer;
    return this;
  }

  connectSignerFromSecretCsv(address?: string): Defferable<this> {
    const mnemonic = this.connectMnemonicFromSecretCsv(address);
    this.signer = ethers.Wallet.fromMnemonic(mnemonic);
    return this;
  }

  connectSignerFromMnemonic(mnemonic: string): Defferable<this> {
    this.signer = ethers.Wallet.fromMnemonic(mnemonic);
    return this;
  }

  connectSignerFromPrivateKey(privateKey: string): Defferable<this> {
    this.signer = new ethers.Wallet(privateKey);
    return this;
  }
}