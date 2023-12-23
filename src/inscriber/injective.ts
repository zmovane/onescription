import { CosmosConfig, TxRequest } from "./inscriber";
import { BaseAccount, ChainRestAuthApi, MsgSend, PrivateKey, TxGrpcClient, createTransaction } from "@injectivelabs/sdk-ts";
import { Network, getNetworkInfo } from "@injectivelabs/networks";
import { CosmosInscriber } from "./cosmos";
import { StdFee } from "@cosmjs/amino";
import { BigNumberInWei } from "@injectivelabs/utils";

export class InjectiveInscriber extends CosmosInscriber {
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
        const amount = {
          amount: value.toString(),
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
          chainId: network.chainId,
        }

        const gasOverrided = this.config.gasLimit;
        let gasLimit: string;
        let gasPrice: string;
        let fee: StdFee
        if (gasOverrided) {
          gasPrice = this.config.gasPrice?.toString() ?? this.MINIMUM_GAS_PRICE.toFixed();
          gasPrice = this.MINIMUM_GAS_PRICE.gt(new BigNumberInWei(gasPrice)) ? this.MINIMUM_GAS_PRICE.toFixed() :
            gasPrice;
          gasLimit = this.config.gasLimit!.toString();
        } else {

          // simulate 
          const { signBytes, txRaw } = createTransaction(txArgs);
          const signature = await signer.sign(Buffer.from(signBytes));
          txRaw.signatures = [signature];
          const txService = new TxGrpcClient(network.grpc);
          const { gasInfo } = await txService.simulate(txRaw)
          gasPrice = this.MINIMUM_GAS_PRICE.toFixed();
          gasLimit = gasInfo.gasWanted!.toString();
        }
        fee = {
          amount: [
            {
              amount: gasPrice,
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
    this.signer = { sendTransaction, getAddress };
    return this;
  }
}