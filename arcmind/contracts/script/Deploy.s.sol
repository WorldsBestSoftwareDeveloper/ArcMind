// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/ArcMindVault.sol";

contract Deploy is Script {
    function run() external returns (ArcMindVault vault) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address agent = vm.envAddress("AGENT_ADDRESS");
        address paymaster = vm.envOr("CIRCLE_PAYMASTER_ADDRESS", address(0));

        vm.startBroadcast();
        vault = new ArcMindVault(usdc, agent, paymaster);
        vm.stopBroadcast();
    }
}
