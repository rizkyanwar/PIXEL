const hre = require("hardhat");

const VAULT_ABI = [
  "function tokenStart(address token) view returns(uint256)",
  "function executedEpochs(address token) view returns(uint8)",
  "function epochTimes(uint256 index) view returns(uint256)",
  "function executeEpoch(address token,address[] losers) external",
];

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
}

async function main() {
  const vaultAddress = process.env.VITE_RECOM_VAULT || process.env.RECOM_VAULT;
  const tokenAddress =
    process.env.KEEPER_TOKEN ||
    process.env.VITE_DEFAULT_TOKEN ||
    process.env.RECOM_TOKEN;

  const losersRaw =
    process.env.KEEPER_LOSERS ||
    process.env.KEEPER_LOSER ||
    process.env.DEPLOYER_ADDRESS ||
    "";

  if (!isAddress(vaultAddress)) {
    throw new Error("Missing vault address. Set VITE_RECOM_VAULT in .env.");
  }

  if (!isAddress(tokenAddress)) {
    throw new Error(
      "Missing token address. Set KEEPER_TOKEN=0x... or VITE_DEFAULT_TOKEN=0x..."
    );
  }

  const losers = losersRaw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!losers.length || losers.some((addr) => !isAddress(addr))) {
    throw new Error(
      "Missing losers. Set KEEPER_LOSERS=0xabc...,0xdef... in .env."
    );
  }

  const [signer] = await hre.ethers.getSigners();

  console.log("Keeper signer:", signer.address);
  console.log("Vault:", vaultAddress);
  console.log("Token:", tokenAddress);
  console.log("Losers:", losers.join(", "));

  const vault = new hre.ethers.Contract(vaultAddress, VAULT_ABI, signer);

  const start = await vault.tokenStart(tokenAddress);
  const executed = await vault.executedEpochs(tokenAddress);

  console.log("Token start:", start.toString());
  console.log("Executed epochs:", executed.toString());

  if (start === 0n) {
    console.log("Token not registered. Skip.");
    return;
  }

  if (Number(executed) >= 5) {
    console.log("All epochs done. Skip.");
    return;
  }

  const delay = await vault.epochTimes(executed);
  const readyAt = start + delay;

  const block = await hre.ethers.provider.getBlock("latest");
  const now = BigInt(block.timestamp);

  console.log("Current epoch:", Number(executed) + 1);
  console.log("Ready at:", readyAt.toString());
  console.log("Now:", now.toString());

  if (now < readyAt) {
    console.log("Too early. Skip.");
    return;
  }

  console.log("Ready. Executing epoch...");

  const tx = await vault.executeEpoch(tokenAddress, losers);
  console.log("Tx:", tx.hash);

  const receipt = await tx.wait();
  console.log("Executed in block:", receipt.blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});