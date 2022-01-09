import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BookkeeperHandler} from "../src/BookkeeperHandler";
import {Config} from "../src/Config";
import {ethers} from "ethers";
import {Utils} from "../src/Utils";
import {Bookkeeper__factory, ContractReader__factory} from "../types/ethers-contracts";
import {Constants} from "../src/Constants";
import {TransactionReceipt} from "@ethersproject/abstract-provider";

require('dotenv').config();
const {expect} = chai;
chai.use(chaiAsPromised);

describe("BookkeeperHandlerTest", function () {
  let provider: ethers.providers.JsonRpcProvider;
  let bookkeeperHandler: BookkeeperHandler;

  before(async function () {
    const config = new Config();
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);
    bookkeeperHandler = new BookkeeperHandler(provider, ContractReader__factory.connect(tools.reader, provider));
  });


  it("handleUserAction MATIC WITHDRAW test", async () => {
    await check('0xf3c812428c0b5743b2092719812933195b1f3eb48569e67247e6a6bdb9f2019f', provider, bookkeeperHandler);
  });

  it("handleUserAction MATIC DEPOSIT test", async () => {
    await check('0x64726c79bf3b097fc32bbe38619e65b29756a4a870d858b4a0e5a1371ed0cfc7', provider, bookkeeperHandler);
  });

  it("handleUserAction KLIMA DEPOSIT test should not handle internal action", async () => {
    await check('0x56f6619b06d016f16fbdac830d8496db1cea78e3d947a59fa8a58a9b33765f81', provider, bookkeeperHandler, 2, false);
  });

  it("handleStrategyEarned", async () => {
    const hash = '0xf901c9322a9ad373fc0f8f0ffeb4acbdce92104fa256d377a1280d21e9a5d515';
    const receipt = await provider.getTransactionReceipt(hash);
    let log = getLog(receipt, Constants.REGISTER_STRATEGY_EARNED_HASH);
    const logParsed = Bookkeeper__factory.createInterface().parseLog(log);
    await bookkeeperHandler.handleStrategyEarned(
      logParsed.args.strategy,
      logParsed.args.amount,
      receipt
    );
  });

});


async function check(
  hash: string,
  provider: ethers.providers.JsonRpcProvider,
  bookkeeperHandler: BookkeeperHandler,
  logCount = 1,
  shouldPass = true) {
  const receipt = await provider.getTransactionReceipt(hash);
  let log = null;
  let count = 0;
  for (const l of receipt.logs) {
    if (l.topics[0].toLowerCase() === Constants.USER_ACTION_HASH) {
      log = l;
      count++;
      if(logCount === count) {
        break;
      }
    }
  }
  expect(log !== null).is.eq(true);
  if (!log) {
    return;
  }

  const parsedLog = Bookkeeper__factory.createInterface().parseLog(log);
  console.log('parsedLog.args.amount', parsedLog.args.amount.toString())
  const result = await bookkeeperHandler.handleUserAction(
    parsedLog.args.user,
    parsedLog.args.amount,
    parsedLog.args.deposit,
    receipt
  );
  if(shouldPass) {
    expect(+result.usdValue).is.greaterThan(0);
  } else {
    expect(+result.usdValue).is.eq(0);
  }
}

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
