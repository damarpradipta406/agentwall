// Deploy AgentWall.
//   npx hardhat run scripts/deploy.js --network bscTestnet   (testnet first)
//   npx hardhat run scripts/deploy.js --network bsc           (mainnet, BLOCKED: needs BNB)
//
// The Agent ID contract address defaults to the mainnet one from the
// Binance announcement. On testnet, pass AGENT_ID_CONTRACT with a mock
// or the testnet Agent ID address if one exists.
// The deployer key comes ONLY from the DEPLOYER_KEY env var. Never paste
// a key into this file, and never deploy to mainnet without funding.
const { ethers } = require("hardhat");

async function main() {
  if (!process.env.DEPLOYER_KEY) {
    throw new Error(
      "DEPLOYER_KEY env var is not set — refusing to deploy without an explicit key."
    );
  }
  const agentId =
    process.env.AGENT_ID_CONTRACT ||
    "0x60b9262456de011f7d15a54cdd8c48baaa8b022f"; // SPACE ID Agent ID (BSC mainnet)
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Agent ID contract:", agentId);

  const AgentWall = await ethers.getContractFactory("AgentWall");
  const wall = await AgentWall.deploy(agentId);
  const receipt = await wall.deploymentTransaction().wait();
  const address = await wall.getAddress();
  console.log("AgentWall deployed to:", address);
  console.log("Deployment gas used:", receipt.gasUsed.toString());
  console.log("Block:", receipt.blockNumber);
  console.log("Tx hash:", receipt.hash);
  console.log("Next: verify on BscScan, then put the address in frontend/config.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
