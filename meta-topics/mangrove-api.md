---
description: A JavaScript library for Mangrove.
---

# Mangrove API

{% hint style="info" %}
Wraps around [ethers.js](https://github.com/ethers-io/ethers.js). Works in the **web browser** and **Node.js**.
{% endhint %}

## Install

You can install the API using \`npm\` package manager using:

```bash
sandbox_folder$> npm install @mangrovedao/mangrove.js
```

and you may readily connecting to Mangrove with Node.js, for instance:

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



## Using the API to take offers



## Using the API to provide liquidity

