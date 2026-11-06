import { expect } from "chai";
import { ethers } from "hardhat";
import { RiskRegistry, MockTargetProtocol } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RiskRegistry & CRE Hooks", () => {
  let riskRegistry: RiskRegistry;
  let mockProtocol: MockTargetProtocol;
  let owner: HardhatEthersSigner;
  let forwarder: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;
  let newForwarder: HardhatEthersSigner;

  const PROTOCOL_ID = "aave-v3-mainnet";
  const COMPOSITE_SCORE = 1030; // 10.30
  const RISK_TIER = "LOW";
  const SNAPSHOT_ID = "aave-v3-mainnet-21100000";
  const BLOCK_NUMBER = 21100000;

  beforeEach(async () => {
    [owner, forwarder, unauthorized, newForwarder] = await ethers.getSigners();

    const RiskRegistryFactory = await ethers.getContractFactory("RiskRegistry");
    riskRegistry = (await RiskRegistryFactory.deploy(forwarder.address)) as RiskRegistry;
    await riskRegistry.waitForDeployment();

    const MockProtocolFactory = await ethers.getContractFactory("MockTargetProtocol");
    mockProtocol = (await MockProtocolFactory.deploy(
      "0x5FAab9E1adbddaD0a08734BE8a52185Fd6558E14",
      "0xEE56e2B3D491590B5b31738cC34d5232F378a8D5"
    )) as MockTargetProtocol;
    await mockProtocol.waitForDeployment();
  });

  describe("Deployment & Initialization", () => {
    it("should set deployer as owner", async () => {
      expect(await riskRegistry.owner()).to.equal(owner.address);
    });

    it("should configure correct creForwarder address", async () => {
      expect(await riskRegistry.creForwarder()).to.equal(forwarder.address);
    });

    it("should default creForwarder to deployer if address(0) is passed", async () => {
      const RiskRegistryFactory = await ethers.getContractFactory("RiskRegistry");
      const defaultRegistry = await RiskRegistryFactory.deploy(ethers.ZeroAddress);
      await defaultRegistry.waitForDeployment();

      expect(await defaultRegistry.creForwarder()).to.equal(owner.address);
    });
  });

  describe("reportRisk Authorization and Functionality", () => {
    it("allows authorized CRE forwarder to report risk", async () => {
      const tx = await riskRegistry.connect(forwarder).reportRisk(
        PROTOCOL_ID,
        COMPOSITE_SCORE,
        RISK_TIER,
        SNAPSHOT_ID,
        BLOCK_NUMBER
      );

      await expect(tx)
        .to.emit(riskRegistry, "RiskReported")
        .withArgs(PROTOCOL_ID, COMPOSITE_SCORE, RISK_TIER, SNAPSHOT_ID, BLOCK_NUMBER);

      const report = await riskRegistry.getRisk(PROTOCOL_ID);
      expect(report.compositeScore).to.equal(COMPOSITE_SCORE);
      expect(report.riskTier).to.equal(RISK_TIER);
      expect(report.snapshotId).to.equal(SNAPSHOT_ID);
      expect(report.blockNumber).to.equal(BLOCK_NUMBER);
      expect(report.reportedAt).to.be.gt(0);
    });

    it("reverts when unauthorized caller tries to report risk", async () => {
      await expect(
        riskRegistry.connect(unauthorized).reportRisk(
          PROTOCOL_ID,
          COMPOSITE_SCORE,
          RISK_TIER,
          SNAPSHOT_ID,
          BLOCK_NUMBER
        )
      ).to.be.revertedWithCustomError(riskRegistry, "UnauthorizedForwarder");
    });

    it("allows overwriting reports with updated evaluations", async () => {
      await riskRegistry.connect(forwarder).reportRisk(
        PROTOCOL_ID,
        COMPOSITE_SCORE,
        RISK_TIER,
        SNAPSHOT_ID,
        BLOCK_NUMBER
      );

      const NEW_SCORE = 1850;
      const NEW_TIER = "MEDIUM";
      const NEW_SNAPSHOT = "aave-v3-mainnet-21107200";
      const NEW_BLOCK = 21107200;

      await riskRegistry.connect(forwarder).reportRisk(
        PROTOCOL_ID,
        NEW_SCORE,
        NEW_TIER,
        NEW_SNAPSHOT,
        NEW_BLOCK
      );

      const updated = await riskRegistry.getRisk(PROTOCOL_ID);
      expect(updated.compositeScore).to.equal(NEW_SCORE);
      expect(updated.riskTier).to.equal(NEW_TIER);
      expect(updated.snapshotId).to.equal(NEW_SNAPSHOT);
      expect(updated.blockNumber).to.equal(NEW_BLOCK);
    });

    it("supports multiple protocols independently", async () => {
      await riskRegistry.connect(forwarder).reportRisk(
        "aave-v3-mainnet",
        1030,
        "LOW",
        "aave-snap-1",
        100
      );

      await riskRegistry.connect(forwarder).reportRisk(
        "uniswap-v3-mainnet",
        2450,
        "LOW",
        "uni-snap-1",
        100
      );

      const aaveReport = await riskRegistry.getRisk("aave-v3-mainnet");
      const uniReport = await riskRegistry.getRisk("uniswap-v3-mainnet");

      expect(aaveReport.compositeScore).to.equal(1030);
      expect(uniReport.compositeScore).to.equal(2450);
    });
  });

  describe("Administrative Controls", () => {
    it("owner can update creForwarder", async () => {
      const tx = await riskRegistry.connect(owner).setCreForwarder(newForwarder.address);

      await expect(tx)
        .to.emit(riskRegistry, "ForwarderUpdated")
        .withArgs(forwarder.address, newForwarder.address);

      expect(await riskRegistry.creForwarder()).to.equal(newForwarder.address);

      // Previous forwarder should now be rejected
      await expect(
        riskRegistry.connect(forwarder).reportRisk(
          PROTOCOL_ID,
          COMPOSITE_SCORE,
          RISK_TIER,
          SNAPSHOT_ID,
          BLOCK_NUMBER
        )
      ).to.be.revertedWithCustomError(riskRegistry, "UnauthorizedForwarder");

      // New forwarder can report
      await expect(
        riskRegistry.connect(newForwarder).reportRisk(
          PROTOCOL_ID,
          COMPOSITE_SCORE,
          RISK_TIER,
          SNAPSHOT_ID,
          BLOCK_NUMBER
        )
      ).to.emit(riskRegistry, "RiskReported");
    });

    it("non-owner cannot update creForwarder", async () => {
      await expect(
        riskRegistry.connect(unauthorized).setCreForwarder(newForwarder.address)
      ).to.be.revertedWithCustomError(riskRegistry, "UnauthorizedOwner");
    });

    it("cannot set creForwarder to address(0)", async () => {
      await expect(
        riskRegistry.connect(owner).setCreForwarder(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(riskRegistry, "InvalidAddress");
    });

    it("owner can transfer ownership", async () => {
      const tx = await riskRegistry.connect(owner).transferOwnership(unauthorized.address);

      await expect(tx)
        .to.emit(riskRegistry, "OwnershipTransferred")
        .withArgs(owner.address, unauthorized.address);

      expect(await riskRegistry.owner()).to.equal(unauthorized.address);
    });
  });

  describe("MockTargetProtocol Events (CRE Log Trigger source)", () => {
    it("emits Upgraded event on implementation upgrade", async () => {
      const newImpl = "0x7777777777777777777777777777777777777777";
      await expect(mockProtocol.upgradeTo(newImpl))
        .to.emit(mockProtocol, "Upgraded")
        .withArgs(newImpl);
    });

    it("emits AdminChanged event on admin change", async () => {
      const newAdmin = "0x8888888888888888888888888888888888888888";
      await expect(mockProtocol.changeAdmin(newAdmin))
        .to.emit(mockProtocol, "AdminChanged")
        .withArgs("0xEE56e2B3D491590B5b31738cC34d5232F378a8D5", newAdmin);
    });
  });
});
