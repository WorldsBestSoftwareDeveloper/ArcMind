// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title ArcMindVault
/// @notice USDC vault where an off-chain AI agent publishes periodic trader allocations.
/// @dev The vault stores deposits, shares, and transparent AI rebalance decisions on Arc.
contract ArcMindVault {
    struct Allocation {
        bytes32 traderId;
        uint16 weightBps;
        int256 expectedEdgeBps;
        uint256 riskScore;
        string thesis;
    }

    IERC20 public immutable usdc;
    address public owner;
    address public agent;
    address public circlePaymaster;
    uint256 public totalShares;
    uint256 public lastRebalanceAt;
    uint256 public minRebalanceInterval = 6 hours;
    bytes32 public latestDecisionHash;
    bool public paused;

    mapping(address => uint256) public sharesOf;
    Allocation[] private _allocations;

    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event AgentUpdated(address indexed previousAgent, address indexed nextAgent);
    event CirclePaymasterUpdated(address indexed previousPaymaster, address indexed nextPaymaster);
    event PauseUpdated(bool paused);
    event RebalancePublished(
        address indexed agent,
        bytes32 indexed decisionHash,
        uint256 allocationCount,
        uint256 vaultUsdc,
        string rationale
    );
    event RebalanceIntervalUpdated(uint256 interval);

    error NotOwner();
    error NotAgent();
    error Paused();
    error ZeroAmount();
    error InvalidWeight();
    error CooldownActive();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    constructor(address usdc_, address agent_, address circlePaymaster_) {
        owner = msg.sender;
        usdc = IERC20(usdc_);
        agent = agent_;
        circlePaymaster = circlePaymaster_;
    }

    function deposit(uint256 assets) external whenNotPaused returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        uint256 supply = totalShares;
        uint256 vaultAssets = totalAssets();
        shares = supply == 0 || vaultAssets == 0 ? assets : (assets * supply) / vaultAssets;
        totalShares = supply + shares;
        sharesOf[msg.sender] += shares;
        if (!usdc.transferFrom(msg.sender, address(this), assets)) revert TransferFailed();
        emit Deposit(msg.sender, assets, shares);
    }

    function withdraw(uint256 shares) external returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();
        uint256 userShares = sharesOf[msg.sender];
        require(userShares >= shares, "INSUFFICIENT_SHARES");
        assets = (shares * totalAssets()) / totalShares;
        sharesOf[msg.sender] = userShares - shares;
        totalShares -= shares;
        if (!usdc.transfer(msg.sender, assets)) revert TransferFailed();
        emit Withdraw(msg.sender, assets, shares);
    }

    function publishRebalance(
        Allocation[] calldata nextAllocations,
        bytes32 decisionHash,
        string calldata rationale
    ) external onlyAgent whenNotPaused {
        if (lastRebalanceAt != 0 && block.timestamp < lastRebalanceAt + minRebalanceInterval) revert CooldownActive();

        uint256 totalWeight;
        delete _allocations;
        for (uint256 i = 0; i < nextAllocations.length; i++) {
            totalWeight += nextAllocations[i].weightBps;
            _allocations.push(nextAllocations[i]);
        }
        if (totalWeight > 10_000) revert InvalidWeight();

        latestDecisionHash = decisionHash;
        lastRebalanceAt = block.timestamp;
        emit RebalancePublished(msg.sender, decisionHash, nextAllocations.length, totalAssets(), rationale);
    }

    function allocations() external view returns (Allocation[] memory) {
        return _allocations;
    }

    function totalAssets() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function pricePerShare() external view returns (uint256) {
        return totalShares == 0 ? 1e6 : (totalAssets() * 1e6) / totalShares;
    }

    function setAgent(address nextAgent) external onlyOwner {
        emit AgentUpdated(agent, nextAgent);
        agent = nextAgent;
    }

    function setCirclePaymaster(address nextPaymaster) external onlyOwner {
        emit CirclePaymasterUpdated(circlePaymaster, nextPaymaster);
        circlePaymaster = nextPaymaster;
    }

    function setPaused(bool nextPaused) external onlyOwner {
        paused = nextPaused;
        emit PauseUpdated(nextPaused);
    }

    function setRebalanceInterval(uint256 interval) external onlyOwner {
        minRebalanceInterval = interval;
        emit RebalanceIntervalUpdated(interval);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        owner = nextOwner;
    }
}
