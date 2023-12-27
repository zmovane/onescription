import { TxRequest } from "@scriptione/one";
import { BaseAccount, ChainRestAuthApi, MsgSend, PrivateKey, TxGrpcClient, createTransaction } from "@injectivelabs/sdk-ts";
import { Network, getNetworkInfo } from "@injectivelabs/networks";
import { CosmosInscriber } from "./cosmos";
import { StdFee } from "@cosmjs/amino";
import { BigNumberInWei } from "@injectivelabs/utils";
import { CosmosConfig } from ".";

export class InjectiveInscriber extends CosmosInscriber {
  GAS_ADJUSTMENT = 1.1;
  MINIMUM_AMOUNT = new BigNumberInWei('1');
  MINIMUM_GAS_PRICE = new BigNumberInWei('500000000');
  constructor(config: CosmosConfig) {
    super(config);
  }

  override async connectSignerFromSecretCsv(options?: { secretPath?: string; address?: string }): Promise<this> {
    const mnemonic = this.readMnemonicFromSecretCsv(options);
    const signer = PrivateKey.fromMnemonic(mnemonic)
    const getAddress = async () => signer.toBech32();
    const sendTransaction =
      async ({ from: sender, to: recipient, value, data: memo }: TxRequest) => {
        const network = getNetworkInfo(Network.Mainnet);
        const minAmount = this.MINIMUM_AMOUNT.gt(new BigNumberInWei(value.toString())) ? this.MINIMUM_AMOUNT.toFixed() : value.toString();
        const amount = {
          amount: minAmount,
          denom: "inj",
        };
        const publicKey = signer.toPublicKey().toBase64();
        const authApi = new ChainRestAuthApi(network.rest);
        const accountDetailsResponse = await authApi.fetchAccount(sender);
        const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
        const accountDetails = baseAccount.toAccountDetails();
        const msg = MsgSend.fromJSON({
          amount,
          srcInjectiveAddress: sender,
          dstInjectiveAddress: recipient,
        });
        let txArgs = {
          message: msg,
          memo: memo.toString(),
          pubKey: publicKey,
          sequence: accountDetails.sequence,
          accountNumber: accountDetails.accountNumber,
          chainId: network.chainId
        }

        const gasOverrided = this.config.gasLimit;
        let gasLimit: string;
        let gasAmount: string;
        let fee: StdFee
        if (gasOverrided) {
          let gasPrice = this.config.gasPrice?.toString() ?? this.MINIMUM_GAS_PRICE.toFixed();
          gasPrice = this.MINIMUM_GAS_PRICE.gt(new BigNumberInWei(gasPrice)) ? this.MINIMUM_GAS_PRICE.toFixed() : gasPrice;
          gasLimit = this.config.gasLimit!.toString();
          gasAmount = new BigNumberInWei(gasLimit).multipliedBy(new BigNumberInWei(gasPrice)).toFixed()
        } else {

          // simulate 
          const { signBytes, txRaw } = createTransaction(txArgs);
          const signature = await signer.sign(Buffer.from(signBytes));
          txRaw.signatures = [signature];
          const txService = new TxGrpcClient(network.grpc);
          const { gasInfo } = await txService.simulate(txRaw)
          gasAmount = this.MINIMUM_GAS_PRICE.multipliedBy(gasInfo.gasUsed).toFixed(0);
          gasLimit = new BigNumberInWei(gasInfo.gasUsed).multipliedBy(this.GAS_ADJUSTMENT).toFixed(0);
        }
        fee = {
          amount: [
            {
              amount: gasAmount,
              denom: "inj",
            },
          ],
          gas: gasLimit,
        };

        // broadcast
        const { signBytes, txRaw } = createTransaction({ ...txArgs, fee });
        const signature = await signer.sign(Buffer.from(signBytes));
        txRaw.signatures = [signature];
        const txService = new TxGrpcClient(network.grpc);
        const txResponse = await txService.broadcast(txRaw);
        return { hash: txResponse.txHash }
      };
    this.signer = { sendTransaction, getAddress, connect: (_) => this.signer };
    return this;
  }
}