# Views on data

## Offer and offer list views

### `best(address, address)`

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

The [data-structures](../technical-references/data-structures/ "mention") describing [offer data](offer-data-structures.md#mgvlib.mgvstructs.offerunpacked) are accessible using `offers(address outbound, address inbound)` or `offerDetails(address outbound, address inbound, uint offerId)`.

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

// if one wishes to read *the whole* offer data (gas costly!):
(MgvStructs.OfferUnpacked memory offer, MgvStructs.OfferDetailUnpacked memory offerDetail) = Mangrove(MGV)
.offerInfo(outTkn,inbTkn,offerId);

// if one wishes to access a few particular fields, say wants, gives and gasreq parameters of the offer: 
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

An offer is **live** in a given [Offer Lists](../technical-references/taking-and-making-offers/market.md) if it can be matched during a market order, or sniped by a liquidity taker. One can easily verify whether `offerId` identifies a **live** offer in a (`outboundToken`,`inboundToken`) Offer List of Mangrove using this view function.

{% tabs %}
{% tab title="Solidity" %}
{% code title="isLive.sol" %}
```solidity
import "src/IMangrove.sol";

// context of the call
address MGV;
address outTkn;
address inbTkn;
address offerId;

// checking whether offerId is live in the (outTkn, inbTkn) order book.
bool isLive = IMangrove(MGV).isLive(outTkn,inbTkn,offerId));
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

## Configuration data

The data structures containing Mangrove's global and local [configuration parameters](mangrove-configuration.md) are accessible via the function `config(address outbound, address inbound)` function.

{% tabs %}
{% tab title="Solidity" %}
{% code title="config.sol" %}
```solidity
import "src/IMangrove.sol";

// context of the call
address MGV;
address outTkn;
address inbTkn;

// getting Mangrove's global configuration parameters and those that pertain to the `(outTkn, inTkn)` offer list
// in an ABI compatible format (gas costly, use for offchain static calls)
(MgvStructs.GlobalUnpacked global, MgvStructs.LocalUnpacked local) = IMangrove(MGV)
.configInfo(outTkn, inTkn);

// getting packed config data (gas efficient)
(MgvStructs.GlobalPacked global32, MgvStructs.LocalPacked local32) = IMangrove(MGV)
.config(outTkn, inTkn);

// for all fields f of GlobalUnpacked
// global.f == global32.f()
// for all fields f of LocalUnpacked
// local.f == local32.f()

```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="config.js" %}
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
const [global, local] = await Mangrove.configInfo(outTkn,inbTkn);

// now one can access any field, say gasprice and fee of the offer list:
const gasprice = global.gasprice; // Mangrove's current gasprice
const fee = local.fee; // (outTkn, inTkn) offer list's fee
```
{% endcode %}
{% endtab %}
{% endtabs %}
