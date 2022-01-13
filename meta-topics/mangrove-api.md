---
description: A JavaScript library for Mangrove.
---

# Mangrove API

{% hint style="info" %}
Wraps around [ethers.js](https://github.com/ethers-io/ethers.js). Works in the **web browser** and [Node.js](https://nodejs.org/en/).
{% endhint %}

## Getting started

You can install the API using \`npm\` package manager using:

```bash
sandbox_folder$> npm install @mangrovedao/mangrove.js
```

and you may readily connect to Mangrove with [Node.js](https://nodejs.org/en/), for instance:

```bash
sandbox_folder$> node
Welcome to Node.js v_xxx
Type ".help" for more information.
> const { Mangrove } = require("@mangrovedao/mangrove.js");
undefined
> const { ethers } = require("ethers");
undefined
> let provider = new ethers.providers.WebSocketProvider(
    "https://polygon-mumbai.g.alchemy.com/v2/<PRIVATE_KEY>"
  );
undefined
> let mywallet = new ethers.Wallet(
    "<WALLET_PRIVATE_KEY>",
    provider
  );
undefined
> let MgvAPI = await Mangrove.connect({
    signer: mywallet
  });
undefined
> let market = await MgvAPI.market({base:"WETH", quote:"DAI"});
undefined
> console.log("pretty prints available bids from the WETH,DAI market on Mangove");
pretty prints available bids from the WETH,DAI market on Mangove
> await market.consoleBids();
┌─────────┬────┬──────────────────────────────────────────────┬─────────────────────┬───────────────────────────┐
│ (index) │ id │                    maker                     │       volume        │           price           │
├─────────┼────┼──────────────────────────────────────────────┼─────────────────────┼───────────────────────────┤
│    0    │ 4  │ '0x54782b0c6080DBC5492BCB4Fa4BA4103845940Ad' │ 0.2355813953488372  │ 4244.81737413622919031855 │
│    1    │ 5  │ '0x54782b0c6080DBC5492BCB4Fa4BA4103845940Ad' │ 0.2355813953488372  │ 4244.81737413622919031855 │
│    2    │ 1  │ '0xcBb37575320FF499E9F69d0090b6944bc0aD7585' │ 0.23559598787030558 │ 4244.55445544554446426917 │
└─────────┴────┴──────────────────────────────────────────────┴─────────────────────┴───────────────────────────┘
undefined
```

## API  classes

{% hint style="info" %}
#### Numbers

* Numbers returned by functions are either plain javascript `number` or `big.js`instances. Some functions with names ending in `Raw` may return`ethers.BigNumbers`.&#x20;
* As input, numbers can be as plain javascript `numbers`, `big.js` instances, but also a`string`.

The precision used when dividing is 20 decimal places.
{% endhint %}

### Mangrove

The root class of the API. Use `Mangrove.connect` to get an instance of it.  Here are a few possibilities:

```typescript
MgvAPI = await Mangrove.connect(window.ethereum); // web browser
MgvAPI = await Mangrove.connect('http://127.0.0.1:8545'); // HTTP provider
MgvAPI = await Mangrove.connect(); // Uses Ethers.js fallback mainnet (for testing only)
MgvAPI = await Mangrove.connect('rinkeby'); // Uses Ethers.js fallback (for testing only)
// Init with private key (server side)
MgvAPI = await Mangrove.connect(
'https://mainnet.infura.io/v3/_your_project_id_', // provider
{
  privateKey: '0x_your_private_key_', // preferably with environment variable
});
// Init with HD mnemonic (server side)
MgvAPI = await Mangrove.connect( {
  signer: myEthersWallet
});
```

The above `MgvAPI`  object gives you access to various useful abstractions such as`MgvToken` (easy interactions with ERC20 contracts), `Market` (an abstraction layer to pass [market buy and sell orders](https://www.investopedia.com/terms/m/marketorder.asp) on Mangrove) and `Maker`(an abstraction layer to pass [bids](https://www.investopedia.com/terms/b/bid.asp) and [asks](https://www.investopedia.com/terms/a/ask.asp) on Mangrove).

{% hint style="info" %}
`MgvAPI.contract` is a standard `ethers.js` contract. `It`allows one to interact with the deployed `Mangrove` using standard `ethers.js` calls. Hence, `await MgvAPI.contract.f(...)` will produce the ethers.js call to Mangrove (signed if needed by the `signer` provided to the `connect` function).
{% endhint %}

### MgvToken

This class provides easy means to interact with a deployed contract on the standard [EIP-20](https://eips.ethereum.org/EIPS/eip-20). To obtain an instance use:

```javascript
MgvT = MgvAPI.token("<tokenSymbol>"); // e.g "DAI", "WETH", "amDAI", etc.
```

with the above `MgvT` object one has access to standard calls using human readable input/outputs. For instance:

```javascript
await MgvT.approve("<spender>"); // gives infinite approval to spender
await MgvT.approve("<spender>",0.5); // gives allowance to spend 100 tokens to spender
await MgvT.contract.approve("<spender>", MgvT.mgv.toUnits(0.5)); // ethers.js call
```

## Taking offer via the API

## Using the API to provide liquidity

