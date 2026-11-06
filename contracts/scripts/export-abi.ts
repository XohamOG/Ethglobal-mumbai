import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Exporting RiskRegistry ABI...");
  const factory = await ethers.getContractFactory("RiskRegistry");
  const abiDir = path.join(__dirname, "../abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const abi = (factory.interface as any).formatJson
    ? JSON.parse((factory.interface as any).formatJson())
    : factory.interface.fragments;

  const abiPath = path.join(abiDir, "RiskRegistry.json");
  fs.writeFileSync(
    abiPath,
    JSON.stringify(
      {
        contractName: "RiskRegistry",
        abi,
      },
      null,
      2
    )
  );

  console.log(`[+] Exported ABI to: ${abiPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
