import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {Config} from "../src/Config";
import {ethers} from "ethers";
import {Utils} from "../src/Utils";
import {ContractReader__factory, Controller__factory} from "../types/ethers-contracts";
import {Constants} from "../src/Constants";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {ControllerHandler} from "../src/ControllerHandler";

require('dotenv').config();
const {expect} = chai;
chai.use(chaiAsPromised);

describe("ControllerHandlerTest", function () {
  let provider: ethers.providers.JsonRpcProvider;
  let controllerHandler: ControllerHandler;

  before(async function () {
    const config = new Config();
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);
    controllerHandler = new ControllerHandler(provider, ContractReader__factory.connect(tools.reader, provider));
  });


  it("handleHardWorkerAdded", async () => {
    const tx = '0x8ea4628823e6fcaa7c6f78a0444002a91ea75de889e53af0ec5e6099fbe0543e';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.HARDWORKER_ADD_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    const success = await controllerHandler.handleHardWorkerAdded(logParsed.args.value, receipt);
    expect(success).is.eq(true);
  });

  it("handleVaultAndStrategyAdded", async () => {
    const tx = '0x787a0d47d74c1c28b376f78eed4225dd61a9376dfee8bd57fc80df7c2627e106';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.VAULT_AND_STRATEGY_ADDED_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    const success = await controllerHandler.handleVaultAndStrategyAdded(logParsed.args.vault, logParsed.args.strategy, receipt);
    expect(success).is.eq(true);
  });

  it("handleControllerTokenMoved", async () => {
    const tx = '0x401f9bbee8b8edcd845179b7f2f46fce00f28fcaafc62ecf04a4d4156232909f';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.CONTROLLER_TOKEN_MOVED_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    const success = await controllerHandler.handleControllerTokenMoved(logParsed.args.recipient, logParsed.args.token, logParsed.args.amount, receipt);
    expect(success).is.eq(true);
  });

  it("handleUpdatedAddressSlot", async () => {
    const tx = '0x1aef2308d74f21a7e0a02843257f6b137683ee2aa665b55ffa7f090e817928e3';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.UPDATED_ADDRESS_SLOT_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    console.log(logParsed)
    const success = await controllerHandler.handleUpdatedAddressSlot(logParsed.args[0].hash, logParsed.args[1], logParsed.args[2], receipt);
    expect(success).is.eq(true);
  });

  it("handleUpdatedUint256Slot", async () => {
    const tx = '0x402d883c9494f3c0a2734ffa3a3bf4cd8861c5a216d745b564d7d92b0ed65975';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.UPDATED_UINT_256_SLOT_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    console.log(logParsed)
    const success = await controllerHandler.handleUpdatedUint256Slot(logParsed.args[0].hash, logParsed.args[1], logParsed.args[2], receipt);
    expect(success).is.eq(true);
  });

  it("handleVaultStrategyChanged", async () => {
    const tx = '0x787a0d47d74c1c28b376f78eed4225dd61a9376dfee8bd57fc80df7c2627e106';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.VAULT_STRATEGY_CHANGED_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    console.log(logParsed)
    const success = await controllerHandler.handleVaultStrategyChanged(logParsed.args[0], logParsed.args[1], logParsed.args[2], receipt);
    expect(success).is.eq(true);
  });

  it("handleProxyUpgraded", async () => {
    const tx = '0x32ec4080e32a356f7b17bf0a2aaa3e72c188c4b6d8cfccb85f63a301af212089';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.PROXY_UPGRADED_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    console.log(logParsed)
    const success = await controllerHandler.handleProxyUpgraded(logParsed.args[0], logParsed.args[1], logParsed.args[2], receipt);
    expect(success).is.eq(true);
  });

  it("handleMinted", async () => {
    const tx = '0x4d10ce0ecc8b196aaf8c4e968ac6dc756e23984210fb97c5f7bf530bf16f6651';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.MINTED_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    console.log(logParsed)
    const success = await controllerHandler.handleMinted(logParsed.args[0], logParsed.args[1], logParsed.args[2], logParsed.args[3], logParsed.args[4], receipt);
    expect(success).is.eq(true);
  });

  it("handleDistributorChanged", async () => {
    const tx = '0x1aef2308d74f21a7e0a02843257f6b137683ee2aa665b55ffa7f090e817928e3';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.DISTRIBUTOR_CHANGED_HASH);
    const logParsed = Controller__factory.createInterface().parseLog(log);
    console.log(logParsed)
    const success = await controllerHandler.handleDistributorChanged(logParsed.args[0], receipt);
    expect(success).is.eq(true);
  });


});

function getLog(receipt: TransactionReceipt, hash: string) {
  let log = null;
  for (const l of receipt.logs) {
    if (l.topics[0].toLowerCase() === hash) {
      log = l;
      break;
    }
  }
  expect(log !== null).is.eq(true);
  if (log === null) {
    throw Error();
  }
  return log;
}
