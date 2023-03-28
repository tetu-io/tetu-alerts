import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "ethers";
import { SplitterHandler } from "../src/SplitterHandler";
import { before } from "mocha";
import { Config } from "../src/Config";
import { Utils } from "../src/Utils";

require('dotenv').config();
const {expect} = chai;
chai.use(chaiAsPromised);


describe('SplitterHandlerTest', function () {
  let provider: ethers.providers.JsonRpcProvider;
  let splitterHandler: SplitterHandler;

  before(async function () {
    const config = new Config();
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);
    splitterHandler = new SplitterHandler(provider)
  })

  it('handleStrategyAdded', async () => {
    const tx = '0xf92f469f3b53a70fce0497a81a6786a915ee13f290e023f477fbe3ecc8e7cc87';
    const receipt = await provider.getTransactionReceipt(tx)
    const success = await splitterHandler.handleStrategyAdded('0x3c055f4a2b7234a4d807a29244403b5a44648a1f', receipt)
    expect(success).is.eq(true);
  })

  it('handleStrategyRemoved', async () => {
    const tx = '0xf92f469f3b53a70fce0497a81a6786a915ee13f290e023f477fbe3ecc8e7cc87';
    const receipt = await provider.getTransactionReceipt(tx)
    const success = await splitterHandler.handleStrategyRemoved('0x3c055f4a2b7234a4d807a29244403b5a44648a1f', receipt)
    expect(success).is.eq(true);
  })
})