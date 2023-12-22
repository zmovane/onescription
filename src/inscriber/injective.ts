import { CosmosConfig, TxRequest } from "./inscriber";
import { BaseAccount, ChainRestAuthApi, MsgSend, PrivateKey, TxGrpcClient, createTransaction } from "@injectivelabs/sdk-ts";
import { Network, getNetworkInfo } from "@injectivelabs/networks";
import { CosmosInscriber } from "./cosmos";

export class InjectiveInscriber extends CosmosInscriber {
  constructor(config: CosmosConfig) {
    super(config);
  }

  async connectSignerFromSecretCsv(address?: string): Promise<this> {
    const mnemonic = this.connectMnemonicFromSecretCsv(address);
    const signer = PrivateKey.fromMnemonic(mnemonic)
    const getAddress = async () => signer.toAddress().address;
    const sendTransaction =
      async ({ from: sender, to: recipient, value, data: memo }: TxRequest) => {
        const network = getNetworkInfo(Network.Mainnet);
        const injectiveAddress = signer.toBech32();
        const amount = {
          amount: value.toString(),
          denom: "inj",
        };
        const publicKey = signer.toPublicKey().toBase64();
        const accountDetailsResponse = await new ChainRestAuthApi(
          network.rest
        ).fetchAccount(injectiveAddress);
        const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
        const accountDetails = baseAccount.toAccountDetails();
        const msg = MsgSend.fromJSON({
          amount,
          srcInjectiveAddress: sender,
          dstInjectiveAddress: recipient,
        });
        // FIXME: configurable gas 
        const { signBytes, txRaw } = createTransaction({
          message: msg,
          memo: memo.toString(),
          fee: {
            amount: [
              {
                amount: '2000000000000000',
                denom: "inj",
              },
            ],
            gas: "900000",
          },
          pubKey: publicKey,
          sequence: accountDetails.sequence,
          accountNumber: accountDetails.accountNumber,
          chainId: network.chainId,
        });

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