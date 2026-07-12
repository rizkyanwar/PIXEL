const hre = require("hardhat");

const ERC20_ABI = [
  "function balanceOf(address account) view returns(uint256)",
  "function decimals() view returns(uint8)",
  "function symbol() view returns(string)",
  "function vault() view returns(address)",
  "function vaultLocked() view returns(bool)",
];

async function main() {
  const token = process.env.KEEPER_TOKEN || process.env.VITE_DEFAULT_TOKEN;
  const vault = process.env.VITE_RECOM_VAULT || process.env.RECOM_VAULT;

  if (!token) throw new Error("Missing KEEPER_TOKEN or VITE_DEFAULT_TOKEN");
  if (!vault) throw new Error("Missing VITE_RECOM_VAULT");

  const c = new hre.ethers.Contract(token, ERC20_ABI, hre.ethers.provider);

  const symbol = await c.symbol();
  const decimals = await c.decimals();
  const uiVault = vault;

  let tokenVault = "";
  let locked = false;

  try {
    tokenVault = await c.vault();
  } catch {
    tokenVault = "token.vault() not available";
  }

  try {
    locked = await c.vaultLocked();
  } catch {
    locked = false;
  }

  const vaultBal = await c.balanceOf(uiVault);
  const tokenVaultBal =
    tokenVault.startsWith("0x") ? await c.balanceOf(tokenVault) : 0n;

  console.log("Token:", token);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals.toString());
  console.log("UI/env vault:", uiVault);
  console.log("Token canonical vault:", tokenVault);
  console.log("Vault locked:", locked);
  console.log("Balance env vault:", hre.ethers.formatUnits(vaultBal, decimals));

  if (tokenVault.startsWith("0x")) {
    console.log(
      "Balance token vault:",
      hre.ethers.formatUnits(tokenVaultBal, decimals)
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});