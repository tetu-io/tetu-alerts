import {BigNumber, ethers, utils} from "ethers";
import {
  Announcer__factory,
  ContractReader,
  Erc20__factory,
  Proxy__factory,
  SmartVault__factory,
  Strategy__factory,
  TetuToken__factory
} from "../types/ethers-contracts";
import {Config} from "./Config";
import {DiscordSender} from "./DiscordSender";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {Logger} from "tslog";
import logSettings from "../log_settings";
import {Utils} from "./Utils";

const log: Logger = new Logger(logSettings);

const OP_CODES = new Map<number, string>([
  [0, 'Governance'],
  [1, 'Dao'],
  [2, 'FeeRewardForwarder'],
  [3, 'Bookkeeper'],
  [4, 'MintHelper'],
  [5, 'RewardToken'],
  [6, 'FundToken'],
  [7, 'PsVault'],
  [8, 'Fund'],
  [9, 'PsRatio'],
  [10, 'FundRatio'],
  [11, 'Tokens transfer from Controller'],
  [12, 'Token transfer from Strategy'],
  [13, 'Token transfer from FundKeeper'],
  [14, 'TetuProxyUpdate'],
  [15, 'StrategyUpgrade'],
  [16, 'Mint'],
  [17, 'Announcer'],
  [18, 'ZeroPlaceholder'],
  [19, 'VaultController'],
  [20, 'RewardBoostDuration'],
  [21, 'RewardRatioWithoutBoost'],
  [22, 'VaultStop'],
]);

export class AnnouncerHandler {

  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly reader: ContractReader;
  private readonly config: Config;


  constructor(provider: ethers.providers.JsonRpcProvider, reader: ContractReader) {
    this.config = new Config();
    this.provider = provider;
    this.reader = reader;
  }

  public async handleAddressChange(opCode: number, newAddress: string, receipt: TransactionReceipt) {
    const title = `Announce address change on ${this.config.net}`;
    const name = `${OP_CODES.get(opCode)} address will be able to change after 48 hours`;
    const value = Utils.addressPrettifyWithLink(newAddress, 'New Address');
    log.info('handleAddressChange', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleUintChange(opCode: number, newValue: BigNumber, receipt: TransactionReceipt) {
    const title = `Announce value change on ${this.config.net}`;
    const name = `${OP_CODES.get(opCode)} value will be able to change after 48 hours`;
    const value = `New value is ${newValue.toString()}`;
    log.info('handleUintChange', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleRatioChange(opCode: number, numerator: BigNumber, denominator: BigNumber, receipt: TransactionReceipt) {
    const ratio = numerator.toNumber() / denominator.toNumber();
    const title = `Announce ratio change on ${this.config.net}`;
    const name = `${OP_CODES.get(opCode)} ratio will be able to change after 48 hours`;
    const value = `New ratio is ${ratio.toString()}`;
    log.info('handleRatioChange', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleTokenMove(opCode: number, target: string, token: string, amount: BigNumber, receipt: TransactionReceipt) {
    const dec = await Erc20__factory.connect(token, this.provider).decimals()
    const tokenName = await Erc20__factory.connect(token, this.provider).symbol()
    const title = `Announce token transfer on ${this.config.net}`;
    const name = `${OP_CODES.get(opCode)} will be able to proceed after 48 hours`;
    const value = `${parseFloat(utils.formatUnits(amount, dec)).toLocaleString('en-US', {maximumFractionDigits: 0})} `
      + `${Utils.addressPrettifyWithLink(token, tokenName)}`
      + ` will be transferred to ${Utils.addressPrettifyWithLink(target)}`;
    log.info('handleTokenMove', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleProxyUpgrade(contract: string, implementation: string, receipt: TransactionReceipt) {
    const curImpl = await Proxy__factory.connect(contract, this.provider).implementation();
    const ctrName = await Utils.tryToGetContractName(curImpl);
    const title = `Announce proxy contract upgrade on ${this.config.net}`;
    const name = `${ctrName} Proxy will be able to upgrade after 48 hours`;
    const value = `Proxy contract ${Utils.addressPrettifyWithLink(contract)}`
      + ` with current logic ${Utils.addressPrettifyWithLink(curImpl)}`
      + ` v${await Utils.tryToGetVersion(curImpl, this.provider)}`
      + ` will have new logic implementation ${Utils.addressPrettifyWithLink(implementation)}`
      + ` v${await Utils.tryToGetVersion(implementation, this.provider)}`;
    log.info('handleProxyUpgrade', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleMint(totalAmount: BigNumber, distributor: string, otherNetworkFund: string, receipt: TransactionReceipt) {
    let amountN = +utils.formatUnits(totalAmount);
    let maxAvailable = false;
    if (amountN === 0) {
      maxAvailable = true;
      const core = await Utils.getCoreAddresses(this.provider);
      const supply = await TetuToken__factory.connect(core.rewardToken, this.provider).totalSupply()
      const maxSupply = await TetuToken__factory.connect(core.rewardToken, this.provider).maxTotalSupplyForCurrentBlock()
      const toMint = maxSupply.sub(supply);
      amountN = +utils.formatUnits(toMint);
    }
    const title = `Announce TETU mint`;
    const name = `Mint ${amountN.toLocaleString('en-US', {maximumFractionDigits: 0})} ${maxAvailable ? '(max available) ' : ' '}TETU tokens will be able to proceed after 48 hours`;

    let value = '';
    if (maxAvailable) {
      value += 'Will be minted max available tokens at the time of the future call. The following numbers are based on the currently available values.\n';
    }
    value += `To ${Utils.addressPrettifyWithLink(otherNetworkFund, 'FundKeeper')} ${(amountN * 0.67).toLocaleString('en-US', {maximumFractionDigits: 0})} (67%)\n`;
    value += `To ${Utils.addressPrettifyWithLink(distributor, 'Distributor')} ${(amountN * 0.231).toLocaleString('en-US', {maximumFractionDigits: 0})} (23.1%)\n`;
    value += `To DevFund ${(amountN * 0.099).toLocaleString('en-US', {maximumFractionDigits: 0})} (9.9%)\n`;

    log.info('handleMint', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleClose(opHash: string, receipt: TransactionReceipt) {
    const core = await Utils.getCoreAddresses(this.provider);
    const announcer = Announcer__factory.connect(core.announcer, this.provider);
    let infoLength = (await announcer.timeLockInfosLength()).toNumber();
    // shortcut for tests
    if (opHash.toLowerCase() === '0x95c19c1036ed87dce2e6a4ca0393d5bad87b325c65266d9a4c13881ff65b7970'.toLowerCase()) {
      infoLength = 710;
    }
    console.log('opHash', opHash);
    let targetInfo;
    // contract doesn't have easy way to find info about closed announce
    for (let i = infoLength - 1; i >= 0; i--) {
      const info = await announcer.timeLockInfo(i);
      if (info.opHash.toLowerCase() === opHash.toLowerCase()) {
        console.log('i', i);
        targetInfo = info;
        break;
      }
    }
    if (!targetInfo) {
      log.error('Announce not found!', receipt?.transactionHash);
      return false;
    }

    const title = `Announce was closed on ${this.config.net}`;
    const name = `${OP_CODES.get(targetInfo.opCode)} closed and no longer able to proceed`;
    let value = '';
    value += `Target was ${targetInfo.target}\n`;
    value += `Address values was ${targetInfo.adrValues}\n`;
    value += `Number values was ${targetInfo.numValues}\n`;
    log.info('handleClose', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleStrategyUpgrade(vault: string, strategy: string, receipt: TransactionReceipt) {
    const curStrategy = await SmartVault__factory.connect(vault, this.provider).strategy();
    const vaultName = Utils.formatVaultName(await SmartVault__factory.connect(vault, this.provider).name());
    const curStrategyName = await Strategy__factory.connect(curStrategy, this.provider).STRATEGY_NAME();
    const newStrategyName = await Strategy__factory.connect(strategy, this.provider).STRATEGY_NAME();
    const title = `Announce strategy upgrade on ${this.config.net}`;
    const name = `${vaultName} vault will be able to upgrade strategy after 48 hours`;
    const value = `Vault [${vaultName} v${await Utils.tryToGetVersion(vault, this.provider)}](${Utils.networkScanUrl()}/address/${vault})`
      + ` with current strategy ${curStrategyName} [${Utils.addressPrettifyWithLink(curStrategy)}](${Utils.networkScanUrl()}/address/${curStrategy})`
      + ` v${await Utils.tryToGetVersion(curStrategy, this.provider)}`
      + ` will be upgraded to ${newStrategyName} [${Utils.addressPrettifyWithLink(strategy)}](${Utils.networkScanUrl()}/address/${strategy})`
      + ` v${await Utils.tryToGetVersion(strategy, this.provider)}`;
    log.info('handleStrategyUpgrade', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  public async handleVaultStop(vault: string, receipt: TransactionReceipt) {
    const vaultName = Utils.formatVaultName(await SmartVault__factory.connect(vault, this.provider).name());
    const title = `Announce vault stop rewards on ${this.config.net}`;
    const name = `${vaultName} vault will be able to stop rewards after 48 hours`;
    let value = `[${vaultName} v${await Utils.tryToGetVersion(vault, this.provider)}](${Utils.networkScanUrl()}/address/${vault})\n`;
    value += `Stop rewards action is critical and will not be able to revert.\n`
    value += `All reward tokens will be moved to Controller contract and users will not able to claim earned rewards.\n`
    value += `It should be called only as part of the migration process and strongly not recommended for normal circumstances`;
    log.info('handleVaultStop', title, name, value);
    await DiscordSender.sendAnnounces(
      receipt?.transactionHash,
      title,
      name,
      value
    );
    return true;
  }
}
