# All-in-One inscription tool

<a href="https://npm.im/onescription"><img src="https://badgen.net/npm/v/onescription"></a> <a href="https://npm.im/onescription"><img src="https://badgen.net/npm/dm/onescription"></a>

A multi-chain inscription tool that can be used as an inscription bot or integrated into web applications, it provides concurrent strategies, secure wallet generation methods, etc.

## Examples

### Use as an inscription bot

#### **Evm:**

BNB chain

```typescript
const configuration: EvmConfig = {
  os: "evm",
  chainId: 56,
  isSelfTransaction: true,
};
const inscriber = Inscriber.from(configuration);
// or
//inscriber.connectSignerFromPrivateKey("YOUR PRIVATE");
inscriber.connectSignerFromMnemonic("YOUR MNEMONIC");
const strategy: Strategy = {
  maxConcurrentRequests: 5,
  statusToWait: "requested",
};
const onescription = new Onescription(inscriber, strategy);
const inscription = `data:,{"p":"bsc-20","op":"mint","tick":"bnbs","amt":"1000"}`;
// or
// const inscription: Inscription = { p: "bsc-20", op: "mint", tick: "bnbs", amt: "1000" };
for (;;) {
  await onescription.inscribe(inscription);
}
```

#### **Cosmos:**

Injective

```typescript
const configuration: CosmosConfig = {
  os: "cosmos",
  prefix: "inj",
  isSelfTransaction: true,
};
const inscriber = Inscriber.from(configuration);
inscriber.connectSignerFromMnemonic("YOUR MNEMONIC");
const strategy: Strategy = {
  maxConcurrentRequests: 1,
  statusToWait: "submitted",
  predicate: async (provider: ChainInfoProvider) => {
    const height = await provider.getBlockHeight();
    console.log("current block height:", height);
    // The $INJS introduction is available in this link
    // https://docs.injs.ink/mint-injs
    const rounds = [
      [55051600, 55053100],
      [55094800, 55096300],
      [55138000, 55139500],
      [55181200, 55182700],
      [55224400, 55225900],
      [55267600, 55269100],
      [55310800, 55312300],
      [55354000, 55355500],
    ];
    const valid =
      undefined !==
      rounds.find(([start, end]) => start <= height && height <= end);
    return valid;
  },
};
const onescription = new Onescription(inscriber, strategy);
const inscription = { p: "injrc-20", op: "mint", tick: "INJS", amt: "1000" };
for (;;) {
  await onescription.inscribe(inscription);
}
```
