const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentWall", function () {
  async function deployFixture() {
    const [deployer, holder, stranger] = await ethers.getSigners();

    const MockAgentID = await ethers.getContractFactory("MockAgentID");
    const mock = await MockAgentID.deploy();
    await mock.waitForDeployment();

    // Only `holder` owns an Agent ID, like a real dipta.ai wallet.
    await mock.mint(holder.address);

    const AgentWall = await ethers.getContractFactory("AgentWall");
    const wall = await AgentWall.deploy(await mock.getAddress());
    const deployReceipt = await wall.deploymentTransaction().wait();

    return { deployer, holder, stranger, mock, wall, deployReceipt };
  }

  it("reports deployment gas", async function () {
    const { deployReceipt } = await deployFixture();
    console.log("        deployment gas used:", deployReceipt.gasUsed.toString());
  });

  it("lets an Agent ID holder sign", async function () {
    const { wall, holder } = await deployFixture();
    await expect(wall.connect(holder).sign("Hello from an Agent ID holder!"))
      .to.emit(wall, "MessageSigned")
      .withArgs(holder.address, 0, "Hello from an Agent ID holder!", (ts) => ts > 0);
    expect(await wall.messageCount()).to.equal(1);
    const m = await wall.getMessage(0);
    expect(m.signer).to.equal(holder.address);
    expect(m.text).to.equal("Hello from an Agent ID holder!");
    expect(m.timestamp).to.be.gt(0);
  });

  it("rejects wallets without an Agent ID", async function () {
    const { wall, stranger } = await deployFixture();
    await expect(
      wall.connect(stranger).sign("I should not get in")
    ).to.be.revertedWithCustomError(wall, "NotAgentIdHolder");
    expect(await wall.messageCount()).to.equal(0);
  });

  it("rejects empty and over-long messages", async function () {
    const { wall, holder } = await deployFixture();
    await expect(wall.connect(holder).sign("")).to.be.revertedWithCustomError(
      wall,
      "EmptyMessage"
    );
    await expect(
      wall.connect(holder).sign("x".repeat(281))
    ).to.be.revertedWithCustomError(wall, "MessageTooLong");
    // Exactly 280 bytes is fine.
    await wall.connect(holder).sign("x".repeat(280));
    expect(await wall.messageCount()).to.equal(1);
  });

  it("paginates messages oldest-first", async function () {
    const { wall, holder } = await deployFixture();
    await wall.connect(holder).sign("first");
    await wall.connect(holder).sign("second");
    await wall.connect(holder).sign("third");
    const page = await wall.getMessages(1, 2);
    expect(page.length).to.equal(2);
    expect(page[0].text).to.equal("second");
    expect(page[1].text).to.equal("third");
    expect(await wall.getMessages(5, 10)).to.deep.equal([]);
  });

  it("isAgentIdHolder mirrors balanceOf", async function () {
    const { wall, holder, stranger } = await deployFixture();
    expect(await wall.isAgentIdHolder(holder.address)).to.equal(true);
    expect(await wall.isAgentIdHolder(stranger.address)).to.equal(false);
  });
});
