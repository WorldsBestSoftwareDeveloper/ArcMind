param(
  [Parameter(Mandatory=$true)][string]$PrivateKey,
  [Parameter(Mandatory=$true)][string]$UsdcAddress,
  [Parameter(Mandatory=$true)][string]$AgentAddress,
  [string]$CirclePaymasterAddress = "0x0000000000000000000000000000000000000000"
)

$env:ARC_RPC_URL = "https://rpc.testnet.arc.network"
$env:PRIVATE_KEY = 0x349935094d67d1bcb0332c7edd937baedcfa2932ab43fd69c0cc3f61bedc3448
$env:USDC_ADDRESS = 0x3600000000000000000000000000000000000000
$env:AGENT_ADDRESS = 0x36372af8f1C24655212C5c5fc84D175E7CffE82a
$env:CIRCLE_PAYMASTER_ADDRESS = 0x31BE08D380A21fc740883c0BC434FcFc88740b58

Set-Location "$PSScriptRoot\..\contracts"
forge script script/Deploy.s.sol:Deploy --rpc-url $env:ARC_RPC_URL --broadcast --verify
