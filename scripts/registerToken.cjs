const hre = require("hardhat");

async function main() {
  const VAULT = process.env.VITE_RECOM_VAULT;
  const TOKEN = process.env.VITE_DEFAULT_TOKEN;

  if (!VAULT) {
    throw new Error("VITE_RECOM_VAULT belum ada di .env");
  }

  if (!TOKEN) {
    throw new Error("VITE_DEFAULT_TOKEN belum ada di .env");
  }

  console.log("Vault:", VAULT);
  console.log("Token:", TOKEN);

  const vault = await hre.ethers.getContractAt("RecomVault", VAULT);

  const tx = await vault.registerToken(TOKEN);
  console.log("registerToken tx:", tx.hash);

  await tx.wait();

  const start = await vault.tokenStart(TOKEN);
  const executed = await vault.executedEpochs(TOKEN);

  console.log("Token registered.");
  console.log("tokenStart:", start.toString());
  console.log("executedEpochs:", executed.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});