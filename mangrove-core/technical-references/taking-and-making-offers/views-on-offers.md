---
description: Mangrove getters for offers and offer lists.
---

# Views on offers

## Public getters

### `best(address outbound, address inbound)`

{% hint style="info" %}
Returns the offer identifier that occupies the best [rank](market.md#offer-rank) in the `(outbound, inbound)`[offer list](market.md).

* highest outbound volume
* least gas required
* oldest time of insertion on the list
{% endhint %}

{% tabs %}
{% tab title="Solidity" %}
{% code title="bestOffer.sol" %}
```solidity
import "src/IMangrove.sol";

// context of the call
IMangrove mgv;
address outbound_tkn;
address inbound_tkn;

uint best = mgv.best(outbound_tkn, inbound_tkn); 
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="bestOffer.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outboundTkn; // address of outbound token ERC20
let inboundTkn; // address of inbound token ERC20
let MGV_address;
let MGV_abi; // Mangrove contract's abi

const mgv = new ethers.Contract(
    MGV_address, 
    MGV_abi, 
    ethers.provider
    );

// getting best offer of the (outTkn,inbTk) market
const best = await mgv.best(outboundTkn, inboundTkn); 
```
{% endcode %}
{% endtab %}
{% endtabs %}

### `offers(address, address) / offerDetails(address, address, uint)`

{% hint style="info" %}
The data pertaining to a particular offer is contained in the `OfferUnpacked` and `OfferDetailUnpacked` structs, which are stored as packed custom types called, respectively, `OfferPacked` and `OfferDetailUnpacked.` For on-chain calls, Mangrove provides unpacking functions to extract a particular field out of a packed structure. For off-chain calls, Mangrove also provide direct getter for the unpacked structures.&#x20;
{% endhint %}

{% tabs %}
{% tab title="Solidity" %}
{% code title="getOfferData.sol" %}
```solidity
import "src/IMangrove.sol";
import {MgvStructs} "src/MgvLib.sol";

// context of the call
address MGV;
address outTkn; 
address inbTkn;
uint offerId; // the id of the offer one wishes to get the data of

// if one wishes to get the totally unpacked data (gas costly!):
(MgvStructs.OfferUnpacked memory offer, MgvStructs.OfferDetailUnpacked memory offerDetail) = Mangrove(MGV)
.offerInfo(outTkn,inbTkn,offerId);

// if one wishes to access a few particular fields, say `wants`, `gives` and `gasreq` parameters of the offer: 
// 1. getting packed (outTkn, inbTkn) Offer List data
MgvStructs.OfferPacked memory offer32 = Mangrove(MGV)
.offers(outTkn, inbTkn, offerId);
MgvStructs.OfferDetailPacked memory offerDetail32 = Mangrove(MGV)
.offerDetails(outTkn, inbTkn, offerId);

// for all fields f of OfferUnpacked
// offer.f == offer32.f()
// for all fields f of OfferDetailUnpacked
// offerDetail.f == offerDetail32.f()

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

### `isLive(address, address, uint)`

{% hint style="info" %}
An offer is **live** in a given [Offer Lists](market.md) if it can be matched during a [market order](taker-order/). One can  verify whether `offerId` identifies a **live** offer in a (`outboundToken`,`inboundToken`) Offer List of Mangrove using this view function.
{% endhint %}

{% tabs %}
{% tab title="Solidity" %}
{% code title="isLive.sol" %}
```solidity
import "src/IMangrove.sol";

// context of the call
IMangrove mgv;
address outTkn;
address inbTkn;
address offerId;

// checking whether offerId is live in the (outTkn, inbTkn) order book.
bool isLive = mgv.isLive(outTkn,inbTkn,offerId);
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

## Custom types

{% hint style="info" %}
Offer data is split between `OfferUnpacked` and `OfferDetailedUnPacked` for  storage read/write optimisation (as both structs can be efficiently packed on storage).
{% endhint %}

### `MgvLib.MgvStructs.OfferUnpacked`

| Type     | Field   | Comments                                                                   |
| -------- | ------- | -------------------------------------------------------------------------- |
| `uint32` | `prev`  | Predecessor offer id (better price)                                        |
| `uint32` | `next`  | Successor offer id (worst price)                                           |
| `uint96` | `gives` | What the offer gives (in _wei_ units of base token of the offer's market)  |
| `uint96` | `wants` | What the offer wants (in _wei_ units of quote token of the offer's market) |

### `MgvLib.OfferDetailUnpacked`

| Type      | Field           | Comments                                                                                                                                  |
| --------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `address` | `maker`         | address of the offer's [Maker Contract](reactive-offer/maker-contract.md)                                                                 |
| `uint24`  | `gasreq`        | Gas required by the offer (in gas units)                                                                                                  |
| `uint16`  | `gasprice`      | The gas price covered by the offer bounty (in _gwei_ per gas units)                                                                       |
| `uint24`  | `offer_gasbase` | Mangrove's [gasbase](../governance-parameters/mangrove-configuration.md#local-parameters) at the time the offer was posted (in gas units) |

##
