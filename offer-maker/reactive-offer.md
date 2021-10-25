---
description: Reactive offers are liquidity promises
---

# Reactive Offers

{% hint style="info" %}
**Editor's note**

For each function described below, we include the following tabs:

* Signature - the function's Solidity signature
* Events - possible Mangrove events emitted by calling this function
* Revert reasons - all possible strings returned after a revert
* Solidity - Solidity code example
* ethers.js - Javascript code example using [ethers.js](https://docs.ethers.io/v5/)
{% endhint %}

A **Reactive Offer** is a promise, posted on a Mangrove [Offer List](broken-reference), that an address (a [contract](maker-contract.md) or an [EOA](../offer-making-strategies/basic-offer.md)) is able to deliver a certain amount of **outbound tokens** in return for a certain amount of **inbound tokens**.

## Posting a new Reactive Offer

New offers should usually be posted by [Maker Contract](maker-contract.md) able to source liquidity when asked to by Mangrove (although it [is possible](../offer-making-strategies/basic-offer.md) to post new offers from an EOA).

The code of `newOffer` is [available here](https://github.com/giry-dev/mangrove/blob/552ab35500c34e831f40a68fac81c8b3e6be7f5b/packages/mangrove-solidity/contracts/MgvOfferMaking.sol#L49).

{% tabs %}
{% tab title="Signature" %}
```solidity
function newOffer(
    address outboundTkn,
    address inboundTkn,
    uint wants, // amount of inbound Tokens
    uint gives, // amount of outbound Tokens
    uint gasreq,
    uint gasprice,
    uint pivotId
) external returns (uint offerId);
```
{% endtab %}

{% tab title="Events" %}
```solidity
// logging new offer's data 
event OfferWrite(
      address outboundTkn,
      address inboundTkn,
      address maker, // address of the Maker Contract for the callback function
      uint wants,
      uint gives,
      uint gasprice, // gasprice that was used to compute the offer bounty
      uint gasreq,
      uint offerId, // id of the new offer
      uint prev // offer id of the closest best offer at the time of insertion 
    );
 // `maker` (who is `msg.sender`) is debited of `amount` WEIs to provision the offer
 event DebitWei(address maker, uint amount);
```
{% endtab %}

{% tab title="Revert strings" %}
```javascript
// Gatekeeping
"mgv/dead" // Mangrove contract is terminated
"mgv/inactive" // Trying to post an offer in an inactive market

// Order book has reached its maximal number of orders (2**24)
"mgv/offerIdOverflow" // Unlikely as max offer id is 2**24

// Overflow
"mgv/writeOffer/gasprice/16bits"
"mgv/writeOffer/gives/96bits"
"mgv/writeOffer/wants/96bits"

// Invalid values
"mgv/writeOffer/gasreq/tooHigh" // gasreq above gasmax
"mgv/writeOffer/gives/tooLow"   // gives should be > 0
"mgv/writeOffer/density/tooLow" // wants / (gasreq + overhead) < density

// Insufficient provision
"mgv/insufficientProvision" // provision of `msg.sender` should cover offer bounty
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="newOffer.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";
import "path_to_interfaces/ERC20.sol";

// context of the call
address MGV;
address outTkn; // address offer's outbound token
address inbTkn; // address of offer's inbound token
address admin; // admin address of this contract
uint pivotId; // offer id whose price is the closest to this new offer (observed offchain)

// the following is a snippet of the Maker Contract that will manage the new offer
// i.e this contract SHOULD have the makerExecute() callback function somewhere.

// Approve Mangrove for outbound token transfer if not done already
ERC20(outTkn).approve(MGV, type(uint).max);
uint outDecimals = ERC20(outTkn).decimals();
uint inbDecimals = ERC20(inbTkn).decimals();

// calling mangrove with offerId as pivot (assuming price update will not change much the position of the offer)
Mangrove(MGV).newOffer(
        outTkn, // reposting on the same market
        inbTkn, 
        5.0*10**inbDecimals, // maker wants 5 inbound tokens
        7.0*10**outDecimals, // maker gives 7 outbound tokens
        500000, // maker requires 500_000 gas units to comply 
        0, // use mangrove's gasprice oracle  
        pivotId // heuristic: tries to insert this offer after pivotId
);

    
```
{% endcode %}
{% endtab %}
{% endtabs %}

### Inputs

* `outbound_tkn` address of the [**outbound token**](broken-reference) (that the offer will provide).
* `inbound_tkn` address of the [**inbound token**](broken-reference) (that the offer will receive).
* `wants` amount of **inbound tokens** requested by the offer. **Must fit in a `uint96`**.
* `gives` amount of **outbound tokens** promised by the offer. **Must fit in a `uint96` and be strictly positive**.
* `gasreq `amount of gas that will be given to the [Maker Contract](maker-contract.md). **Must fit in a `uint24` and be lower than **[**gasmax**](../data-structures/mangrove-configuration.md#global-parameters). Should be sufficient to cover all calls to the [Maker Contract](maker-contract.md) ([`makerExecute`](maker-contract.md#offer-execution) and [`makerPosthook`](maker-contract.md#offer-post-hook)).
* `gasprice` gas price override used to compute the order provision (see [Offer Bounty](offer-bounty.md)). Any value lower than Mangrove's current [gasprice](../data-structures/mangrove-configuration.md#global-parameters) will be ignored (thus 0 means "use Mangrove's current [gasprice](../data-structures/mangrove-configuration.md#mgvlib-global)"). **Must fit in a `uint16`**.
* `pivotId` where to start the insertion process in the offer list. If `pivotId` is not in the **OL** at the time the transaction is processed, the new offer will be inserted starting from the **OL**'s [best](reactive-offer.md#getting-current-best-offer-of-a-market) offer. Should be the id of the existing live offer with the price closest to the price of the offer being posted.

### Outputs

* `offerId` the id of the newly created offer. Note that offer ids are scoped to [**OLs**](broken-reference), so many offers can share the same id.

{% hint style="danger" %}
#### Important points

* [x] If a callback to execute the trade is necessary (as for any offer that is not [trivial](../offer-making-strategies/basic-offer.md)), this callback SHOULD be a function of the contract calling `newOffer`as `msg.sender` will be the address used for the callback by Mangrove.
* [x] `gives` and `gasreq` parameters MUST be sufficient to comply with Mangrove's minimal [density](../data-structures/mangrove-configuration.md#local-parameters) for the (`outboundToken`,`inboundToken`) [Offer List](broken-reference).
* [x] The [Maker Contract](maker-contract.md) calling `newOffer` MUST have a sufficient ETH provision on the Mangrove to cover the [Offer Bounty](offer-bounty.md) of this offer.
* [x] `msg.sender` SHOULD approve Mangrove for `outboundToken` ERC transfer, for at least `gives` amount of token each time this offer is to be matched.
{% endhint %}

#### Updating an existing offer

Updating the parameters of an offer can be done via the `updateOffer` function described below (source code is [here](https://github.com/giry-dev/mangrove/blob/552ab35500c34e831f40a68fac81c8b3e6be7f5b/packages/mangrove-solidity/contracts/MgvOfferMaking.sol#L99)).

{% tabs %}
{% tab title="Signature" %}
```solidity
function updateOffer( 
    address outboundToken, 
    address inboundToken, 
    uint wants, 
    uint gives, 
    uint gasreq, 
    uint gasprice, 
    uint pivotId, 
    uint offerId
) external;
```
{% endtab %}

{% tab title="Events" %}
```solidity
event OfferWrite(
      address outboundToken,
      address inboundToken,
      address maker, // address of the Maker Contract for the callback function
      uint wants,
      uint gives,
      uint gasprice, // gasprice that was used to compute the offer bounty
      uint gasreq,
      uint offerId, // id of the updated offer
      uint prev // offer id of the closest best offer at the time of update
    );
// if old offer bounty is insufficient to cover the update, 
// `maker` is debited of `amount` WEIs to complement the bounty
 event DebitWei(address maker, uint amount);
 
// if old offer bounty is greater than the actual bounty, 
// `maker` is credited of the corresponding `amount`.
event CreditWei(address maker, uint amount);

 
```
{% endtab %}

{% tab title="Revert strings" %}
```javascript
// Gatekeeping
"mgv/dead" // Mangrove contract is terminated
"mgv/inactive" // Trying to update an offer in an inactive market

// Type error in the arguments
"mgv/writeOffer/gasprice/16bits"
"mgv/writeOffer/gives/96bits"
"mgv/writeOffer/wants/96bits"

// Invalid values
"mgv/writeOffer/gasreq/tooHigh" // gasreq above gasmax
"mgv/writeOffer/gives/tooLow"   // gives should be > 0
"mgv/writeOffer/density/tooLow" // wants / (gasreq + overhead) < density

// Invalid caller
"mgv/updateOffer/unauthorized" // caller must be the Maker Contract of the offer

// Insufficient provision
"mgv/insufficientProvision" // provision of caller no longer covers the offer bounty
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="updateOffer.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";

// context of the call
address MGV;
address outTkn; // address of market's base token
address inbTkn; // address of market's quote token
address admin; // admin address of this contract
uint gasreq; // gas required to execute the offer
...
...
// external function to update an offer
// assuming this contract has enough provision on Mangrove to repost the offer if need be 
function myUpdateOffer(
        uint wants, // new wants (raw amount in quote) 
        uint gives,  // new gives (raw amount in base)
        uint offerId // id of the the offer to be updated
) external {
        require(msg.sender == admin, "Invalid caller");
        // calling mangrove with offerId as pivot (assuming price update will not change much the position of the offer)
        Mangrove(MGV).updateOffer(
                outTkn, // reposting on the same market
                inbTkn, 
                wants, // new price 
                gives, 
                gasreq, 
                0, // use mangrove's gasprice oracle  
                offerId, // heuristic: use offer id as pivot. If offer is off the book, Mangrove will use best offer as pivot
                offerId // id of the offer to be updated
        );
}
...
...
```
{% endcode %}
{% endtab %}
{% endtabs %}

* The following parameters are the same as for `newOffer` (see above for documentation)
  * `outboundToken`
  * `inboundToken`
  * `wants`
  * `gives`
  * `gasreq`
  * `gasprice`
* `offerId` is the offer id of the offer to be updated.
* `pivotId` SHOULD be the id of an offer already in the book and close to the updated offer's eventual position.
  * You will spend much less gas if you select a `pivotId` close to `offerId`'s eventual position.
  * `pivotId == offerId` is completely OK.
  * If `pivotId == 0`, the offer's new position will be searched starting from the book's best offer.
* An offer can only be updated if the `msg.sender` is the [Maker Contract](maker-contract.md) of the offer.
* Parameters of `updateOffer` are subject to the same restrictions as `newOffer`(in terms of values and types, see **Revert reasons** tab).
* It is possible to update an offer that is no longer in the [Offer List](broken-reference) (after it was matched or because it was [retracted](reactive-offer.md#retracting-an-offer)), in which case the offer is reinserted in the book as a consequence of the update.
  * We recommend updating your offers instead of creating new ones, as it costs much less gas.

#### Retracting an offer

An offer can be withdrawn from the order book via the `retractOffer` function described below (source code is [here](https://github.com/giry-dev/mangrove/blob/ca281db629119013add03c8e8f40dbba45c5edae/packages/mangrove-solidity/contracts/MgvOfferMaking.sol#L136)).

{% tabs %}
{% tab title="Signature" %}
```solidity
function retractOffer(
    address outboundToken,
    address inboundToken,
    uint offerId,
    bool deprovision
  ) external;
```
{% endtab %}

{% tab title="Events" %}
```solidity
// emitted on all successful retract
event OfferRetract(
    address outboundToken, // address of the outbound token ERC of the offer
    address inboundToken, // address of the inbound token ERC of the offer
    uint offerId // the id of the offer that has been removed from the Offer List
    );

// emitted if offer is deprovisioned
event Credit(
    address maker, // address of the Maker Contract account to be credited
    uint amount // amount (in WEI) that are made available for the Maker Contract
); 
```
{% endtab %}

{% tab title="Revert strings" %}
```javascript
"mgv/retractOffer/unauthorized" // only the offer's Maker Contract may call.
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="retractOffer.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";

// context of the call
address MGV;
address outTkn; // address of market's base token
address inbTkn; // address of market's quote token
address admin; // admin address of this contract
...
...
// external function to update an offer
// assuming this contract has enough provision on Mangrove to repost the offer if need be 
function myRetractOffer(uint offerId) external {
        require(msg.sender == admin, "Invalid caller");
        // calling mangrove with offerId as pivot (assuming price update will not change much the position of the offer)
        Mangrove(MGV).retractOffer(
                outTkn, // reposting on the same market
                inbTkn, 
                offerId, // id of the offer to be updated
                false // do not deprovision offer, saves gas if one wishes to repost the offer later
        );
}
...
...
```
{% endcode %}
{% endtab %}
{% endtabs %}

* `outboundTkn` address of the outbound token ERC20.
* `inboundTkn` address of the inbound token ERC20.
* `offerId` the id of the offer to retract from the order book.
* `deprovision` is `true` if and only if the offer maker wishes to free the offer provision (in order to [withdraw](offer-bounty.md#withdrawing) the corresponding funds for instance).

### View functions

#### Getting current best offer of a market

{% tabs %}
{% tab title="Solidity" %}
{% code title="bestOffer.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";

// context of the call
address MGV;
address outTkn; // address of Offer List's outbound token
address inbTkn; // address of Offer List's inbound token

// getting best offer of the (outTkn, inbTkn) Offer List
uint bestOfferId = Mangrove(MGV).best(outTkn, inbTkn); 
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="bestOffer.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let MGV_address; // address of Mangrove
let MGV_abi; // Mangrove contract's abi

const Mangrove = new ethers.Contract(
    MGV_address, 
    MGV_abi, 
    ethers.provider
    );

// getting best offer of the (outTkn,inbTk) market
const bestOfferId = await Mangrove.best(outTkn, inbTkn); 
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Accessing offer data

The [data structures](../data-structures/offer-data-structures.md) describing the content of an offer are accessible either using a low level access (recommended when calling from a contract) or through a high level view function (that should only be used off chain).

{% tabs %}
{% tab title="Solidity" %}
{% code title="getOfferData.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";
import "path_to_mangrove/MgvLib.sol";
import "path_to_mangrove/MgvPack.sol";

// context of the call
address MGV;
address outTkn; 
address inbTkn;
uint offerId; // the id of the offer one wishes to get the data of

// if one wishes to read *the whole* offer data (gas costly!):
(MgvLib.Offer memory offer, MgvLib.OfferDetail memory offerDetail) = Mangrove(MGV).offerInfo(outTkn,inbTkn,offerId);

// if one wishes to access a few particular fields, say wants, gives and gasreq parameters of the offer: 
// 1. getting packed (outTkn, inbTkn) Offer List data
bytes32 packedOffer = Mangrove(MGV).offers(outTkn,inbTkn,offerId);
bytes32 packedOfferDetail Mangrove(MGV).offerDetails(outTkn,inbTkn,offerId);

// 2. unpacking necessary fields only
uint wants = MgvPack.offer_unpack_wants(packedOffer);
uint gives = MgvPack.offer_unpack_gives(packedOffer);
uint gasreq = MgvPack.offerDetail_unpack_gasreq(packedOfferDetail);
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="getOfferData.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let MGV_address; // address of Mangrove
let MGV_abi; // Mangrove contract's abi

const Mangrove = new ethers.Contract(
    MGV_address, 
    MGV_abi, 
    ethers.provider
    );

// getting offer data in an abi compatible format
const [offer, offerDetail] = await Mangrove.offerInfo(outTkn,inbTkn,offerId);

// now one can access any field, say wants, gives and gasprice of the offer:
const wants = offer.wants;
const gives = offer.gives;
const gasreq = offerDetail.gasreq;
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Testing whether an offer is live

An offer is **live** in a given [Offer Lists](../data-structures/market.md) if it can be matched during a market order, or sniped by a liquidity taker. One can easily verify whether `offerId` identifies a **live** offer in a (`outboundToken`,`inboundToken`) Offer List of Mangrove using the following view function.

{% tabs %}
{% tab title="Solidity" %}
{% code title="isLive.sol" %}
```solidity
import "path_to_mangrove/Mangrove.sol";

// context of the call
address MGV;
address outTkn;
address inbTkn;
address offerId;

// checking whether offerId is live in the (outTkn, inbTkn) order book.
bool isLive = Mangrove(MGV).isLive(outTkn,inbTkn,offerId));
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="isLive.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let offerId; // offer id
let MGV_address; // address of Mangrove
let MGV_abi; // Mangrove contract's abi

const Mangrove = new ethers.Contract(
    MGV_address, 
    MGV_abi, 
    ethers.provider
    );

// checking whether offerId is live on (outTkn, inbTkn) Offer List.
const isLive = await Mangrove.isLive(outTkn,outTkn,offerId);
```
{% endcode %}
{% endtab %}
{% endtabs %}
