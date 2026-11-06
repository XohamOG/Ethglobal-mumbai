import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(`\n========================================`);
  console.log(` Deploying RiskRegistry to ${network.name}`);
  console.log(`========================================`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance  : ${ethers.formatEther(balance)} ETH`);

  // CRE Forwarder address from env, or default to deployer
  const creForwarder = process.env.CRE_FORWARDER_ADDRESS || deployer.address;
  console.log(`CRE Forwarder    : ${creForwarder}`);

  const RiskRegistryFactory = await ethers.getContractFactory("RiskRegistry");
  const riskRegistry = await RiskRegistryFactory.deploy(creForwarder);
  await riskRegistry.waitForDeployment();

  const contractAddress = await riskRegistry.getAddress();
  const deploymentTx = riskRegistry.deploymentTransaction();
  const receipt = await deploymentTx?.wait();

  console.log(`\n[+] RiskRegistry deployed successfully!`);
  console.log(`    Contract Address : ${contractAddress}`);
  console.log(`    Transaction Hash : ${deploymentTx?.hash}`);
  console.log(`    Block Number     : ${receipt?.blockNumber}`);

  // Create deployments directory and save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const abiDir = path.join(__dirname, "../abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  // Get Artifact
  const artifact = await ethers.getContractFactory("RiskRegistry");
  const artifactData = {
    contractName: "RiskRegistry",
    address: contractAddress,
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    creForwarder: creForwarder,
    deployedAtBlock: receipt?.blockNumber,
    deployedAtTimestamp: new Date().toISOString(),
    transactionHash: deploymentTx?.hash,
    abi: (artifact.interface as any).formatJson ? JSON.parse((artifact.interface as any).formatJson()) : artifact.interface.fragments,
  };

  // Write deployments info
  const deploymentFilePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFilePath, JSON.stringify(artifactData, null, 2));
  console.log(`[+] Deployment record written to: ${deploymentFilePath}`);

  // Also write global deployments.json
  const globalDeploymentsPath = path.join(deploymentsDir, `deployments.json`);
  let globalDeployments: Record<string, any> = {};
  if (fs.existsSync(globalDeploymentsPath)) {
    try {
      globalDeployments = JSON.parse(fs.readFileSync(globalDeploymentsPath, "utf-8"));
    } catch {
      globalDeployments = {};
    }
  }
  globalDeployments[network.name] = {
    address: contractAddress,
    creForwarder: creForwarder,
    chainId: network.config.chainId,
    blockNumber: receipt?.blockNumber,
  };
  fs.writeFileSync(globalDeploymentsPath, JSON.stringify(globalDeployments, null, 2));

  // Write clean ABI file
  const abiFilePath = path.join(abiDir, `RiskRegistry.json`);
  fs.writeFileSync(
    abiFilePath,
    JSON.stringify(
      {
        contractName: "RiskRegistry",
        abi: artifactData.abi,
      },
      null,
      2
    )
  );
  console.log(`[+] Contract ABI written to: ${abiFilePath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
