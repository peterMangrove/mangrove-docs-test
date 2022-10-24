# Mangrove's ecosystem

Mangrove's main contract may be deployed with additional useful contracts.

* [Mangrove Reader](reader.md) contract provide easy to parse views on Mangrove's state.
* [Mangrove Monitor](monitor.md) may act as a gas/density oracle for Mangrove and receives taker fees (if any).
* [Mangrove Cleaner ](cleaner.md)an order reverter that allows one to snipe offers for their bounty (or revert if the offer was eventually successful).
* [Mangrove Order](advanced-orders.md) is a contract that can be used to run advanced market orders on Mangrove, such as [GTC](https://www.investopedia.com/terms/g/gtc.asp) or [IOC](https://www.investopedia.com/terms/i/immediateorcancel.asp).
