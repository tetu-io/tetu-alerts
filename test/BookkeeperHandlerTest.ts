import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BookkeeperHandler} from "../src/BookkeeperHandler";
import {Config} from "../src/Config";
import {ethers, utils} from "ethers";
import {Utils} from "../src/Utils";
import {Bookkeeper__factory, ContractReader__factory} from "../types/ethers-contracts";
import {Constants} from "../src/Constants";

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
    await check('0x39a1a60d179063fc06a0bc10afe06c6fff7fb38ef6b42c8dd9b3198f6fa82da4', provider, bookkeeperHandler);
  });

  it("handleUserAction MATIC DEPOSIT test", async () => {
    await check('0xaab59e42962b77407f524ca791a8167d3c369591a566a7d246a8d46093bcbb85', provider, bookkeeperHandler);
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
