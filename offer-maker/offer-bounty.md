---
description: How taker compensation for failing offers works.
---

# Offer bounties

## Summary

When an offer fails, the caller has wasted some gas. To compensate the caller, Mangrove gives them a bounty. An offer must provision enough ethers to maximize the chances that Mangrove can compensate the caller. In more details:
* Every account can have a balance (in ethers) held by Mangrove. They are free to fund this balance or withdraw from it at any time.
* Whenever an account creates or updates an offer, their balance is adjusted and some ethers are locked in that offer's provision. That provision can only be withdrawn back to the offer's account balance if the offer is retracted.
* When an offer fail, part or all of the offer provision is sent as a bounty to the caller. The rest of the provision is credited back to the offer's account balance.

## Balance funding & withdrawal

### Funding an account

{% tabs %}
{% tab title="Signature" %}
```solidity
function fund(address maker) public payable;
```
{% endtab %}

{% tab title="Events" %}
```solidity
// Offer Maker at address `maker` has been credited of `amount` WEIs
event Credit(address maker, uint amount);
```
{% endtab %}

{% tab title="Solidity" %}
{% code title="fund.sol" %}
```solidity
import "./Mangrove.sol";
//context 
Mangrove mgv; // Mangrove contract address
address maker_contract; // address of the maker contract one is willing to provision
// funding maker_contract
mgv.fund{value: 0.1 ether}(maker_contract);

// if funding oneself one can use the overload:
mgv.fund{value: 0.1 ether}();
```
{% endcode %}
{% endtab %}

{% tab title="ethers.js" %}
{% code title="fund.js" %}
```javascript
const { ethers } = require("ethers");
//context
let MGV; // address of Mangrove
let MGV_abi; // Mangrove contract's abi
let maker_contract_address; // address of the Maker Contract

const Mangrove = new ethers.Contract(
    MGV, 
    MGV_abi, 
    ethers.provider
    );

let overrides = { value: ethers.parseUnits("0.1", 18) };
// provisioning Mangrove on behalf of MakerContract
await Mangrove["fund(address)"](maker_contract_address, overrides);
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Inputs

* `maker` the address to credit

#### Outputs

None.

#### Description

The function is `payable`, so you want to call it with `mgv.fund{value:<funding amount>}()`. You can also simply do `mgv.call{value:<funding amount>}()` and Mangrove will fund the balance of `msg.sender`.

{% hint style="danger" %}
**Do not use `send` or `transfer`**

Upon receiving funds, Mangrove will credit the amount sent to `maker` (or `msg.sender` if the `receive` function was called). This involves writing to storage, which consumes more gas than the amount given by `send` and `transfer`.
{% endhint %}

### Checking an account balance
{% tabs %}
{% tab title="Signature" %}
```solidity
function balanceOf(address who) external view returns (uint balance);
```
{% endtab %}

### Inputs
* `who` The account of which you want to read the balance.

### Outputs
* `balance` The available balance of `who`.

### Withdrawing

At any time, your available balance can be withdrawn. It may be less than what you deposited: your balance adjusts every time you create/update an offer.

{% tabs %}
{% tab title="Signature" %}
```solidity
function withdraw(uint amount) external returns (bool noRevert);
```
{% endtab %}

{% tab title="Events" %}
```solidity
event Debit(address maker, uint amount);
```
{% endtab %}

{% tab title="Revert strings" %}
```solidity
// Trying to withdraw unavailable funds
"mgv/insufficientProvision"
```
{% endtab %}

{% tab title="Solidity" %}
```solidity
import "./Mangrove.sol";
//context 
Mangrove mgv; // Mangrove contract

uint wei_balance = mgv.balanceOf(address(this));
require(mgv.withdraw(wei_balance),"Mangrove failed to transfer funds");
```
{% endtab %}

{% tab title="ethers.js" %}
```javascript
const { ethers } = require("ethers");
//context
let MGV; // address of Mangrove
let MGV_abi; // Mangrove contract's abi
let maker_contract_address; // address of the Maker Contract
let signer; // tx signer

const Mangrove = new ethers.Contract(
    MGV, 
    MGV_abi, 
    ethers.provider
    );

// only if tx signer has posted a trivial offer
const wei_balance = await Mangrove.balanceOf(signer.address);
if (await Mangrove.callstatic.withdraw(wei_balance)) {
    await Mangrove.connect(signer).withdraw(wei_balance);
} else {
    console.log("Mangrove failed to transfer funds");
}
```
{% endtab %}
{% endtabs %}

#### Inputs
* `amount` the amount in WEI one wishes to withdraw from Mangrove's provisions.

#### Outputs
* `noRevert` whether the ether transfer was successful.


{% hint style="danger" %}
**Important points**

* The account credited will be `msg.sender`.
* `amount` must be $$\leq$$ your available balance (available with `balanceOf`)
{% endhint %}

## Balance adjustment when creating/updating offers

Whenever an offer is created or updated, Mangrove applies to following formula to get the offer's required provision:

$$\textrm{provision} = \max(\textrm{gasprice}_{\textrm{mgv}},\textrm{gasprice}_{\textrm{ofr}}) \times (\textrm{gasreq} + \textrm{gasoverhead})$$ (in wei)

* $$\textrm{gasprice}_{\textrm{mgv}}$$ is [Mangrove's internal `gasprice` estimate](../meta-topics/governance.md#global-governance-parameters).
* $$\textrm{gasprice}_{\textrm{ofr}}$$ is the `gasprice` argument of the function being called ([`newOffer`](../offer-maker/reactive-offer.md#posting-a-new-offer) or [`updateOffer`](../offer-maker/reactive-offer.md#updating-an-existing-offer)).
* $$\textrm{gasreq}$$ is the `gasreq` argument of the function being called.
* $$\textrm{gasoverhead}$$ is the sum of two [Mangrove's internal gas overhead estimators](../data-structures/offer-data-structures.md#mgvlib.offer)

Mangrove will adjust the balance of the caller to ensure that $$\textrm{provision}$$ wei are available as bounty if the offer fails. If the offer was _already_ provisioned, the adjustment may be small, and the balance may actually increase -- for instance, if the `gasprice` dropped recently.

{% hint style="info" %}
**Incentivized book cleaning**

Provisions are calculated so that, within reasonable gas estimates, taking a failing offer should be profitable for the taker.
{% endhint %}

{% hint style="info" %}
**Gas optimization**

If you frequently update your offers, we recommend using a consistent, high `gasprice` argument, above the actual expected gas prices. Not changing `gasprice` when you call `updateOffer` will make the call cheaper (you save one `SSTORE`).
{% endhint %}

## Computing the provision
A view function of the [Mangrove Reader](../meta-topics/mangroves-ecosystem/reader.md) contract will compute offer provisions for you. This is useful for e.g. testing that your balance is large enough before posting multiple offers.

{% tabs %}
{% tab title="Signature" %}
```solidity
function getProvision(
    address outbound_tkn,
    address inbound_tkn,
    uint ofr_gasreq,
    uint ofr_gasprice
) external view returns (uint provision);
```
{% endtab %}

{% tab title="Solidity snippet" %}
{% code title="getProvision.sol" %}
```solidity
import "./MgvReader.sol";
//context 
MgvReader mgvr; // MgvReader contract address
address outTk; // outbound token address
address inbTk; // inbound token address

// computing bounty for 100K gas offer (at Mangrove's gas price)
uint bounty = mgvr.getProvision(outTk, inbTk, 100_000, 0);
```
{% endcode %}
{% endtab %}

{% tab title="with ethers.js" %}
{% code title="getProvision.js" %}
```javascript
const { ethers } = require("ethers");
let outTkn; // address of outbound token ERC20
let inbTkn; // address of inbound token ERC20
let MGV_reader_address; // address of Mangrove reader
let MGV_reader_abi; // Mangrove Reader contract's abi

const MangroveReader = new ethers.Contract(
    MGV_reader_address, 
    MGV_reader_abi, 
    ethers.provider
    );

const ofr_gasreq = ethers.parseUnits("1",5); //100,000 gas units
const bounty = await MangroveReader.getProvision(outTkn, inbTkn, ofr_gasreq,0);
```
{% endcode %}
{% endtab %}
{% endtabs %}

### Inputs

* `outbound_tkn` the **outbound token** of the offer you want to create/update
* `inbound_tkn` the **inbound_tkn** of the offer you want to create/update
* `ofr_gasreq` the `gasreq` you will use in your call to `newOffer`/`updateOffer`.
* `ofr_gasprice` the gas price, in **gwei/gas**, that you will use when calling `newOffer`/`updateOffer`.
  * Set to 0 to use Mangrove's [gas price](../meta-topics/governance.md#gas-price-and-oracle)).

### Outputs
* `provision` the amount of wei Mangrove will require to provision in order to accept a new offer with the given parameters.


{% hint style="warning" %}
**Applied bounty**

Suppose an offer requires $$g_{\mathsf{ofr}}$$​ gas units to execute. As explained above, Mangrove will require the offer's associated account to provision $$\beta$$ WEI. Suppose the offer is executed during a Taker Order and fails after $$g_{\mathsf{used}}$$gas units ($$g_\mathsf{used}<g_\mathsf{ofr}$$). The portion of the bounty that will be transferred to the Offer Taker's account is $$\dot G*(\dot g_0+\dot g_1+g_\mathsf{used})$$ where $$\dot G$$​, $$\dot g_0$$ and $$\dot g_1$$are respectively the [`global.gasprice`](../meta-topics/governance.md#global-parameters), [`local.overhead_gasbase`](../meta-topics/governance.md#offer-list-specific-governance-parameters) and the [`local.offer_gasbase`](../meta-topics/governance.md#offer-list-specific-governance-parameters) values \_at the time the offer is taken \_(which may differ from their values at the time the offer was posted, as a consequence of some parameter changes by the governance).
{% endhint %}
