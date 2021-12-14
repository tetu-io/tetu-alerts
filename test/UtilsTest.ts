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

describe("UtilsTest", function () {
  let provider: ethers.providers.JsonRpcProvider;
  let bookkeeperHandler: BookkeeperHandler;

  before(async function () {
    const config = new Config();
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);
    bookkeeperHandler = new BookkeeperHandler(provider, ContractReader__factory.connect(tools.reader, provider));
  });


  it("formatVaultName", async () => {
    expect(Utils.formatVaultName('TETU_SWAP_TETU_USDC')).is.eq('TETU_SWAP_TETU_USDC');
    expect(Utils.formatVaultName('TETU_IRON_TETU_USDC')).is.eq('IRON_TETU_USDC');
  });

});
