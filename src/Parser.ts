import {Config} from "./Config";
import {ethers} from "ethers";
import {
  Announcer__factory,
  Bookkeeper__factory,
  ContractReader__factory,
  Controller__factory, Splitter__factory
} from "../types/ethers-contracts";
import {Utils} from "./Utils";
import {AnnouncerHandler} from "./AnnouncerHandler";
import {BookkeeperHandler} from "./BookkeeperHandler";
import {ControllerHandler} from "./ControllerHandler";
import {ErrorTxHandler} from "./ErrorTxHandler";
import { SplitterHandler } from "./SplitterHandler";

require('dotenv').config();

export class Parser {

  public static async start() {
    console.log('------- START PARSER ----------');

    const config = new Config();
    console.log("Network", config.net);

    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

    const core = await Utils.getCoreAddresses(provider);
    const tools = await Utils.getToolsAddresses(provider);

    const announceHandler = new AnnouncerHandler(provider, ContractReader__factory.connect(tools.reader, provider));
    const bookkeeperHandler = new BookkeeperHandler(provider, ContractReader__factory.connect(tools.reader, provider));
    const controllerHandler = new ControllerHandler(provider, ContractReader__factory.connect(tools.reader, provider));
    const errorTxHandler = new ErrorTxHandler(provider, ContractReader__factory.connect(tools.reader, provider));
    const splitterHandler = new SplitterHandler(provider);

    const controller = Controller__factory.connect(core.controller, provider);
    const announcer = Announcer__factory.connect(await controller.announcer(), provider);
    const bookkeeper = Bookkeeper__factory.connect(await controller.bookkeeper(), provider);
    const vaultController = Bookkeeper__factory.connect(await controller.vaultController(), provider);

    // ** transactions fails
    const listeningAddresses = new Set<string>([
      core.controller.toLowerCase(),
      announcer.address.toLowerCase(),
      (await controller.feeRewardForwarder()).toLowerCase(),
      bookkeeper.address.toLowerCase(),
      core.notifyHelper.toLowerCase(),
      (await controller.mintHelper()).toLowerCase(),
      (await controller.rewardToken()).toLowerCase(),
      (await controller.fund()).toLowerCase(),
      vaultController.address.toLowerCase(),
      core.pawnshop.toLowerCase(),
      core.swapFactory.toLowerCase(),
      core.swapRouter.toLowerCase(),
      core.rewardCalculator.toLowerCase(),
      core.autoRewarder.toLowerCase()
    ]);
    const vaultLength = (await bookkeeper.vaultsLength()).toNumber();
    for (let i = 0; i < vaultLength; i++) {
      listeningAddresses.add((await bookkeeper._vaults(i)).toLowerCase());
    }
    const strategiesAddress = (await bookkeeper.strategies());
    for (let i = 0; i < strategiesAddress.length; i++) {
      const strategySplitter = Splitter__factory.connect(strategiesAddress[i], provider);
      strategySplitter.on(strategySplitter.filters.StrategyAdded(), async (strategy, event) => {
        await splitterHandler.handleStrategyAdded(strategy, await event.getTransactionReceipt())
      });

      strategySplitter.on(strategySplitter.filters.StrategyRemoved(), async (strategy, event) => {
        await splitterHandler.handleStrategyRemoved(strategy, await event.getTransactionReceipt());
      })
    }

    provider.on('block', async (block: string) => {
      await errorTxHandler.handleBlock(block, listeningAddresses);
    });


    // ************** BOOKKEEPER ***********************
    bookkeeper.on(bookkeeper.filters.RegisterUserAction(), async (user, amount, deposit, event) => {
      await bookkeeperHandler.handleUserAction(user, amount, deposit, event.transactionHash);
    });
    bookkeeper.on(bookkeeper.filters.RegisterStrategyEarned(), async (strategy, amount, event) => {
      await bookkeeperHandler.handleStrategyEarned(strategy, amount, await event.getTransactionReceipt());
    });

    // ************** ANNOUNCER ***********************
    announcer.on(announcer.filters.AddressChangeAnnounce(), async (opCode, newAddress, event) => {
      await announceHandler.handleAddressChange(opCode, newAddress, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.UintChangeAnnounce(), async (opCode, newValue, event) => {
      await announceHandler.handleUintChange(opCode, newValue, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.RatioChangeAnnounced(), async (opCode, numerator, denominator, event) => {
      await announceHandler.handleRatioChange(opCode, numerator, denominator, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.TokenMoveAnnounced(), async (opCode, target, token, amount, event) => {
      await announceHandler.handleTokenMove(opCode, target, token, amount, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.ProxyUpgradeAnnounced(), async (contract, implementation, event) => {
      await announceHandler.handleProxyUpgrade(contract, implementation, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.MintAnnounced(), async (totalAmount, distributor, otherNetworkFund, event) => {
      await announceHandler.handleMint(totalAmount, distributor, otherNetworkFund, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.AnnounceClosed(), async (opHash, event) => {
      await announceHandler.handleClose(opHash, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.StrategyUpgradeAnnounced(), async (vault, strategy, event) => {
      await announceHandler.handleStrategyUpgrade(vault, strategy, await event.getTransactionReceipt());
    });
    announcer.on(announcer.filters.VaultStop(), async (vault, event) => {
      await announceHandler.handleVaultStop(vault, await event.getTransactionReceipt());
    });

    // ***************** controller
    controller.on(controller.filters.HardWorkerAdded(), async (value, event) => {
      await controllerHandler.handleHardWorkerAdded(value, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.HardWorkerRemoved(), async (value, event) => {
      await controllerHandler.handleHardWorkerRemoved(value, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.WhiteListStatusChanged(), async (target, status, event) => {
      await controllerHandler.handleWhiteListStatusChanged(target, status, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.VaultAndStrategyAdded(), async (vault, strategy, event) => {
      await controllerHandler.handleVaultAndStrategyAdded(vault, strategy, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.ControllerTokenMoved(), async (recipient, token, amount, event) => {
      await controllerHandler.handleControllerTokenMoved(recipient, token, amount, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.StrategyTokenMoved(), async (strategy, token, amount, event) => {
      await controllerHandler.handleStrategyTokenMoved(strategy, token, amount, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.FundKeeperTokenMoved(), async (fund, token, amount, event) => {
      await controllerHandler.handleFundKeeperTokenMoved(fund, token, amount, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.UpdatedAddressSlot(), async (name, oldValue, newValue, event) => {
      await controllerHandler.handleUpdatedAddressSlot(name, oldValue, newValue, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.UpdatedUint256Slot(), async (name, oldValue, newValue, event) => {
      await controllerHandler.handleUpdatedUint256Slot(name, oldValue, newValue, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.VaultStrategyChanged(), async (vault, oldStrategy, newStrategy, event) => {
      await controllerHandler.handleVaultStrategyChanged(vault, oldStrategy, newStrategy, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.ProxyUpgraded(), async (target, oldLogic, newLogic, event) => {
      await controllerHandler.handleProxyUpgraded(target, oldLogic, newLogic, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.Minted(), async (mintHelper, totalAmount, distributor, otherNetworkFund, mintAllAvailable, event) => {
      await controllerHandler.handleMinted(mintHelper, totalAmount, distributor, otherNetworkFund, mintAllAvailable, await event.getTransactionReceipt());
    });
    controller.on(controller.filters.DistributorChanged(), async (distributor, event) => {
      await controllerHandler.handleDistributorChanged(distributor, await event.getTransactionReceipt());
    });

    // ** vault controller todo

  }

}
