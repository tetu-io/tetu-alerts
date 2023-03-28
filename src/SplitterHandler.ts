import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { Logger } from "tslog";
import logSettings from "../log_settings";
import { ethers } from "ethers";
import { SmartVault__factory, Splitter, Splitter__factory, Strategy__factory } from "../types/ethers-contracts";
import { Config } from "./Config";
import { DiscordSender } from "./DiscordSender";

const log: Logger = new Logger(logSettings);


export class SplitterHandler {

  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly config: Config;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.config = new Config();
  }


  async handleStrategyAdded(
    subStrategyAddress: string,
    receipt: TransactionReceipt
  ) {
    try {
      if (!receipt?.status) {
        log.error('handleStrategyAdded wrong status', receipt?.transactionHash);
        return false;
      }
      const strategy = receipt.to;
      const strategyContract = Splitter__factory.connect(strategy, this.provider);
      const vault = await strategyContract.vault()
      const vaultContract = SmartVault__factory.connect(vault, this.provider);

      const vaultName = await vaultContract.name();
      const subStrategy = Strategy__factory.connect(subStrategyAddress, this.provider);
      const subStrategyName = await subStrategy.STRATEGY_NAME();

      log.info(`STRATEGY ADDED: ${subStrategy} to vault ${vault}` )

      const title = `${vaultName} added new sub strategy on ${this.config.net}`
      const name = `Strategy type: ${subStrategyName}`;
      const message = `Strategy name: ${subStrategyAddress}`;

      await DiscordSender.sendImportantMessage(
        receipt?.transactionHash,
        title,
        name,
        message
      );
      return true;
    } catch (e) {
      log.error('Error during handleStrategyAdded', e);
      return false;
    }
  }

  async handleStrategyRemoved(
    subStrategyAddress: string,
    receipt: TransactionReceipt
  ) {
    try {
      if (!receipt?.status) {
        log.error('handleStrategyRemoved wrong status', receipt?.transactionHash);
        return false;
      }
      const strategy = receipt.to;
      const strategyContract = Splitter__factory.connect(strategy, this.provider);
      const vault = await strategyContract.vault()
      const vaultContract = SmartVault__factory.connect(vault, this.provider);

      const vaultName = await vaultContract.name();
      const subStrategy = Strategy__factory.connect(subStrategyAddress, this.provider);
      const subStrategyName = await subStrategy.STRATEGY_NAME();

      log.info(`STRATEGY REMOVED: ${subStrategy} to vault ${vault}` )

      const title = `${vaultName} removed sub strategy on ${this.config.net}`
      const name = `Strategy type: ${subStrategyName}`;
      const message = `Strategy name: ${subStrategyAddress}`;

      await DiscordSender.sendImportantMessage(
        receipt?.transactionHash,
        title,
        name,
        message
      );
      return true;
    } catch (e) {
      log.error('Error during handleStrategyRemoved', e);
      return false;
    }
  }
}