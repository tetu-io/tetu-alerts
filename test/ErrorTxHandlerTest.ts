import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BookkeeperHandler} from "../src/BookkeeperHandler";
import {Config} from "../src/Config";
import {ethers} from "ethers";
import {Utils} from "../src/Utils";
import {Bookkeeper__factory, ContractReader__factory} from "../types/ethers-contracts";
import {Constants} from "../src/Constants";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {ErrorTxHandler} from "../src/ErrorTxHandler";

require('dotenv').config();
const {expect} = chai;
chai.use(chaiAsPromised);

describe("ErrorTxHandlerTest", function () {
  let provider: ethers.providers.JsonRpcProvider;
  let errorTxHandler: ErrorTxHandler;

  before(async function () {
    const config = new Config();
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);
    errorTxHandler = new ErrorTxHandler(provider, ContractReader__factory.connect(tools.reader, provider));
  });


  it("handleTx", async () => {
    const targets = new Set<string>(['0xf9ce0ccba91702f11f22613d9bbf8c90c5e3acee'.toLowerCase()]);
    const hash = '0x19fdf833929e2f5bb52705ecc55b6183068a992428705254a9c3b6b8a02fbd7a';
    const tx = await provider.getTransaction(hash);
    await errorTxHandler.handleTx(tx, targets);
  });

});


async function check(hash: string, provider: ethers.providers.JsonRpcProvider, bookkeeperHandler: BookkeeperHandler) {
  const receipt = await provider.getTransactionReceipt(hash);
  let log = null;
  for (const l of receipt.logs) {
    if (l.topics[0].toLowerCase() === Constants.USER_ACTION_HASH) {
      log = l;
      break;
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
  expect(+result.usdValue).is.greaterThan(0);
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
