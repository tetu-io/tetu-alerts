import {Config} from "./Config";
import {ethers} from "ethers";
import {
  Announcer__factory,
  Bookkeeper__factory,
  ContractReader__factory
} from "../types/ethers-contracts";
import {Utils} from "./Utils";
import {AnnouncerHandler} from "./AnnouncerHandler";
import {BookkeeperHandler} from "./BookkeeperHandler";

require('dotenv').config();

export class Parser {

  public static async start() {
    console.log('------- START PARSER ----------');

    const config = new Config();
    console.log("Network", config.net);


    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);

    const bookkeeperHandler = new BookkeeperHandler(provider, ContractReader__factory.connect(tools.reader, provider));

    const announcer = Announcer__factory.connect(core.announcer, provider);
    const bookkeeper = Bookkeeper__factory.connect(core.bookkeeper, provider);


    // ************** BOOKKEEPER ***********************
    bookkeeper.on(bookkeeper.filters.RegisterUserAction(), async (user, amount, deposit, event) => {
      await bookkeeperHandler.handleUserAction(user, amount, deposit, await event.getTransactionReceipt());
    });
    bookkeeper.on(bookkeeper.filters.RegisterStrategyEarned(), async (strategy, amount, event) => {
      await bookkeeperHandler.handleStrategyEarned(strategy, amount, await event.getTransactionReceipt());
    });

    // ************** ANNOUNCER ***********************
    announcer.on(announcer.filters.AddressChangeAnnounce(), async (opCode, newAddress) => {
      await AnnouncerHandler.handleAddressChange(opCode, newAddress);
    });
    announcer.on(announcer.filters.UintChangeAnnounce(), async (opCode, newValue) => {
      await AnnouncerHandler.handleUintChange(opCode, newValue);
    });
    announcer.on(announcer.filters.RatioChangeAnnounced(), async (opCode, numerator, denominator) => {
      await AnnouncerHandler.handleRatioChange(opCode, numerator, denominator);
    });
    announcer.on(announcer.filters.TokenMoveAnnounced(), async (opCode, target, token, amount) => {
      await AnnouncerHandler.handleTokenMove(opCode, target, token, amount);
    });
    announcer.on(announcer.filters.ProxyUpgradeAnnounced(), async (contract, implementation) => {
      await AnnouncerHandler.handleProxyUpgrade(contract, implementation);
    });
    announcer.on(announcer.filters.MintAnnounced(), async (totalAmount, distributor, otherNetworkFund) => {
      await AnnouncerHandler.handleMint(totalAmount, distributor, otherNetworkFund);
    });
    announcer.on(announcer.filters.AnnounceClosed(), async (opHash) => {
      await AnnouncerHandler.handleClose(opHash);
    });
    announcer.on(announcer.filters.StrategyUpgradeAnnounced(), async (vault, strategy) => {
      await AnnouncerHandler.handleStrategyUpgrade(vault, strategy);
    });
    announcer.on(announcer.filters.VaultStop(), async (vault) => {
      await AnnouncerHandler.handleVaultStop(vault);
    });
  }

}
