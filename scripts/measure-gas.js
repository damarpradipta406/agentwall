// Measure real gas costs on the local Hardhat network:
//   npx hardhat run scripts/measure-gas.js
// Prints deployment gas and sign() gas for a typical message.
const { ethers } = require("hardhat");

async function main() {
  const [, holder] = await ethers.getSigners();
  const Mock = await ethers.getContractFactory("MockAgentID");
  const mock = await Mock.deploy();
  await mock.waitForDeployment();
  await mock.mint(holder.address);

  const Wall = await ethers.getContractFactory("AgentWall");
  const wall = await Wall.deploy(await mock.getAddress());
  const deployReceipt = await wall.deploymentTransaction().wait();
  console.log("deployment gas:", deployReceipt.gasUsed.toString());

  const short = await wall.connect(holder).sign("Hello Agent ID world!");
  const r1 = await short.wait();
  console.log("sign() gas (first message):", r1.gasUsed.toString());

  const long = await wall
    .connect(holder)
    .sign("x".repeat(280));
  const r2 = await long.wait();
  console.log("sign() gas (280-char message):", r2.gasUsed.toString());

  const read = await wall.connect(holder).getMessages.staticCall(0, 10);
  console.log("messages stored:", read.length);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
