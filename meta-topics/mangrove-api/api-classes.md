# API  classes

{% hint style="info" %}
#### Numbers

* Numbers returned by functions are either plain javascript [`number`](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global\_Objects/Number) or [`big.js`](https://github.com/MikeMcl/big.js/)instances. Some functions with names ending in `Raw` may return`ethers.BigNumbers`.&#x20;
* As input, numbers can be as plain javascript `numbers`, `big.js` instances, but also a`string`.

The precision used when dividing is 20 decimal places.
{% endhint %}

## Mangrove

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

The above `MgvAPI`  object gives you access to various useful abstractions such as`MgvToken`, `Market` and `Maker`(an abstraction layer to pass [bids](https://www.investopedia.com/terms/b/bid.asp) and [asks](https://www.investopedia.com/terms/a/ask.asp) on Mangrove).

{% hint style="info" %}
`MgvAPI.contract`gives access to the standard `ethers.js` contract and allows one to interact with the deployed `Mangrove` using low level `ethers.js` calls. Hence, `await MgvAPI.contract.f(...)` will produce the ethers.js call to Mangrove (signed when needed by the `signer` provided to the `connect` function).
{% endhint %}

## MgvToken

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

Note that Mangrove's API deals with token decimals automatically (see definitions in [`constants.ts`](https://github.com/mangrovedao/mangrove/blob/master/packages/mangrove.js/src/constants.ts)).

{% hint style="info" %}
`MgvToken.contract` gives access to the `ethers.js` contract allowing one to interact with the deployed contract using low level calls (for instance if the token has functions that are do not belong to the ERC20 standard).M
{% endhint %}

## Market

The `Market` class is an abstraction layer to interact with Mangrove as a liquidity taker, using standard [market buy and sell orders](https://www.investopedia.com/terms/m/marketorder.asp).



## Maker
