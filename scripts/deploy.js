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
  console.log("Deploying HOOKED contracts...\n");

  const vault = await deploy("RecomVault");

  const factory = await deploy("RecomTokenFactory", [vault.address]);

  const nftDeployer = await deploy("RecomNFTDeployer");

  const launchpad = await deploy("RecomLaunchpad", [
    nftDeployer.address,
    factory.address,
  ]);

  console.log("\nConfiguring contracts...");

  const setLaunchpadTx = await factory.contract.setLaunchpad(launchpad.address);
  await setLaunchpadTx.wait();
  console.log("TokenFactory launchpad set:", launchpad.address);

  const setTokenFactoryTx = await vault.contract.setTokenFactory(factory.address);
  await setTokenFactoryTx.wait();
  console.log("Vault tokenFactory set:", factory.address);

  console.log("\nPaste this to .env:");
  console.log(`VITE_RECOM_VAULT=${vault.address}`);
  console.log(`VITE_RECOM_TOKEN_FACTORY=${factory.address}`);
  console.log(`VITE_RECOM_NFT_DEPLOYER=${nftDeployer.address}`);
  console.log(`VITE_RECOM_LAUNCHPAD=${launchpad.address}`);

  console.log("\nClear these when testing fresh deployment:");
  console.log("VITE_DEFAULT_COLLECTION=");
  console.log("VITE_DEFAULT_TOKEN=");
  console.log("VITE_DEFAULT_POOL=");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});