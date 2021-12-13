import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {Config} from "../src/Config";
import {ethers} from "ethers";
import {Utils} from "../src/Utils";
import {Announcer__factory, ContractReader__factory} from "../types/ethers-contracts";
import {Constants} from "../src/Constants";
import {AnnouncerHandler} from "../src/AnnouncerHandler";
import {TransactionReceipt} from "@ethersproject/abstract-provider";

require('dotenv').config();
const {expect} = chai;
chai.use(chaiAsPromised);

describe("AnnounceHandlerTest", function () {
  let provider: ethers.providers.JsonRpcProvider;
  let announceHandler: AnnouncerHandler;

  before(async function () {
    const config = new Config();
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);
    announceHandler = new AnnouncerHandler(provider, ContractReader__factory.connect(tools.reader, provider));
  });


  it("handleAddressChange", async () => {
    const tx = '0xf9d1d639eeee6b07095b8d7fa1c95522506b4b2355b21b390c19a349607db069';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.ADDRESS_CHANGE_ANNOUNCE_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleAddressChange(logParsed.args.opCode, logParsed.args.newAddress, receipt);
    expect(success).is.eq(true);
  });

  it("handleTokenMove", async () => {
    const tx = '0xb0cb614f5bcce4e3d1ecbb6ef1b9f240ebcbfc9e6a95e993d337fe2e5e6cb4d8';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.TOKEN_MOVE_ANNOUNCED_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleTokenMove(
      logParsed.args.opCode,
      logParsed.args.target,
      logParsed.args.token,
      logParsed.args.amount,
      receipt
    );
    expect(success).is.eq(true);
  });

  it("handleProxyUpgrade", async () => {
    const tx = '0x6797c84cff989d8c6dada8bcd60228c107abd0f0dd8209ab4ae4a9059f146503';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.PROXY_UPGRADE_ANNOUNCED_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleProxyUpgrade(
      logParsed.args._contract,
      logParsed.args._implementation,
      receipt
    );
    expect(success).is.eq(true);
  });

  it("handleMint", async () => {
    const tx = '0xaeeaf2c4b9d7f67476316afc06abc4997ae19371e10d07a4bc84543c3ea85f7c';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.MINT_ANNOUNCED_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleMint(
      logParsed.args.totalAmount,
      logParsed.args._distributor,
      logParsed.args._otherNetworkFund,
      receipt
    );
    expect(success).is.eq(true);
  });

  it("handleClose", async () => {
    const tx = '0x273a8beb0c4d27c5e0d663bd8b285dcd3db0b77666d6534f4f2fa08cda934c7f';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.ANNOUNCE_CLOSED_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleClose(
      logParsed.args.opHash,
      receipt
    );
    expect(success).is.eq(true);
  });

  it("handleStrategyUpgrade", async () => {
    const tx = '0x613c36b5fcd418e59c5d97dc3870dd1ff76c2318087446fe7f00868c42ecfb88';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.STRATEGY_UPGRADE_ANNOUNCED_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleStrategyUpgrade(
      logParsed.args._contract,
      logParsed.args._implementation,
      receipt
    );
    expect(success).is.eq(true);
  });

  it("handleVaultStop", async () => {
    const tx = '0x4a8a7bc9b10d58a1c9a1bce57114ceff37c21271dc5b80200d9aac33f9008c70';
    const receipt = await provider.getTransactionReceipt(tx);
    let log = getLog(receipt, Constants.VAULT_STOP_HASH);
    const logParsed = Announcer__factory.createInterface().parseLog(log);
    const success = await announceHandler.handleVaultStop(
      logParsed.args._contract,
      receipt
    );
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
