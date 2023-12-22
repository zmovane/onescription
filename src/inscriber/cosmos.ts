import { BigNumber, ethers } from "ethers";
import { CHAINS_COSMOS } from "../chains";
import { CosmosConfig, Defferable, Inscriber, Inscription, Tx, TxRequest } from "./inscriber";
import { appendFileSync } from "fs";
import { Secp256k1HdWallet } from "@cosmjs/launchpad";
import { assert } from "console";
import { SigningStargateClient } from "@cosmjs/stargate";

export class CosmosInscriber extends Inscriber {

  constructor(config: CosmosConfig) {
    super(config);
    this.rpcs = CHAINS_COSMOS[config.prefix]?.rpcs ?? [];
  }

  async inscribe(inp: Inscription): Promise<Tx> {
    const data = this.buildCallData(inp);
    return this.inscribeText(data);
  }

  async inscribeText(data: string): Promise<Tx> {
    const from = await this.signer?.getAddress()!;
    const to = this.config.isSelfTransaction ? from : this.config.contract!;
    const value = this.config.value || BigNumber.from(0);
    assert(this.signer);
    return this.signer?.sendTransaction({ from, to, data, value })
  }

  stringify(inp: Inscription): string {
    return `data:,${JSON.stringify(inp)}`
  }

  buildCallData(inp: Inscription): string {
    return Buffer.from(this.stringify(inp)).toString('base64');
  }

  createSigner(): Defferable<this> {
    const signer = ethers.Wallet.createRandom();
    const { address, privateKey } = signer;
    const record = `${address}${this.csvDelimiter}${privateKey}\r\n`;
    appendFileSync(this.secretPath, record);
    this.signer = signer;
    return this;
  }

  nativeDenomOf(prefix: string) {
    switch (prefix) {
      case "celestia": return 'utia';
      case "cosmos": return 'uatom';
      case "osmo": return 'uosmo';
      case "inj": return 'inj';
    }
    // TODO
    throw Error("Unknown prefix");
  }

  // TODO: configurable gas 
  async connectSignerFromSecretCsv(address?: string): Promise<this> {
    const mnemonic = this.connectMnemonicFromSecretCsv(address);
    return this.connectSignerFromMnemonic(mnemonic);
  }
  async connectSignerFromMnemonic(mnemonic: string): Promise<this> {
    const prefix = (this.config as CosmosConfig).prefix;
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic.trim(), { prefix });
    const client = await SigningStargateClient.connectWithSigner(this.randomRpc(), wallet);
    const account = (await wallet.getAccounts())[0].address;
    const getAddress = async () => account;
    const sendTransaction =
      async ({ from: sender, to: recipient, value: amount, data: memo }: TxRequest) => {
        const { transactionHash } = await client.sendTokens(
          sender,
          recipient,
          [{ amount: amount.toString(), denom: this.nativeDenomOf(prefix) }],
          "auto",
          memo.toString()
        );
        return { hash: transactionHash }
      };
    this.signer = { sendTransaction, getAddress };
    return this;
  }
  connectSignerFromPrivateKey(privateKey: string): Defferable<this> {
    throw new Error("Method not implemented.");
  }
}