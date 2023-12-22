import { BigNumber, ethers } from "ethers";
import { CHAINS_EVM } from "../chains";
import { Defferable, EvmConfig, Inscriber, Inscription, Provider, Signer, Tx } from "./inscriber";
import { appendFileSync } from "fs";
import assert from "assert";

export class EvmInscriber extends Inscriber {
  constructor(config: EvmConfig) {
    super(config);
    this.rpcs = CHAINS_EVM[`${config.chainId}`]?.rpcs ?? [];
  }

  async inscribe(inp: Inscription): Promise<Tx> {
    const from = await this.signer?.getAddress()!;
    const to = this.config.isSelfTransaction ? from : this.config.contract!;
    const data = this.buildCallData(inp);
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
    return ethers.utils.hexlify(this.stringify(inp))
  }

  createSigner(): Defferable<Signer> {
    const signer = ethers.Wallet.createRandom();
    const { address, privateKey } = signer;
    const record = `${address}${this.csvDelimiter}${privateKey}\r\n`;
    appendFileSync(this.secretPath, record);
    return signer;
  }

  loadSigner(address?: string): Defferable<Signer> {
    const mnemonic = this.loadMnemonic(address);
    return ethers.Wallet.fromMnemonic(mnemonic);
  }
}