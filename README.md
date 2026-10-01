# AlimonyPay

AlimonyPay connects a payer and payee to a Stacks Clarity alimony agreement. The Testnet frontend reads the deployed agreement and claimable balance, and submits agreement, deposit, claim, and extra-funds transactions through a Leather or Xverse wallet.

## Run Locally

Requirements: Node.js 20 or later, npm, and a Leather or Xverse wallet configured for Stacks Testnet.

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Before installing, copy the environment example to `.env.local`: use `Copy-Item .env.local.example .env.local` in PowerShell or `cp .env.local.example .env.local` on macOS/Linux.

Open [http://localhost:3000](http://localhost:3000). The predev script registers the already deployed contract ID with Scaffold's generated hook bindings. The address is public; do not put a wallet mnemonic or private key in frontend environment files.

## Use the App

1. Connect a Testnet wallet. The app determines whether the connected address is the payer or payee from on-chain agreement state.
2. If no agreement exists, connect as the payer and create one with the payee address, amount per period, period length in Stacks blocks, and total periods. Creation sets terms; fund it separately.
3. As payer, deposit up to the agreement's authorized amount. The contract rejects deposits from other addresses and overfunding.
4. As payee, check the live claimable balance and claim vested STX. The contract caps claims at both vested and deposited funds.
5. As payee, submit one extra-funds request at a time with an amount, document value, and reason. The deployed contract requires a 64-character ASCII document value; IPFS/Arweave URLs are linked when they fit this field and use a supported gateway.
6. As payer, inspect the pending request and approve or reject it. Approved amounts vest immediately, but the payer must still deposit additional STX before those funds can be claimed.
7. Use **Refresh state** to reload agreement, claimable, balance, and pending-request data. Transaction status and explorer links appear after wallet confirmation.

The activity panel lists transactions confirmed during the current browser session. On-chain history remains available through the Stacks explorer.

## Deployed Contracts

| Network | Contract | Address | Deployment transaction |
| --- | --- | --- | --- |
| Stacks Testnet | `alimony-agreement` | [`ST2T6C1JTXS6AVQ4PTSQNS0MF666191WNC77NC2F.alimony-agreement`](https://explorer.hiro.so/address/ST2T6C1JTXS6AVQ4PTSQNS0MF666191WNC77NC2F.alimony-agreement?chain=testnet) | [View transaction](https://explorer.hiro.so/txid/4805dc6e370a4e738c44c4335192058f7e5f814edf4241bca84d72dbd3435b34?chain=testnet) |

Check contracts and generate the bindings with Scaffold Stacks from the repository root (WSL on Windows):

```bash
stacksdapp check
stacksdapp generate
```

Run contract simnet tests using Node.js 20 or later:

```bash
cd contracts
npm install
npm test
```
