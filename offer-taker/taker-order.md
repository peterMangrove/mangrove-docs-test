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

Tokens transfers initiated by Mangrove use ERC20's `transferFrom.` If Mangrove's `allowance` on spent tokens for the taker's address is too low, orders revert.

### Activate markets

Every Mangrove [**Offer List**](../data-structures/market) can be either [active or inactive](../data-structures/mangrove-configuration#mgvlib.local), and Mangrove itself can be either [alive or dead](data-structures/mangrove-configuration#mgvlib.global). Taking offers is only possible when Mangrove is alive on **OLs** that are active.


## Market order

A **Market Order** is Mangrove's main liquidity sourcing entrypoint. It is called on a given [Offer List](../data-structures/market.md) with its associated **outbound token** and **inbound token**. The liquidity taker specifies how many **outbound tokens** she _wants_ and how many **inbound tokens** she _gives_.

The order is processed by Mangrove's matching engine by consuming the offers of the list, starting from [the best one](../data-structures/market.md#rank). Execution works as follows, where at any point the taker's price is _give / wants._

1. Mangrove checks that the current offer's [price](../data-structures/market.md#wants-gives) is at least as good as the taker's price. Otherwise execution stops there.
2. Mangrove sends **inbound tokens **to the current offer's [Maker Contract](../offer-maker/maker-contract.md).
3. Mangrove then calls that Maker Contract.
4. If the call is successful, Mangrove sends **outbound tokens** to the taker. If the call or the transfer fail, Mangrove reverts the effects of steps 2. and 3.
5. The taker's _wants_ and _gives _are reduced.
6. If the taker's _wants_ has not been completely fulfilled, Mangrove moves back to step 1.

Any failed [offer](../offer-maker/reactive-offer.md) execution results in a [bounty](../offer-maker/offer-bounty.md) being sent to the caller as compensation for the wasted gas.

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
// Since the Maker Contracts that are called during the order may be partly reentrant, more logs could be emitted by Mangrove.
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
    // revert data sent by the Maker Contract
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
    uint takerGave // total amount of inbound tokens sent by taker
 );

```
{% endtab %}

{% tab title="Revert strings" %}
```solidity
// Gatekeeping
"mgv/dead" // Trying to take offers on a terminated Mangrove
"mgv/inactive" // Trying to take offers on an inactive Offer List

// Overflow
"mgv/mOrder/takerWants/160bits" // taker wants too much of a market Order
"mgv/mOrder/takerGives/160bits" // taker gives too much in the market order

// Panic reverts
"mgv/sendPenaltyReverted" // Mangrove could not send Offer Bounty to taker
"mgv/feeTransferFail" // Mangrove could not collect fees from the taker
"mgv/MgvFailToPayTaker" // Mangrove was unable to transfer outbound_tkn to taker (Taker blacklisted?)


```
{% endtab %}

{% tab title="Solidity" %}
{% code title="marketOrder.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";
import "path_to_interfaces/ERC20.sol";

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

* `outbound_tkn` address of the [**outbound token**](../data-structures/market.md#general-structure) (that the taker will buy).
* `inbound_tkn` address of the [**inbound token**](../data-structures/market.md#general-structure) (that the taker will spend).
* `takerWants` raw amount of **outbound token** the taker wants. Must fit on 160 bits.
* `takerGives` raw amount of **inbound token** the taker gives. Must fit on 160 bits.
* `fillWants`&#x20;
  * If true, the market order will stop as soon as `takerWants` **outbound tokens** have been bought. It is conceptually similar to a _buy order_.
  * If false, the market order will continue until `takerGives` **inbound tokens** have been spent. It is conceptually similar to _sell order_.
  * Note that market orders can stop for other reasons, such as the price being too high.

{% hint style="info" %}
**Example**

Consider the DAI-USDC **Offer List** with 2 offers:&#x20;

1. Offer #1 gives 10 DAI for 9.9 USDC.
2. Offer #2 gives 1 DAI for 0.98 USDC.&#x20;

If a taker calls `marketOrder`on this **OL **with`takerWants=2` and `takerGives = 2.2 `she is ready to give away up to 2.2 USDC in order to get 2 DAI.&#x20;

* If `fillWants=true `the market order will provide 2 DAI for 1.97 USDC.
  1. 0.99 from offer #1
  2. 0.98 from offer #2.&#x20;
* If `fillWants=false` the market order will provide 2.2123 DAI  for 2 USDC.
  1. 1 DAI for 0.98 USDC from offer #1
  2. 1.2323 DAI for the remaining 1.22 USDC from offer #2
{% endhint %}

### Outputs

* `takerGot` is the net amount of **outbound tokens** the taker has received after applying the [taker fee](../meta-topics/governance.md#taker-fees).
* `takerGave` is the amount of **inbound tokens** the taker has sent.&#x20;

{% hint style="success" %}
### Specification



At the end of a Market Order the following is guaranteed to hold:

* The taker will not spend more than `takerGives`.
* The average price paid will be maximally close to `takerGives/takerWants:`for each offer taken, the amount paid will be $$\leq$$ the expected amount + 1.
{% endhint %}

### More on market order behavior

Mangrove's market orders are quite configurable using the three parameters `wants`, `gives` and `fillWants`. For instance:

* You can run a 'classic' market **buy** order by setting `wants` to the amount you want to buy, `gives` to `type(uint160).max`, and `fillWants` to true.
* You can run a 'classic' market **sell** order by setting `wants` to `type(uint160).max`, `gives` to the amount you want to sell, and `fillWants` to false.
* You can run limit orders by setting `gives` and `wants` such that `gives`/`wants` is the volume-weighted price you are willing to pay and `fillWants` to true if you want to act as a buyer of **outbound token** or to false if you want to act as a seller if **inbound token**.
  * Note that, contrary to limit orders on regular orderbook-based exchanges, the residual of your order (i.e. the volume you were not able to buy/sell due to hitting your price limit) will _not_ be put on the market as an offer. Instead, the market order will simply end partially filled.
* You cannot run a limit order with a _maximum price_. For instance, if there are 3 offers with `gives` set to 1, offer #1 has price 1, offer #2 has price 2, and offer #3 has price 3, a regular limit order with `wants` set to 3 and `gives` set to 6 would consume offers until it hits an offer with a price above 2, so it would consume offers #1 and #2 but not #3. A Mangrove order with the same parameters will however consume offers #1, #2 and #3, spend 6, receive 3, and thus pay a volume-weighted price of 2.

## Offer sniping

It is also possible to target specific offer IDs in the [Offer List](../data-structures/market.md). This is called **Offer Sniping**.

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
// Since the Maker Contracts that are called during the order may be partly reentrant, more logs could be emitted by Mangrove.
// we list here only the main expected logs.

// For each offer successfully sniped:
event OfferSuccess(
    address indexed outbound_tkn,
    address indexed inbound_tkn,
    uint id, // offer Id
    address taker, // address of the market order call
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
    // revert data sent by the Maker Contract
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
"mgv/inactive" // Trying to take offers on an inactive Offer List

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
import "path_to_mangrove/Mangrove.sol";
import "path_to_interfaces/ERC20.sol";

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

* `outbound_tkn` outbound token address (received by the taker)
* `inbound_tkn` inbound token address (sent by the taker)
* `targets` an array of offers to take. Each element of `targets` is a `uint[4]`'s of the form `[offerId, takerWants, takerGives, gasreq_permitted]` where:
  * `offerId `is the ID of an [offer](../offer-maker/reactive-offer.md) that should be taken.
  * `takerWants` the amount of outbound tokens the taker wants from that [offer](../offer-maker/reactive-offer.md). **Must fit in a `uint96`.**
  * `takerGives` the amount of inbound tokens the taker is willing to give to that [offer](../offer-maker/reactive-offer.md). **Must fit in a `uint96`.**
  * `gasreq_permitted` is the maximum `gasreq` the taker will tolerate for that [offer](../offer-maker/reactive-offer.md). If the offer's `gasreq` is higher than `gasreq_permitted`, the offer will not be sniped. NB: `gasreq_permitted = type(uint).max` is a way to tolerate any gas requirement for the sniped [offer](../offer-maker/reactive-offer.md).

{% hint style="warning" %}
Offers can be updated, so if targets was just an array of `offerId`s, there would be no way to protect against a malicious offer update mined right before a snipe. The offer could suddenly have a worse price, or require a lot more gas. 

If you only want to take offers without any checks on the offer contents, you can simply set `takerWants` to `0`, set `takerGives` to `type(uint96).max`, Thus, those additional  One could A snipe target `[offerId, takerWants, takerGives, gasreq] `needs to specify `takerWants` and `takerGives` because the owner of `offerId` might have updated its price before the snipe transaction is mined. Similar reasoning applies to `gasreq`.
{% endhint %}

{% hint style="info" %}
Suppose `offerId` points to an offer of 10 DAIs (outbound token) for 10 USDCs (inbound tokens) on the (DAI, USDC) [Offer List](../data-structures/market.md#general-structure).  Sniping `offerId` for 9 DAIs in exchange of 10 USDC will result in the taker receiving 9 DAIs (minus potential fees) for 9 USDCs.

Sniping the offer for 9 DAIs for 8 USDCs will fail (the offer will not be taken) because the price required by the taker is lower than the price proposed by the maker.
{% endhint %}

### Outputs

* `fillWants: bool `follows the same principle as a [Market Order](taker-order.md#market-order).
* `successes: uint` is less or equal to `targets.length `and corresponds to the number of target [offers](../offer-maker/reactive-offer.md) that were successfully sniped.
* `takerGot` is the [net](../meta-topics/governance.md#taker-fees) amount of outbound tokens that were collected by the snipes order.
* `takerGave` is the amount of inbound tokens that were sent by the taker to the [Maker Contract](../offer-maker/maker-contract.md) managing the sniped [offers](../offer-maker/reactive-offer.md).

### fillWants

MUST be set to `true` if the taker wishes her order to terminate when she has received `takerWants` amount of outbound tokens. This flag MUST be set to `false` if the order is considered complete when the taker has given `takerGives` amount of inbound tokens.
