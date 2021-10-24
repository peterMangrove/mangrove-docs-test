# Configuration

Ground truth for configuration can be found at \[\<TODO>link to MgvDoc.html]\(TODO)

All configuration options are under the control of [governance](../meta-topics/governance.md).&#x20;

## MgvLib.Global

| Name        | Type      | Description                                                                                                                                                              |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gasprice`  | `uint16`  | Internal gasprice estimate, in gwei/gas. Used to calculate the provision required for writing offers.                                                                    |
| `monitor`   | `address` | If enabled, acts as a gasprice oracle for Mangrove and/or receives notifications when an offer is executed.                                                              |
| `useOracle` | `bool`    | If true, monitor will be used as a gasprice oracle. Otherwise the internal gasprice global parameter will be used.                                                       |
| `notify`    | `bool`    | If true, monitor will be called every time an offer has been executed.                                                                                                   |
| `gasmax`    | `uint24`  | Maximum gas an offer can require.                                                                                                                                        |
| `dead`      | `bool`    | If true, this Mangrove instance is dead and the only possible interactions are retracting offers and getting provisions back. Once true, it cannot be set back to false. |

## MgvLib.Local

For every pair of addresses, there is a set of local parameters. Note that the parameters for the A/B pair might be different from the B/A pair parameters.

| Name                | Type     | Description                                                                     |
| ------------------- | -------- | ------------------------------------------------------------------------------- |
| `active`            | `bool`   | If inactive, offers on this pair can only be retracted.                         |
| `fee`               | `uint16` | Fee in basis points, at most 500.                                               |
| `density`           | `uint32` | Minimum amount of token an offer must promise per gas required.                 |
| `overhead_ gasbase` | `uint24` | Constant gas overhead associated with taking an any number of offers in 1 call. |
| `offer_gasbase`     | `uint24` | Gas overhead associated with taking one offer.                                  |
