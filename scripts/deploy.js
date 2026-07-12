import hre from "hardhat";

async function deploy(name, args = []) {
  const F = await hre.ethers.getContractFactory(name);

  const c = await F.deploy(...args);

  await c.waitForDeployment();

  const address = await c.getAddress();

  console.log(`${name}: ${address}`);

  return { contract: c, address };
}

async function main() {
  const vault = await deploy("RecomVault");

  const factory = await deploy("RecomTokenFactory", [vault.address]);

  const nftDeployer = await deploy("RecomNFTDeployer");

  const launchpad = await deploy("RecomLaunchpad", [
    nftDeployer.address,
    factory.address,
  ]);

  const tx = await factory.contract.setLaunchpad(launchpad.address);
await tx.wait();
console.log("TokenFactory launchpad set");

const tx2 = await vault.contract.setTokenFactory(factory.address);
await tx2.wait();
  console.log("Vault tokenFactory set");
  
  console.log("TokenFactory launchpad set");

  console.log("\nPaste this to .env:");
  console.log(`VITE_RECOM_LAUNCHPAD=${launchpad.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});