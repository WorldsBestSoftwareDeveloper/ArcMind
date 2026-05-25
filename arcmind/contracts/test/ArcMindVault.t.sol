// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/ArcMindVault.sol";
import "../src/MockUSDC.sol";

contract ArcMindVaultTest is Test {
    MockUSDC usdc;
    ArcMindVault vault;
    address agent = address(0xA11CE);
    address user = address(0xB0B);

    function setUp() public {
        usdc = new MockUSDC();
        vault = new ArcMindVault(address(usdc), agent, address(0xC1));
        usdc.mint(user, 1_000e6);
    }

    function testDepositAndWithdraw() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 500e6);
        uint256 shares = vault.deposit(500e6);
        assertEq(shares, 500e6);
        assertEq(vault.totalAssets(), 500e6);
        uint256 assets = vault.withdraw(250e6);
        assertEq(assets, 250e6);
        vm.stopPrank();
    }

    function testAgentPublishesRebalance() public {
        ArcMindVault.Allocation[] memory allocations = new ArcMindVault.Allocation[](2);
        allocations[0] = ArcMindVault.Allocation("trader-a", 6_000, 420, 28, "Consistent return stream");
        allocations[1] = ArcMindVault.Allocation("trader-b", 3_000, 210, 44, "Low drawdown diversifier");
        vm.prank(agent);
        vault.publishRebalance(allocations, keccak256("decision"), "Initial risk-adjusted portfolio");
        assertEq(vault.allocations().length, 2);
    }
}
