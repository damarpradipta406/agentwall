# AgentWall — On-chain guestbook for Agent ID holders

**Built for the Binance Agent ID Hackathon** (submission 18 Nov – 9 Dec 2026, 08:00 UTC).
Announcement: https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf

AgentWall is the simplest real use of Agent ID: an on-chain guestbook on BNB
Chain that **only Agent ID holders can sign**. The contract itself is the
bouncer — no Agent ID, no signature.

## The idea

Agent ID is the on-chain name (`name.ai`) of a Binance Agentic Wallet: an
ERC-721 NFT on BNB Chain (SPACE ID Agent ID,
`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`), one per wallet,
non-transferable. Launchpads already use it as a gate (Four.Meme's Agent ID
Exclusive mode, Flap's ID Agent Curve). AgentWall applies the same pattern
to something anyone can understand in five seconds: a wall you can only
sign if you hold an Agent ID.

- `sign("...")` — writes your message on-chain (max 280 characters).
- `getMessages(from, count)` / `getMessage(id)` — anyone can read the wall.
- `isAgentIdHolder(address)` — frontend helper, mirrors `balanceOf`.

## How Agent ID is used (the gate)

The contract stores the Agent ID contract address and checks it on every
write, exactly the integration point in the Binance announcement:

```solidity
modifier onlyAgentIdHolder() {
    if (agentId.balanceOf(msg.sender) == 0) revert NotAgentIdHolder();
    _;
}

function sign(string calldata text) external onlyAgentIdHolder { ... }
```

`balanceOf(address)` on the Agent ID contract returns `> 0` iff the caller
holds an Agent ID. Verified live on BNB Chain (block 134,312,876):
`balanceOf(0x444e553fE183c6fa098D1170b40c8171E77a80f2)` (the `dipta.ai`
Agentic Wallet) returns **1**.

The frontend repeats the same check before enabling the Sign button, and
best-effort resolves a signer's Agent ID name via
`tokenOfOwnerByIndex` + `tokenURI` (falls back to the plain address).

## Project layout

```
binance-hackathon/
├── contracts/
│   ├── AgentWall.sol        # the guestbook (Agent ID-gated)
│   └── MockAgentID.sol      # local-test stand-in for the Agent ID contract
├── test/
│   └── AgentWall.test.js    # 6 tests, all passing
├── scripts/
│   ├── deploy.js            # deploy to BSC testnet / mainnet (key via env var only)
│   └── measure-gas.js       # prints real deployment + sign() gas
├── frontend/
│   └── index.html           # single-file dApp (ethers v6 via CDN)
├── package.json
├── hardhat.config.js
├── README.md
└── x-post-draft.md          # draft post for the Promotion Award
```

## Verified so far (no BNB spent)

- `npx hardhat compile` — compiles clean (Solidity 0.8.20, optimizer on).
- `npx hardhat test` — **6/6 passing**: holder can sign, non-holder is
  rejected with `NotAgentIdHolder`, empty / >280-char messages rejected,
  pagination works, `isAgentIdHolder` mirrors `balanceOf`.
- Deployment gas (local Hardhat network): **777,063 gas**.
- `sign()` gas: **141,835** (first message) / **313,600** (280-char message).
- Live on-chain check: Agent ID contract name is `SPACE ID Agent ID`,
  symbol `AI`, and the `dipta.ai` wallet holds **1** Agent ID.

## Gas cost (BNB Chain, BNB ≈ $588.69 / ≈ Rp10,748,041 on 18 Nov 2026)

| Action | Gas | @ 0.05 gwei (measured) | @ 1 gwei | @ 3 gwei |
| --- | --- | --- | --- | --- |
| Deploy AgentWall | 777,063 | 0.000039 BNB (~Rp419) | 0.000777 BNB (~Rp8,351) | 0.002331 BNB (~Rp25,054) |
| sign() first message | 141,835 | 0.0000071 BNB (~Rp76) | 0.000142 BNB (~Rp1,525) | 0.000426 BNB (~Rp4,575) |
| sign() 280-char msg | 313,600 | 0.000016 BNB (~Rp169) | 0.000314 BNB (~Rp3,371) | 0.000941 BNB (~Rp10,113) |

Deployment itself is cheap. The blockers are elsewhere (see below).

## Run it locally

```bash
npm install
npx hardhat compile
npx hardhat test          # 6 tests + deployment gas
npx hardhat run scripts/measure-gas.js
```

Frontend (after deploy — see below):

```bash
cd frontend
python3 -m http.server 8000   # then open http://localhost:8000
```

Reads work without a wallet (public BSC RPC). To sign, connect MetaMask or
Binance Wallet on BNB Chain mainnet (chain 56) with an Agent ID in it.

## Deploy (NOT done — blocked, see below)

Testnet first (free test BNB from the public faucet):

```bash
DEPLOYER_KEY=0x... npx hardhat run scripts/deploy.js --network bscTestnet
```

Then mainnet, then verify the source on BscScan and paste the deployed
address into `CONFIG.CONTRACT_ADDRESS` in `frontend/index.html`.

## Blockers — what still stands between this and a submission

1. **BNB for deployment + a deployer key.** Deployment costs ~777k gas
   (≈ Rp419 at the 0.05 gwei measured on 18 Nov 2026, ≈ Rp8,351 at
   1 gwei). Cheap — but it must be paid from a funded deployer wallet,
   and the deployer key has to come from the user. The user's Binance
   Agentic Wallet (`dipta.ai`) is **not logged in** (pairing expired) and
   holds only **~Rp4,628 total**, so it cannot fund this as-is. Practical
   path: fund a fresh throwaway deployer key with ~0.001 BNB (≈ Rp11,000)
   — needs the user's explicit approval + the top-up.
2. **Public repo.** The hackathon requires open-source code (and BscScan
   source verification). The code lives in this folder only; it needs to
   be pushed to a public GitHub repo. The user has **no GitHub account**.
3. **30 Agent ID holders.** The Innovation Award requires the product to
   be live with **at least 30 Agent ID addresses interacting** during the
   submission period, and the Project Awards rank by interacting Agent ID
   addresses + volume. A brand-new guestbook starts at zero — reaching 30
   holders means promoting it in Agent ID communities / on X. This is a
   traction job, not a code job.
4. **Promotion Award is the realistic one.** Posting on X with
   `#BinanceWalletHackathon` + `#AgenticWallet` (20 winners share
   $2,000) needs no deployment and no traction. Draft in `x-post-draft.md`
   — post from the user's X account when ready.

## Hackathon submission checklist

- [x] Idea + contract + tests + frontend + gas measured
- [ ] Fund deployer wallet (~0.001 BNB) + deploy to BSC mainnet
- [ ] Verify source on BscScan (needs a free BscScan API key)
- [ ] Push code to a public repo (needs a GitHub account)
- [ ] Set `CONTRACT_ADDRESS` in the frontend, host it somewhere public
- [ ] Submit project name, website, contract address(es), Agent ID usage
      description during the Submission Period (by 9 Dec 2026 08:00 UTC)
- [ ] Get 30+ Agent ID holders to sign (Innovation Award eligibility)
- [ ] Post on X for the Promotion Award (draft ready)

## License

MIT — see `LICENSE` (same as the contract header).
