# RobinPad V2 — OriginPad-style NFT Bonding Launchpad

Ini versi V2 untuk mengganti project lama `Create Coin` langsung menjadi alur mirip OriginPad:

```txt
launchCollection()
→ mint 100 NFT bonding curve
→ mint ke-100 auto deploy RecomToken
→ seed MockPool single-sided
→ tunggu 24 jam
→ lockVault()
→ 5 epoch airdrop 1% + burn 9%
```

## Penting

Versi ini memakai **MockPool**, bukan Uniswap V4 asli dulu. Tujuannya supaya alur bisa dites cepat di Robinhood Chain Testnet tanpa nunggu address V4 PoolManager/router/hook resmi.

Nanti MockPool bisa diganti Uniswap V4 integration.

## Yang diganti dari project lama

GANTI:

```txt
contracts/OriginPadFactory.sol
src/main.jsx
src/styles.css
scripts/deploy.js
hardhat.config.js
package.json
.env.example
```

TAMBAH folder/kontrak:

```txt
contracts/RecomLaunchpad.sol
contracts/RecomNFT.sol
contracts/RecomNFTDeployer.sol
contracts/RecomTokenFactory.sol
contracts/RecomToken.sol
contracts/RecomVault.sol
contracts/MockPool.sol
```

## Cara pakai paling gampang

Opsi paling aman: buat folder project baru, misalnya:

```txt
PROJECT_V2
```

Lalu copy semua file dari ZIP ini ke folder itu.

## Install

```bash
npm install
```

Kalau ada konflik toolbox Hardhat, jalankan:

```bash
npm install --save-dev hardhat@^2.22.19 "@nomicfoundation/hardhat-toolbox@hh2"
npm install dotenv @openzeppelin/contracts ethers react react-dom vite @vitejs/plugin-react
```

## Setup .env

Copy:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Isi:

```env
PRIVATE_KEY=0xPRIVATE_KEY_WALLET_TESTNET_KAMU
RH_RPC_URL=https://rpc.testnet.chain.robinhood.com
VITE_CHAIN_ID=46630
VITE_RPC_URL=https://rpc.testnet.chain.robinhood.com
VITE_EXPLORER_URL=https://explorer.testnet.chain.robinhood.com
VITE_RECOM_LAUNCHPAD=
```

Jangan pakai wallet utama. Pakai wallet test.

## Compile

```bash
npm run compile
```

## Deploy kontrak V2

```bash
npm run deploy
```

Output akan menampilkan beberapa address:

```txt
RecomVault: 0x...
RecomTokenFactory: 0x...
RecomNFTDeployer: 0x...
RecomLaunchpad: 0x...

Paste this to .env:
VITE_RECOM_LAUNCHPAD=0x...
```

Copy `VITE_RECOM_LAUNCHPAD` ke `.env`.

## Jalankan web

```bash
npm run dev
```

## Test flow

1. Buka web.
2. Connect wallet.
3. Isi form Launch Collection.
4. Klik `Launch Collection`.
5. Copy collection address yang muncul.
6. Klik `Mint NFT` sampai total minted 100.
7. Mint ke-100 akan auto deploy token dan pool mock.
8. Klik `Load` untuk refresh status.
9. Setelah 24 jam dari token deploy, klik `Lock Vault after 24h`.

## Catatan testing 100 mint

Karena cap NFT = 100, mint manual akan lama. Untuk test cepat, sementara bisa ubah di `RecomNFT.sol`:

```solidity
uint256 public constant MAX_SUPPLY = 100;
```

menjadi:

```solidity
uint256 public constant MAX_SUPPLY = 3;
```

Lalu deploy ulang. Ini hanya untuk test lokal/testnet.

## Catatan lockVault 24 jam

Untuk test cepat, sementara bisa ubah di `RecomToken.sol`:

```solidity
require(block.timestamp >= deployedAt + 24 hours, "Wait 24h");
```

menjadi:

```solidity
require(block.timestamp >= deployedAt + 5 minutes, "Wait 5m");
```

Lalu deploy ulang. Untuk mainnet, balikin ke 24 jam.

## File kontrak inti

- `RecomLaunchpad.sol` — entry point `launchCollection()`
- `RecomNFT.sol` — ERC-1155 bonding curve + marketplace basic
- `RecomNFTDeployer.sol` — deploy NFT collection
- `RecomTokenFactory.sol` — authorize collection + deploy token saat bonding
- `RecomToken.sol` — ERC-20 supply 1B, no transfer tax, vault lock
- `RecomVault.sol` — epoch airdrop/burn
- `MockPool.sol` — simulasi pool locked single-sided

## Belum ada di V2 ini

Belum Uniswap V4 asli:

```txt
OriginFeeHook.sol
OriginSwapRouter.sol
OriginFeeSplitter.sol
```

Itu tahap berikutnya setelah address Robinhood Chain Uniswap V4 sudah jelas.
