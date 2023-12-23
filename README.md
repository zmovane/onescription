# All-in-One inscription tool

![https://npm.im/onescription](https://badgen.net/npm/v/onescription)
![https://www.npmjs.com/package/onescription](https://badgen.net/npm/dm/onescription)

A multi-chain inscription tool that can be used as an inscription bot or integrated into web applications, it provides concurrent strategies, secure wallet generation methods, etc.

- [Features](#features)
- [Installation](#installation)
- [Examples](#examples)
  - [use as an inscription bot](#to-use-as-an-inscription-bot)
  - [use in web application](#to-use-in-web-application)

## Features

- Utility

  - [x] inscription bot
  - [x] can be integrated into web applications

- Supported chains

  - [x] Evm-compatible chains
  - [x] Cosmos Hub

- Strategy

  - [x] concurrent requests, based on [async-mutext](https://github.com/DirtyHairy/async-mutex) / semaphore.
  - [x] selectively executed according to customized logic, such as writing execution logic based on block height or unix timestamp. [INJS demo](#cosmos)
  - [ ] wait for each transaction until the user-defined status is reached.

- Wallet
  - [x] connect an existing signer from private key / mnemonic / secret csv file.
  - [x] create a new wallet and export it to secret file (CSV format).
  - [ ] may be a better practice to encrypt the generated secret file using [age encryption](https://github.com/FiloSottile/typage).

## Installation

```
yarn add onescription@latest
```

## Examples

### To use as an inscription bot

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
  maxConcurrentRequests: 2,
  statusToWait: "submitted",
  // The $INJS introduction is available in this link
  // https://docs.injs.ink/mint-injs
  predicate: async (provider: ChainInfoProvider) => {
    const blockHeight = await provider.getBlockHeight();
    console.log("current block height:", blockHeight);
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
    return (
      undefined !==
      rounds.find(([start, end]) => start <= blockHeight && blockHeight <= end)
    );
  },
};
const onescription = new Onescription(inscriber, strategy);
const inscription = { p: "injrc-20", op: "mint", tick: "INJS", amt: "1000" };
for (;;) {
  await onescription.inscribe(inscription);
}
```

### To use in web application

```typescript
const configuration: EvmConfig = {
  os: "evm",
  chainId: 56,
  isSelfTransaction: true,
};
const inscriber = Inscriber.from(configuration);
const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
inscriber.connectSigner(signer);
const inp: Inscription = { p: "bsc-20", op: "mint", tick: "bnbs", amt: "1000" };
await inscriber.inscribe(inp);
```
