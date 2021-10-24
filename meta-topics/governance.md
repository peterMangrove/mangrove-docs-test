# Governance

{% hint style="info" %}
**Global** governance parameters apply to all interactions with Mangrove. **Local** governance parameters are  (`outboundtkn, inbound_tkn`) [Offer List](../data-structures/market.md) specific. Both global and local parameters are under the control of Mangrove's governance.
{% endhint %}

## View functions

**Global** and **local** governance parameters are respectively gathered in the [`MgvLib.global`](../data-structures/mangrove-configuration.md#mgvlib.global) and [`MgvLib.local`](../data-structures/mangrove-configuration.md#mgvlib.local) data structures. A `bytes32` packing of these data structures can be obtained via the `config` getter of Mangrove, when gas efficient access to the configuration parameters is needed. Unpacking functions are provided via the [`MgvPack`](https://github.com/giry-dev/mangrove/blob/master/packages/mangrove-solidity/contracts/MgvPack.sol) library. The [`MgvReader`](deployment-addresses.md) view contract provide a `config` getter of the unpacked structures for easy-to-parse off chain access.

{% tabs %}
{% tab title="Calling from solidity" %}
```solidity
import "path_to_mangrove/Mangrove.sol"; // main contract
import "path_to_mangrove/MgvPack.sol"; // unpacking functions

// context 
address outbound_tkn ; // address of the ERC20 managing the outbound tokens
address inbound_tkn ; // address of the ERC20 managing the inbound tokens
Mangrove mgv; // address of the deployed Mangrove contract

// Getting packed configuration data
(bytes32 packedGlobal, bytes32 packedLocal) = mgv.config(outbound_tkn, inbound_tkn);

// extracting Mangrove's gasprice form packed global parameters
uint gasprice = MgvPack.unpack_global_gasprice(packedGlobal);

// extracting (outbound_tkn, inbound_tkn) Offer List's density from packed local parameters
uint density = MgvPack.unpack_local_density(packedLocal);


```
{% endtab %}

{% tab title="Calling from ethers.js" %}
```javascript
const { ethers } = require("ethers");
// context
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let MgvReader_address; // address of Mangrove reader
let MgvReader_abi; // Mangrove reader contract's abi

const MangroveReader = new ethers.Contract(
    MgvReader_address, 
    MgvReader_abi, 
    ethers.provider
    );
// getting global and local config using the Reader contract    
const [global, local] = await MgvReader.config(outTkn, inbTkn);
// accessing current gasprice and density parameters (as ethers.BigNumbers)
const gasprice = global.gasprice;
const density = local.density; 
```
{% endtab %}
{% endtabs %}



## Global parameters

### Gas price and oracle

Gas price is a key parameter of Mangrove that determines the remuneration of Offer Cleaners&#x20;

### Maximum allowed gas

### Shutting down Mangrove

### Setting up a Governance contract

### Changing Mangrove's vault address

### Monitoring Mangrove's transactions



## Offer List specific governance parameters

### Taker fees

### Density

### (De)activating an Offer List

### Gas base

