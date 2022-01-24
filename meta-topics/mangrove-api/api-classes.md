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
mgvAPI = await Mangrove.connect(window.ethereum); // web browser
mgvAPI = await Mangrove.connect('http://127.0.0.1:8545'); // HTTP provider
mgvAPI = await Mangrove.connect(); // Uses Ethers.js fallback mainnet (for testing only)
mgvAPI = await Mangrove.connect('rinkeby'); // Uses Ethers.js fallback (for testing only)
// Init with private key (server side)
mgvAPI = await Mangrove.connect(
'https://mainnet.infura.io/v3/_your_project_id_', // provider
{
  privateKey: '0x_your_private_key_', // preferably with environment variable
});
// Init with HD mnemonic (server side)
mgvAPI = await Mangrove.connect( {
  signer: myEthersWallet
});
```

The above `mgvAPI`  object gives you access to various useful abstractions such as`MgvToken`, `Market` and `Maker`(an abstraction layer to pass [bids](https://www.investopedia.com/terms/b/bid.asp) and [asks](https://www.investopedia.com/terms/a/ask.asp) on Mangrove).

{% hint style="info" %}
`mgvAPI.contract`gives access to the standard `ethers.js` contract and allows one to interact with the deployed `Mangrove` using low-level `ethers.js` calls. Hence, `await mgvAPI.contract.f(...)` will produce the ethers.js call to Mangrove (signed when needed by the `signer` provided to the `connect` function).
{% endhint %}

## MgvToken

This class provides easy means to interact with a deployed contract on the standard [EIP-20](https://eips.ethereum.org/EIPS/eip-20). To obtain an instance use:

```javascript
mgvT = mgvAPI.token("<tokenSymbol>"); // e.g "DAI", "WETH", "amDAI", etc.
```

with the above `MgvT` object one has access to standard calls using human readable input/outputs. For instance:

```javascript
await mgvT.approve("<spender>"); // gives infinite approval to spender
await mgvT.approve("<spender>",0.5); // gives allowance to spend 100 tokens to spender
await mgvT.contract.approve("<spender>", mgvT.mgv.toUnits(0.5)); // ethers.js call
```

Note that Mangrove's API deals with token decimals automatically (see definitions in [`constants.ts`](https://github.com/mangrovedao/mangrove/blob/master/packages/mangrove.js/src/constants.ts)).

{% hint style="info" %}
`MgvToken.contract` gives access to the `ethers.js` contract allowing one to interact with the deployed contract using low level calls (for instance if the token has functions that are do not belong to the ERC20 standard).
{% endhint %}

## Market

The `Market` class is an abstraction layer to interact with Mangrove as a liquidity taker, using standard market [buy and sell orders](sell-and-buy-orders.md). To obtain one instance use:

```typescript
//connect to a (base,quote) market with default options
Market = await MgvT.connect({base:"<base_symbol>", quote:"<quote_symbol>"});

// connect to the market, caching the first 50 best bids and asks
Market = await MgvT.connect({base:"<base_symbol>", quote:"<quote_symbol>", maxOffers: 50});

```

{% hint style="info" %}
Upon connection to a market, the API subscribes to events emanating from Mangrove in order to maintain a local state of the order book.&#x20;
{% endhint %}

For debugging purpose, the class provides a console of the current state of bids and asks posted on Mangrove. For instance to display the bid offers on Mangrove on this market:

```typescript
// Pretty prints to console the bid offers, showing offer `id`, offer `volume` and offer `price
await Market.consoleAsks(["id", "volume", "price"]);
```

`Market` instances allow one to subscribe to markets events using:

```javascript
const f (event) => ...; // what you want to do when receiving the event 
Market.subscribe (f);
```

To unsubscribe `f` from market events simply use `Market.unsubscribe(f)`.

Market events are structured objects of the following kinds:

* `{type: 'OfferRetract', ba:'asks'|'bids', offer:Market.Offer}` when an ask or a bid  `offer` is removed from the book
* &#x20;`{type: 'OfferWrite', ba:'asks'|'bids', offer:Market.Offer}` when a bid or ask `offer` is added to the book (or updated)
* &#x20;`{type:'OfferFail', ba:'asks'|'bids', taker:string, 'takerWants':Big, takerGives:Big, mgvData:string, offer:Market.Offer}` when `offer` failed to deliver. Note that `mgvData` is a bytes32 string encoding of the fail reason (according to Mangrove).
* `{type: 'OfferSuccess', ba: 'asks'|'bids', taker: string, takerWants:Big, takerGives:Big, offer:Market.Offer}` when `offer` was successfully executed (possibly on a partial fill whenever `offer.gives`>`takerWants`).

## Maker
