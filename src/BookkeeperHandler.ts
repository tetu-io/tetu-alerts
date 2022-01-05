import {BigNumber, ethers, utils} from "ethers";
import {DiscordSender} from "./DiscordSender";
import {Utils} from "./Utils";
import {
  ContractReader,
  Controller__factory,
  SmartVault__factory,
  Strategy__factory
} from "../types/ethers-contracts";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {Logger} from "tslog";
import logSettings from "../log_settings";
import {Config} from "./Config";

const log: Logger = new Logger(logSettings);

const MIN_USER_ACTION_REPORT_VALUE = 1000;
const MIN_EARNED_REPORT_VALUE = 10;
const MAX_ERRORS = 5;

const NOT_VAULT = [
  '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase()
]

export class BookkeeperHandler {

  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly reader: ContractReader;
  private readonly config: Config;


  constructor(provider: ethers.providers.JsonRpcProvider, reader: ContractReader) {
    this.config = new Config();
    this.provider = provider;
    this.reader = reader;
  }

  async handleUserAction(
    user: string,
    amount: BigNumber,
    deposit: boolean,
    receipt: TransactionReceipt
  ) {
    let errorCount = 0;
    while (true) {
      try {
        if (!receipt?.status) {
          log.error('handleUserAction Wrong status', receipt.transactionHash)
          return {
            'deposit': deposit,
            'vaultNamePretty': 'WRONG STATUS',
            'usdValue': '0',
            'txHash': receipt.transactionHash
          }
        }
        const core = await Utils.getCoreAddresses(this.provider);
        const controller = Controller__factory.connect(core.controller, this.provider);
        let vaultAdr = receipt.to;
        const isVault = await controller.isValidVault(receipt.to)
        if (!isVault) {
          return {
            'deposit': deposit,
            'vaultNamePretty': 'NOT DIRECT CALL ON VAULT',
            'usdValue': '0',
            'txHash': receipt.transactionHash
          }
        }
        const vaultCtr = SmartVault__factory.connect(vaultAdr, this.provider);
        const vaultName = await vaultCtr.name();
        const dec = await vaultCtr.decimals();
        const underlying = await vaultCtr.underlying();
        const amountN = +utils.formatUnits(amount, dec);
        const price = +utils.formatUnits(await this.reader.getPrice(underlying));
        const vaultNamePretty = Utils.formatVaultName(vaultName);
        const usdValue = (amountN * price).toLocaleString('en-US', {maximumFractionDigits: 0});

        if (amountN * price < MIN_USER_ACTION_REPORT_VALUE) {
          return {
            'deposit': deposit,
            'vaultNamePretty': vaultNamePretty,
            'usdValue': usdValue,
            'txHash': receipt.transactionHash
          }
        }

        log.info('USER ACTION: ', vaultNamePretty, deposit, usdValue, receipt.transactionHash);

        await DiscordSender.sendUserAction(
          deposit,
          vaultNamePretty,
          usdValue,
          receipt.transactionHash,
          receipt.from,
          this.config.net
        );

        return {
          'deposit': deposit,
          'vaultNamePretty': vaultNamePretty,
          'usdValue': amountN * price,
          'txHash': receipt.transactionHash
        }
      } catch (e) {
        log.error('Error in handleUserAction', receipt.transactionHash, e);
        errorCount++;
        if (errorCount > MAX_ERRORS) {
          return {
            'deposit': deposit,
            'vaultNamePretty': 'MAX RETRY',
            'usdValue': '0',
            'txHash': ''
          }
        }
        await Utils.delay(10000);
      }
    }
  }

  async handleStrategyEarned(
    strategy: string,
    amount: BigNumber,
    receipt: TransactionReceipt
  ) {
    if (!receipt?.status) {
      log.error('handleStrategyEarned Wrong status', receipt.transactionHash)
      return;
    }
    const core = await Utils.getCoreAddresses(this.provider);

    const strategyCtr = Strategy__factory.connect(strategy, this.provider);
    const strategyName = await strategyCtr.STRATEGY_NAME();
    const vaultAdr = await strategyCtr.vault();
    const vaultCtr = SmartVault__factory.connect(vaultAdr, this.provider);
    const vaultName = await vaultCtr.name();
    const vaultNamePretty = Utils.formatVaultName(vaultName);
    const amountN = +utils.formatUnits(amount);
    const price = +utils.formatUnits(await this.reader.getPrice(core.rewardToken));
    const usdAmount = amountN * price;

    log.info('STRATEGY EARNED: ', vaultNamePretty, strategyName, amountN, usdAmount);

    if (usdAmount < MIN_EARNED_REPORT_VALUE) {
      return;
    }

    await DiscordSender.sendStrategyEarned(
      vaultNamePretty,
      strategyName,
      amountN.toLocaleString('en-US', {maximumFractionDigits: 0}),
      usdAmount.toLocaleString('en-US', {maximumFractionDigits: 0}),
      receipt.transactionHash,
      this.config.net
    );
  }
}
