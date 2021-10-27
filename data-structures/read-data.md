# View functions

## Read the current best offer ID of an **offer list**

{% tabs %}
{% tab title="Solidity" %}
{% code title="bestOffer.sol" %}
```solidity
import "./Mangrove.sol";

// context of the call
Mangrove mgv;
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