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
  it("handleTx2", async () => {
    const targets = new Set<string>(['0xbe527f95815f906625f29fc084bfd783f4d00787'.toLowerCase()]);
    const hash = '0xa12a46849d3847970cfb532c52db7aa8330c9129d5be544d6f4368775d6871ae';
    const tx = await provider.getTransaction(hash);
    await errorTxHandler.handleTx(tx, targets);
  });

  it("handleTx ftm", async () => {
    const config = new Config('fantom');
    const providerFtm = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const tools = await Utils.getToolsAddresses(providerFtm);
    const errorTxHandlerFtm = new ErrorTxHandler(providerFtm, ContractReader__factory.connect(tools.reader, providerFtm));
    const targets = new Set<string>(['0x63290e79760e441e9228c5308e8ff7de50843c20'.toLowerCase()]);
    const hash = '0x2e75169b0814bd1d28aee8fff293e7fa9afcf14dd7a742a028fbeae9fffe8f3c';
    const tx = await providerFtm.getTransaction(hash);
    await errorTxHandlerFtm.handleTx(tx, targets);
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
    receipt.transactionHash
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
