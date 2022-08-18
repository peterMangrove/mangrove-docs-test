---
description: Basic taker side functions
---

# Taking offers

{% hint style="info" %}
**Editor's note**

For each function described below, we include the following tabs:

* Signature - the function's Solidity signature
* Events - possible Mangrove events emitted by calling this function
* Revert reasons - all possible strings returned after a revert
* Solidity - Solidity code example
* ethers.js - Javascript code example using [ethers.js](https://docs.ethers.io/v5/)
{% endhint %}

## Generalities

### Token allowance

ERC20 tokens transfers are initiated by Mangrove using `transferFrom`. If Mangrove's `allowance` on the taker's address (for tokens to be spent) is too low, the order will revert.

### Active offer lists

Every Mangrove[ offer list ](../data-structures/market.md)can be either [active or inactive](../meta-topics/governance.md#de-activating-an-offer-list), and Mangrove itself can be either [alive or dead](../meta-topics/governance.md#shutting-down-mangrove). Taking offers is only possible when Mangrove is alive on offer lists that are active.

## Market order

A **Market Order** is Mangrove's main liquidity sourcing entrypoint. It is called on a given [offer list](../data-structures/market.md) with its associated _outbound_ token (tokens that flow out of Mangrove) and _inbound_ token (tokens that flow into Mangrove). The liquidity taker specifies how many _outbound_ tokens she _wants_ and how many **** _inbound_ tokens she _gives_.

When an order is processed by Mangrove's matching engine, it consumes the offers on the selected [offer list](../data-structures/market.md), starting from the [best](../data-structures/read-data.md#read-the-current-best-offer-id-of-an-offer-list) one. Execution works as follows, where at any point the taker's price is `takerGives` _/_ `takerWants`_._

1. Mangrove checks that the current offer's [price](../data-structures/market.md#wants-gives-and-offer-price) is at least as good as the taker's price. Otherwise execution stops there.
2. Mangrove sends _inbound_ tokens to the current offer's associated [account](../offer-maker/maker-contract.md).
3. Mangrove then executes the offer logic.
4. If the call is successful, Mangrove sends _outbound_ tokens to the taker. If the call or the transfer fail, Mangrove reverts the effects of steps 2. and 3.
5. The taker's _wants_ and _gives_ are reduced.
6. If the taker's _wants_ has not been completely fulfilled, Mangrove moves back to step 1.

Any failed [offer](../offer-maker/reactive-offer.md) execution results in a [bounty](../offer-maker/offer-provision.md#computing-the-provision-and-offer-bounty) being sent to the caller as compensation for the wasted gas.

{% tabs %}
{% tab title="Signature" %}
```solidity
function marketOrder(
    address outbound_tkn,
    address inbound_tkn,
    uint takerWants,
    uint takerGives,
    bool fillWants
  ) external returns (uint takerGot, uint takerGave);
```
{% endtab %}

{% tab title="Events" %}
```solidity
// Since the contracts that are called during the order may be partly reentrant, more logs could be emitted by Mangrove.
// we list here only the main expected logs.

// For each succesful offer taken during the market order:
event OfferSuccess(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint id, // offer Id
    address taker, // address of the market order call
    uint takerWants, // original wants of the order
    uint takerGives // original gives of the order
  );
  
// For each offer cleaned during the market order:
event OfferFail(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint id,
    address taker,
    uint takerWants,
    uint takerGives,
    // `statusCode` may only be `"mgv/makerAbort"`, `"mgv/makerRevert"`, `"mgv/makerTransferFail"` or `"mgv/makerReceiveFail"`
    bytes32 statusCode,
    // revert data sent by the offer's associated account
    bytes32 makerData
  );
  
// For each offer whose posthook reverted during second callback:
// 1. Loging offer failure
event PosthookFail(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint offerId,
    bytes32 makerData
  );
 // 2. Debiting maker from Offer Bounty
event Debit(address indexed maker, uint amount);

// Logging at the end of Market Order:
event OrderComplete(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    address taker,
    uint takerGot, // net amount of outbound tokens received by taker
    uint takerGave, // total amount of inbound tokens sent by taker
    uint penalty, // the total penalty collected by msg.sender as bounty for failing offers
    uint feePaid // the fee paid by the taker
 );
```
{% endtab %}

{% tab title="Revert strings" %}
```solidity
// Gatekeeping
"mgv/dead" // Trying to take offers on a terminated Mangrove
"mgv/inactive" // Trying to take offers on an inactive offer list

// Overflow
"mgv/mOrder/takerWants/160bits" // taker wants too much of a market Order
"mgv/mOrder/takerGives/160bits" // taker gives too much in the market order

// Panic reverts
"mgv/sendPenaltyReverted" // Mangrove could not send the offer bounty to taker
"mgv/feeTransferFail" // Mangrove could not collect fees from the taker
"mgv/MgvFailToPayTaker" // Mangrove was unable to transfer outbound_tkn to taker (Taker blacklisted?)
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="marketOrder.sol" %}
```solidity
import "./Mangrove.sol";
import "./ERC20.sol";

// context of the call
address MGV;
address outTkn; // address offer's outbound token
address inbTkn; // address of offer's inbound token

uint outDecimals = ERC20(outTkn).decimals();
uint inbDecimals = ERC20(inbTkn).decimals();

// if Mangrove is not approved yet for inbound token transfer.
ERC20(inbTkn).approve(MGV, type(uint).max);

// a market order of 5 outbound tokens (takerWants) in exchange of 8 input tokens (takerGives)
(uint takerGot, uint takerGave) = Mangrove(MGV).marketOrder(
    outTkn,
    inbTkn,
    5*10**outDecimals,
    8*10**inbDecimals,
    true
);
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="marketOrder.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let ERC20_abi; // ERC20 abi
let MGV_address; // address of Mangrove
let MGV_abi; // Mangrove contract's abi
let signer; // ethers.js transaction signer 

// loading ether.js contracts
const Mangrove = new ethers.Contract(
    MGV_address, 
    MGV_abi, 
    ethers.provider
    );

const InboundTkn = new ethers.Contract(
    inbTkn, 
    ERC20_abi, 
    ethers.provider
    );
    
const OutboundTkn = new ethers.Contract(
    outTkn, 
    ERC20_abi, 
    ethers.provider
    );
    
// if Mangrove is not approved yet for inbound token transfer.
await InboundTkn.connect(signer).approve(MGV_address, ethers.constant.MaxUint256);

const outDecimals = await OutboundTkn.decimals();
const inbDecimals = await InboundTkn.decimals();

// putting takerGives/Wants in the correct format
const takerGives = ethers.parseUnits("8.0", outDecimals);
const takerWants = ethers.parseUnits("5.0", inbDecimals);

// dry running market order
const [takerGot, takerGave] = await Mangrove.callstatic.marketOrder(
    outTkn,
    inbTkn,
    takerWants,
    takerGives,
    true
    );

// real market order if takerGot/takerGet is satisfying
await Mangrove.connect(signer).marketOrder(
    outTkn,
    inbTkn,
    takerWants,
    takerGives,
    true
    );
```
{% endcode %}
{% endtab %}
{% endtabs %}

### Inputs

* `outbound_tkn` address of the _outbound_ token (that the taker will buy).
* `inbound_tkn` address of the _inbound_ token (that the taker will spend).
* `takerWants` raw amount of outbound token the taker wants. Must fit on 160 bits.
* `takerGives` raw amount of _inbound_ token the taker gives. Must fit on 160 bits.
* `fillWants`
  * If `true`, the market order will stop as soon as `takerWants` _outbound_ tokens have been bought. It is conceptually similar to a _buy order_.
  * If `false`, the market order will continue until `takerGives` _inbound_ tokens have been spent. It is conceptually similar to _sell order_.
  * Note that market orders can stop for other reasons, such as the price being too high.

### Outputs

* `takerGot` is the net amount of _outbound_ tokens the taker has received after applying the [taker fee](../meta-topics/governance.md#taker-fees).
* `takerGave` is the amount of _inbound_ tokens the taker has sent.

{% hint style="success" %}
**Specification**

At the end of a Market Order the following is guaranteed to hold:

* The taker will not spend more than `takerGives`.
* The average price paid will be maximally close to `takerGives/takerWants:`for each offer taken, the amount paid will be $$\leq$$ the expected amount + 1.
{% endhint %}

| ID | wants (USDC) | gives (DAI) |
| -- | ------------ | ----------- |
| 2  | 0.98         | 1           |
| 1  | 9.9          | 10          |

{% hint style="info" %}
**Example**

Consider the DAI-USDC offer list above. If a taker calls `marketOrder`on this offer list with`takerWants=2` and `takerGives = 2.2` she is ready to give away up to 2.2 USDC in order to get 2 DAI.

* If `fillWants` is `true` the market order will provide 2 DAI for 1.97 USDC.
  1. 1 DAI for 0.98 USDC from offer #2
  2. 1 DAI for 0.99 from offer #1
* If `fillWants` is `false` the market order will provide 2.2078 DAI for 2 USDC.
  1. 1 DAI for 0.98 USDC from offer #1
  2. 1.2078 DAI for the remaining 1.22 USDC from offer #2
{% endhint %}

### More on market order behavior

Mangrove's market orders are quite configurable using the three parameters `takerWants`, `takerGives` and `fillWants`.

* **Market buy:** You can run a 'classic' market **buy** order by setting `takerWants` to the amount you want to buy, `takerGives` to `type(uint160).max`, and `fillWants` to `true`.
* **Market sell:** You can run a 'classic' market **sell** order by setting `takerWants` to `type(uint160).max`, `takerGives` to the amount you want to sell, and `fillWants` to `false`.
* **Limit order**: You can run limit orders by setting `takerGives` and `takerWants` such that `takerGives`/`takerWants` is the volume-weighted price you are willing to pay and `fillWants` to `true` if you want to act as a buyer of _outbound_ token or to `false` if you want to act as a seller if _inbound_ token.

{% hint style="warning" %}
**On order residuals**

Contrary to limit orders on regular [orderbook](https://www.investopedia.com/terms/o/order-book.asp)-based exchanges, the residual of your order (i.e. the volume you were not able to buy/sell due to hitting your price limit) will _not_ be put on the market as an offer. Instead, the market order will simply end partially filled.
{% endhint %}

### Market order prices are volume-weighted

Consider the following A-B offer list:

| ID | Wants (B) | Gives (A) | Price (B per A) |
| -- | --------- | --------- | --------------- |
| 1  | 1         | 1         | 1               |
| 2  | 2         | 1         | 2               |
| 3  | 6         | 2         | 3               |

A regular limit order with `takerWants` set to 3 A and `takerGives` set to 6 B would consume offers until it hits an offer with a price above 2, so it would consume offers #1 and #2, but not offer #3.

In Mangrove, a "market order" with the same parameters will however consume offers #1 and #2 completely and #3 partially (for 3 Bs only), and result in the taker spending 6 (1+2+6/2) and receiving (1+1+2/2), which corresponds to a volume-weighted price of 2, complying with the Taker Order.

## Offer sniping

It is also possible to target specific offer IDs in the [offer list](../data-structures/market.md). This is called **Offer Sniping**.

{% hint style="info" %}
Offer sniping can be used by off-chain bots and price aggregators to build their own optimized market order, targeting for instance offers with a higher volume or less gas requirements in order to optimize the gas cost of filling the order.
{% endhint %}

{% tabs %}
{% tab title="Signature" %}
```solidity
function snipes(
    address outbound_tkn,
    address inbound_tkn,
    uint[4][] memory targets, 
    bool fillWants
  )
    external
    returns (
      uint successes, 
      uint takerGot,
      uint takerGave
    );
```
{% endtab %}

{% tab title="Events" %}
```solidity
// Since the contracts that are called during the order may be partly reentrant, more logs could be emitted by Mangrove.
// we list here only the main expected logs.

// For each offer successfully sniped:
event OfferSuccess(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint id, // offer Id
    address taker, // address of the market order caller
    uint takerWants, // original wants of the order
    uint takerGives // original gives of the order
  );
  
// For each offer cleaned by the snipe:
event OfferFail(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint id,
    address taker,
    uint takerWants,
    uint takerGives,
    // `statusCode` may only be `"mgv/makerAbort"`, `"mgv/makerRevert"`, `"mgv/makerTransferFail"` or `"mgv/makerReceiveFail"`
    bytes32 statusCode,
    // revert data sent by offer's associated account
    bytes32 makerData
  );
  
// If a sniped offer's posthook reverted during second callback:
// 1. Loging offer failure
event PosthookFail(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint offerId,
    bytes32 makerData
  );
 // 2. Debiting maker from Offer Bounty
event Debit(address indexed maker, uint amount);

// Logging at the end of all snipes:
event OrderComplete(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    address taker,
    uint takerGot, // net amount of outbound tokens received by taker
    uint takerGave // total amount of inbound tokens sent by taker
 );
```
{% endtab %}

{% tab title="Revert strings" %}
```javascript
// Gatekeeping
"mgv/dead" // Trying to take offers on a terminated Mangrove
"mgv/inactive" // Trying to take offers on an inactive offer list

// Overflow
"mgv/snipes/takerWants/96bits" // takerWants for snipe overflows
"mgv/snipes/takerGives/96bits" // takerGives for snipe overflows

// Panic reverts
"mgv/sendPenaltyReverted" // Mangrove could not send Offer Bounty to taker
"mgv/feeTransferFail" // Mangrove could not collect fees from the taker
"mgv/MgvFailToPayTaker" // Mangrove was unable to transfer outbound_tkn to taker (Taker blacklisted?)
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="snipes.sol" %}
```solidity
import "./Mangrove.sol";
import "./ERC20.sol";

// context of the call
address MGV;
address outTkn; // address offer's outbound token
address inbTkn; // address of offer's inbound token
uint offer1; // first offer one wishes to snipe
uint offer2; // second offer one wishes to snipe

uint outDecimals = ERC20(outTkn).decimals();
uint inbDecimals = ERC20(inbTkn).decimals();

// if Mangrove is not approved yet for inbound token transfer.
ERC20(inbTkn).approve(MGV, type(uint).max);

// a market order of 5 outbound tokens (takerWants) in exchange of 8 input tokens (takerGives)
(uint successes, uint takerGot, uint takerGave) = Mangrove(MGV).snipes(
    outTkn,
    inbTkn,
    [
        [offer1, 1.5*10**outDecimals, 2*10**inbDecimals, 100000], // first snipe
        [offer2, 1.5*10**outDecimals, 2.2*10**inbDecimals, 50000] // second snipe
    ],
    true // fillwants
);
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="snipes.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let ERC20_abi; // ERC20 abi
let MGV_address; // address of Mangrove
let MGV_abi; // Mangrove contract's abi
let signer; // ethers.j . s transaction signer 

// loading ether.js contracts
const Mangrove = new ethers.Contract(
    MGV_address, 
    MGV_abi, 
    ethers.provider
    );

const InboundTkn = new ethers.Contract(
    inbTkn, 
    ERC20_abi, 
    ethers.provider
    );
    
const OutboundTkn = new ethers.Contract(
    outTkn, 
    ERC20_abi, 
    ethers.provider
    );
    
// if Mangrove is not approved yet for inbound token transfer.
await InboundTkn.connect(signer).approve(MGV_address, ethers.constant.MaxUint256);

// preparing snipes data
const outDecimals = await OutboundTkn.decimals();
const inbDecimals = await InboundTkn.decimals();

const snipe1 = [ // first snipe spec
         offer1, //offer id
         ethers.parseUnits("1.5",outDecimals), //takerWants from offer1
         ethers.parseUnits("2.0",inbDecimals), //takerGives to offer1
         ethers.utils.parseUnits("1.0",5) // 100,000 gas units to execute
     ];
const snipe2 = [ // second snipe spec
         offer2, //offer id
         ethers.parseUnits("1.5",outDecimals), //takerWants from offer1
         ethers.parseUnits("2.2",inbDecimals), //takerGives to offer1
         ethers.utils.parseUnits("1.0",4) // 50,000 gas units to execute
     ];
     
// dry running snipes
const [successes, takerGot, takerGave] = Mangrove.callstatic.snipes(
    outTkn,
    inbTkn,
    [snipe1, snipe2],
    true // fillwants
    );

successes; // = 2 if both snipes were a success
takerGot; // how much taker received after both snipes;
takerGave; // how much taker sent after both snipes;

// triggering snipes for real
await Mangrove.connect(signer).snipes(
    outTkn,
    inbTkn,
    [snipe1, snipe2],
    true // fillwants
    );
```
{% endcode %}
{% endtab %}
{% endtabs %}

### Inputs

* `outbound_tkn` _outbound_ token address (received by the taker)
* `inbound_tkn` _inbound_ token address (sent by the taker)
* `targets` an array of offers to take. Each element of `targets` is a `uint[4]`'s of the form `[offerId, takerWants, takerGives, gasreq_permitted]` where:
  * `offerId` is the ID of an [offer](../offer-maker/reactive-offer.md) that should be taken.
  * `takerWants` the amount of outbound tokens the taker wants from that [offer](../offer-maker/reactive-offer.md). **Must fit in a `uint96`.**
  * `takerGives` the amount of inbound tokens the taker is willing to give to that [offer](../offer-maker/reactive-offer.md). **Must fit in a `uint96`.**
  * `gasreq_permitted` is the maximum `gasreq` the taker will tolerate for that [offer](../offer-maker/reactive-offer.md). If the offer's `gasreq` is higher than `gasreq_permitted`, the offer will not be sniped.
* `fillWants` specifies whether you are acting as a buyer of **outbound tokens**, in which case you will buy at most `takerWants`, or a seller of **inbound tokens**, in which case you will buy as many tokens as possible as long as you don't spend more than `takerGives`. See more extensive discussion of `fillWants` in the [market order section](offer-taker/taker-order/#input).

{% hint style="warning" %}
**Protection against malicious offer updates**

Offers can be updated, so if `targets` was just an array of `offerId`s, there would be no way to protect against a malicious offer update mined right before a snipe. The offer could suddenly have a worse price, or require a lot more gas.

If you only want to take offers without any checks on the offer contents, you can simply:

* Set `takerWants` to `0`,
* Set `takerGives` to `type(uint96).max`,
* Set `gasreq_permitted` to `type(uint).max`, and
* Set `fillWants` to `false`.
{% endhint %}

### Outputs

* `successes` is the number of successfully sniped offers.
* `takerGot` is the [total](../meta-topics/governance.md#taker-fees) amount of _outbound_ tokens that were collected by the order.
* `takerGave` is the total amount of _inbound_ tokens spent by the taker during the snipe.

#### Example

| ID | Wants | Gives | Gas required |
| -- | ----- | ----- | ------------ |
| 13 | 10    | 10    | 80\_000      |
| 2  | 1     | 2     | 250\_000     |

{% hint style="info" %}
**Example**

Consider the above offers on the DAI-USDC offer list:

Setting `targets` to `[[13,8,10,80_000],[2,1,1.1,250_000]]` with `fillWants` set to `true` will successfully buy 8 DAI from offer #13 (for 8 USDC), and will not attempt to execute offer #2 since 1.1 > 1/2.
{% endhint %}
