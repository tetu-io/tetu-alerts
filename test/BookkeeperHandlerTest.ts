import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BookkeeperHandler} from "../src/BookkeeperHandler";
import {Config} from "../src/Config";
import {BigNumber, ethers, utils} from "ethers";
import {Utils} from "../src/Utils";
import {ContractReader__factory} from "../types/ethers-contracts";

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
    const receipt = await provider.getTransactionReceipt('0xaab59e42962b77407f524ca791a8167d3c369591a566a7d246a8d46093bcbb85');
    const result = await bookkeeperHandler.handleUserAction(
      '0x4d37160dbce959292e1ca5d3415448688fe43444',
      utils.parseUnits('2000.102022', 6),
      false,
      receipt
    );
    expect(+result.usdValue).is.greaterThan(0);
  });

  it("handleUserAction MATIC DEPOSIT test", async () => {
    const receipt = await provider.getTransactionReceipt('0xaab59e42962b77407f524ca791a8167d3c369591a566a7d246a8d46093bcbb85');
    const result = await bookkeeperHandler.handleUserAction(
      '0x4d37160dbce959292e1ca5d3415448688fe43444',
      utils.parseUnits('2000.102022', 6),
      true,
      receipt
    );
    expect(+result.usdValue).is.greaterThan(0);
  });

});
