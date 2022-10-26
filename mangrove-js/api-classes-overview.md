# API  classes overview

{% hint style="info" %}
#### Numbers

* Numbers returned by functions are either plain javascript [`number`](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global\_Objects/Number) or [`big.js`](https://github.com/MikeMcl/big.js/)instances. Some functions with names ending in `Raw` may return`ethers.BigNumbers`.&#x20;
* As input, numbers can be as plain javascript `numbers`, `big.js` instances, but also a`string`.

The precision used when dividing is 20 decimal places.

#### Overrides

All API functions that produce a signed transaction can be equipped with the usual `ethers.js` overrides as optional parameters.&#x20;
{% endhint %}

## Mangrove

The root class of the API. Use `Mangrove.connect` to get an instance of it.  Here are a few possibilities:

```typescript
mgv = await Mangrove.connect(window.ethereum); // web browser
mgv = await Mangrove.connect('http://127.0.0.1:8545'); // HTTP provider
mgv = await Mangrove.connect(); // Uses Ethers.js fallback mainnet (for testing only)
mgv = await Mangrove.connect('rinkeby'); // Uses Ethers.js fallback (for testing only)
// Init with private key (server side)
mgv = await Mangrove.connect(
'https://mainnet.infura.io/v3/_your_project_id_', // provider
{
  privateKey: '0x_your_private_key_', // preferably with environment variable
});
// Init with HD mnemonic (server side)
mgv = await Mangrove.connect( {
  signer: myEthersWallet
});
```

You can test you are indeed connected to the deployed Mangrove by asking for the current global configuration of Mangrove:

`config = await mgv.config()`

The above `mgv`  object gives you access to the `MgvToken`, `Market` and `OfferLogic` (allowing one to connect to an onchain offer logic) and `LiquidityProvider`(an abstraction layer to pass [bids](https://www.investopedia.com/terms/b/bid.asp) and [asks](https://www.investopedia.com/terms/a/ask.asp) on Mangrove) objects. &#x20;

{% hint style="info" %}
`mgv.contract`gives access to the standard `ethers.js` contract and allows one to interact with the deployed `Mangrove` using low-level `ethers.js` calls. Hence, `await mgv.contract.f(...)` will produce the ethers.js call to Mangrove (signed when needed by the `signer` provided to the `connect` function).
{% endhint %}

## MgvToken

This class provides easy means to interact with a deployed contract on the standard [EIP-20](https://eips.ethereum.org/EIPS/eip-20). To obtain an instance use:

```javascript
mgvTkn = mgv.token("<tokenSymbol>"); // e.g "DAI", "WETH", "amDAI", etc.
```

with the above `MgvT` object one has access to standard calls using human readable input/outputs. For instance:

```javascript
await mgvTkn.approve("<spender>"); // gives infinite approval to spender
await mgvTkn.approve("<spender>",0.5); // gives allowance to spend 0.5 token units to spender
await mgvTkn.contract.approve("<spender>", mgvTkn.mgv.toUnits(0.5)); // ethers.js call
```

Note that Mangrove's API deals with token decimals automatically (see definitions in [`constants.ts`](https://github.com/mangrovedao/mangrove/blob/master/packages/mangrove.js/src/constants.ts)).

{% hint style="info" %}
`MgvToken.contract` gives access to the `ethers.js` contract allowing one to interact with the deployed contract using low level calls (for instance if the token has functions that are do not belong to the ERC20 standard).
{% endhint %}

## Market

The `Market` class is an abstraction layer to interact with Mangrove as a liquidity taker, using standard market [buy and sell orders](sell-and-buy-orders.md). To obtain one instance use:

```typescript
//connect to a (base,quote) market with default options
mgvMarket = await mgv.connect({base:"<base_symbol>", quote:"<quote_symbol>"});

// connect to the market, caching the first 50 best bids and asks
mgvMarket = await mgv.connect({base:"<base_symbol>", quote:"<quote_symbol>", maxOffers: 50});

```

{% hint style="info" %}
Upon connection to a market, the API subscribes to events emanating from Mangrove in order to maintain a local cache of the order book. One may increase the size of the cache by using `mgv.connect({..., maxOffers:<size of the book>})`.
{% endhint %}

For debugging purpose, the class provides a console of the current state of bids and asks posted on Mangrove. For instance to display the bid offers on Mangrove on this market:

```typescript
// Pretty prints to console the bid offers, showing offer `id`, offer `volume` and offer `price
await mgvMarket.consoleAsks(["id", "volume", "price"]);
```

`Market` instances allow one to subscribe to markets events using:

```javascript
const f (event) => ...; // what you want to do when receiving the event 
mgvMarket.subscribe (f);
```

To unsubscribe `f` from market events simply use `mgvMarket.unsubscribe(f)`.

Market events are records of the following kinds:

* `{type: 'OfferRetract', ba:'asks'|'bids', offer:Market.Offer}` when an ask or a bid  `offer` is removed from the book
* &#x20;`{type: 'OfferWrite', ba:'asks'|'bids', offer:Market.Offer}` when a bid or ask `offer` is added to the book (or updated)
* &#x20;`{type:'OfferFail', ba:'asks'|'bids', taker:string, 'takerWants':Big, takerGives:Big, mgvData:string, offer:Market.Offer}` when `offer` failed to deliver. Note that `mgvData` is a bytes32 string encoding of the fail reason (according to Mangrove).
* `{type: 'OfferSuccess', ba: 'asks'|'bids', taker: string, takerWants:Big, takerGives:Big, offer:Market.Offer}` when `offer` was successfully executed (possibly on a partial fill whenever `offer.gives`>`takerWants`).

and where `Market.Offer` has the following main fields:

```typescript
id: number; // the id of the executed offer
maker: string; // address of the maker (contract/wallet) in charge of the offer
gasreq: number; // gas required by the offer
volume: Big; // total volume proposed
price: Big; // price offered
```

## OfferLogic

A [reactive offer](https://docs.mangrove.exchange/data-structures/market) is managed by a smart contract which implements its [logic](api-classes-overview.md#offerlogic). One may use the API to post liquidity on Mangrove via a deployed logic that complies to the [IOfferLogic](https://github.com/mangrovedao/mangrove/blob/master/packages/mangrove-solidity/contracts/Strategies/interfaces/IOfferLogic.sol) interface. To do so, one first need an `OfferLogic` instance:

```typescript
const mgvLogic = mgv.offerLogic("0x..."); // NB not an async call
```

The `mgvLogic` instance offers various function to query and set the underlying contract state, for instance:

```javascript
await mgvLogic.setAdmin("0x..."); // set new admin
await mgvLogic.redeemToken("DAI", 100); // transfer 100 DAI from contract's signer account to signer's EOA
await mgvLogic.depositToken("WETH", 0.1); // put 0.1 WETH from signer's EOA to contract's account
const bal = await mgvLogic.tokenBalance("USDC"); // returns signer's balance of USDC on the contract
const mgvLogic_ = await mgvLogic.connect(newSigner); // returns a new OfferLogic instance with a new signer
cosnt gasreq = await mgvLogic.getDefaultGasreq(); // returns the gas required (by default) for new offers of this contract
await mgvLogic.setDefaultGasreq(200000); // default gasreq setter
```

{% hint style="danger" %}
When using an offer logic that inherits from the  [`MultiUser.sol`](https://github.com/mangrovedao/mangrove/blob/master/packages/mangrove-solidity/contracts/Strategies/OfferLogics/MultiUsers/MultiUser.sol) solidity class, one should always use the above `depositToken` (and `tokenBalance`) instead of sending tokens (or querying balance) directly to the contract which might result in the tokens being burnt (as only `depositToken` will increase user balance on the contract).
{% endhint %}

## LiquidityProvider

A `LiquidityProvider` instance is the object one needs to [post Bids and Asks](posting-bids-and-asks.md) on a Mangrove market. There are two means to obtain an LiquidityProvider: either to post a [direct Offer](https://docs.mangrove.exchange/offer-making-strategies/basic-offer) or to post an Offer relying on some onchain [logic](api-classes-overview.md#offerlogic).

To act as a direct liquidity provider on a some [`mgvMarket`](api-classes-overview.md#market) you must obtain a `LiquidityProvider` instance from an [`mgv`](api-classes-overview.md#mangrove) object using:

```javascript
const mgvDirectLP = await mgv.liquidityProvider(mgvMarket);
```

{% hint style="info" %}
The EOA providing the liquidity for ask and bid offers emanating from a direct liquidity provider is the address of the [`mgv`](api-classes-overview.md#mangrove)'s signer provided at the creation of the Mangrove instance.
{% endhint %}

For more complete experience of the Mangrove capabilities, on may rather post bids and asks via an offer logic `mgvLogic`. To do so, one does:

```javascript
const mgvOnchainLP = await mgvLogic.liquidityProvider(mgvMarket);
```

Besides posting offers on Mangrove, a `LiquidityProvider` instance `mgvLP` gives access to various useful functions such as:

```javascript
const missingAskProvision = await mgvLP.computeAskProvision();
const missingBidProvision = await mgvLP.computeBidProvision();
```

which return the missing provision (in native tokens) this liquidity provider needs to deposit on Mangrove if it wishes to post a new bid or ask. When provision is missing, one may fund Mangrove using:

```javascript
const ethersTx = await mgvLP.fundMangrove(missingAskProvision);
await ethersTx.wait(); // waiting for the funding tx to be confirmed
```
