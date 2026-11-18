require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: {},
    // BNB Chain testnet (chain 97). Deploy only with an explicit key:
    //   DEPLOYER_KEY=0x... npx hardhat run scripts/deploy.js --network bscTestnet
    // Never commit a key. Testnet BNB comes from the public faucet.
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts:
        process.env.DEPLOYER_KEY !== undefined
          ? [process.env.DEPLOYER_KEY]
          : [],
    },
    // BNB Chain mainnet (chain 56). Same rule: key via env var only.
    // Mainnet deployment is BLOCKED until funding is arranged (see README).
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts:
        process.env.DEPLOYER_KEY !== undefined
          ? [process.env.DEPLOYER_KEY]
          : [],
    },
  },
};
