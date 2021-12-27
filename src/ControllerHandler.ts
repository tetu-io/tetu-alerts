import {BigNumber, ethers, utils} from "ethers";
import {
  ContractReader,
  Erc20__factory,
  SmartVault__factory,
  Strategy__factory,
  TetuToken__factory
} from "../types/ethers-contracts";
import {Config} from "./Config";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {Utils} from "./Utils";
import {DiscordSender} from "./DiscordSender";
import {Logger} from "tslog";
import logSettings from "../log_settings";

const log: Logger = new Logger(logSettings);

export class ControllerHandler {
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly reader: ContractReader;
  private readonly config: Config;


  constructor(provider: ethers.providers.JsonRpcProvider, reader: ContractReader) {
    this.config = new Config();
    this.provider = provider;
    this.reader = reader;
  }


  async handleHardWorkerAdded(value: string, receipt: TransactionReceipt) {
    const title = `HardWorker added on ${this.config.net}`;
    const name = `New HardWorker!`;
    const message = `Address ${Utils.addressPrettifyWithLink(value)} was added as HardWorker
    Now this EOA/contract able to call some non critical functions such as doHardWork()`;
    log.info('handleHardWorkerAdded', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }


  async handleHardWorkerRemoved(value: string, receipt: TransactionReceipt) {
    const title = `HardWorker removed on ${this.config.net}`;
    const name = `HardWorker removed`;
    const message = `Address ${Utils.addressPrettifyWithLink(value)} was removed from HardWorkers`;
    log.info('handleHardWorkerRemoved', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleWhiteListStatusChanged(target: string, status: boolean, receipt: TransactionReceipt) {
    const title = `Address whitelist status changed on ${this.config.net}`;
    let name: string;
    let message: string;
    if (status) {
      name = `Added to WhiteList`;
      message = `Address ${Utils.addressPrettifyWithLink(target)} was added to whitelisted
      Now this contract is able to interact with Tetu vaults. No more privileges`;
    } else {
      name = `Removed from WhiteList`;
      message = `Address ${Utils.addressPrettifyWithLink(target)} was removed from whitelisted`;
    }
    log.info('handleWhiteListStatusChanged', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleVaultAndStrategyAdded(vault: string, strategy: string, receipt: TransactionReceipt) {
    const vaultName = Utils.formatVaultName(await SmartVault__factory.connect(vault, this.provider).name());
    const strategyName = await this.getStrategyName(strategy);
    const title = `Vault with Strategy registered on ${this.config.net}`;
    const name = `New Vault ${vaultName} with strategy ${strategyName}`;
    const message = `New Vault ${Utils.addressPrettifyWithLink(vault, vaultName)} v${await Utils.tryToGetVersion(vault, this.provider)}
     with Strategy ${Utils.addressPrettifyWithLink(strategy, strategyName)} 
     v${await Utils.tryToGetVersion(strategy, this.provider)} was registered`;
    log.info('handleVaultAndStrategyAdded', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleControllerTokenMoved(recipient: string, token: string, amount: BigNumber, receipt: TransactionReceipt) {
    const tokenName = await Erc20__factory.connect(token, this.provider).symbol();
    const dec = await Erc20__factory.connect(token, this.provider).decimals();
    const title = `Tokens was transferred from Controller on ${this.config.net}`;
    const name = `Controller token moved`;
    const message = `${Utils.addressPrettifyWithLink(token, tokenName)} ${parseFloat(utils.formatUnits(amount, dec)).toLocaleString('en-US', {maximumFractionDigits: 0})} was transferred to ${Utils.addressPrettifyWithLink(recipient)}`;
    log.info('handleControllerTokenMoved', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleStrategyTokenMoved(strategy: string, token: string, amount: BigNumber, receipt: TransactionReceipt) {
    const tokenName = await Erc20__factory.connect(token, this.provider).symbol();
    const dec = await Erc20__factory.connect(token, this.provider).decimals();
    const title = `Tokens was transferred from Strategy on ${this.config.net}`;
    const name = `Strategy token moved`;
    const message = `${Utils.addressPrettifyWithLink(token, tokenName)} ${parseFloat(utils.formatUnits(amount, dec)).toLocaleString('en-US', {maximumFractionDigits: 0})} was transferred from ${Utils.addressPrettifyWithLink(strategy)}`;
    log.info('handleStrategyTokenMoved', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleFundKeeperTokenMoved(fund: string, token: string, amount: BigNumber, receipt: TransactionReceipt) {
    const tokenName = await Erc20__factory.connect(token, this.provider).symbol();
    const dec = await Erc20__factory.connect(token, this.provider).decimals();
    const title = `Tokens was transferred from FundKeeper on ${this.config.net}`;
    const name = `${tokenName} ${parseFloat(utils.formatUnits(amount, dec)).toLocaleString('en-US', {maximumFractionDigits: 0})} was transferred from ${Utils.addressPrettifyWithLink(fund)}`;
    const message = ``;
    log.info('handleFundKeeperTokenMoved', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleUpdatedAddressSlot(_nameHash: string, oldValue: string, newValue: string, receipt: TransactionReceipt) {
    const title = `Controller Address variable was updated on ${this.config.net}`;
    const name = `Address updated`;
    const message = `${ControllerHandler.mapNameHashToName(_nameHash)} was updated from ${Utils.addressPrettifyWithLink(oldValue)} to ${Utils.addressPrettifyWithLink(newValue)}`;
    log.info('handleUpdatedAddressSlot', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleUpdatedUint256Slot(_nameHash: string, oldValue: BigNumber, newValue: BigNumber, receipt: TransactionReceipt) {
    const title = `Controller Number variable was updated on ${this.config.net}`;
    const name = `Uint value updated`;
    const message = `${ControllerHandler.mapNameHashToName(_nameHash)} was updated from ${oldValue.toString()} to ${newValue.toString()}`;
    log.info('handleUpdatedUint256Slot', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }


  async handleVaultStrategyChanged(vault: string, oldStrategy: string, newStrategy: string, receipt: TransactionReceipt) {
    const vaultName = Utils.formatVaultName(await SmartVault__factory.connect(vault, this.provider).name());
    const oldStrategyName = await this.getStrategyName(oldStrategy);
    const newStrategyName = await this.getStrategyName(newStrategy);
    const title = `Strategy changed on ${this.config.net}`;
    const name = `Vault ${vaultName} changed strategy to ${newStrategyName}`;
    const message = `Vault ${await Utils.txHashPrettifyWithLinkAndVersion(vault, this.provider, vaultName)}\n`
      + `Old strategy ${await Utils.txHashPrettifyWithLinkAndVersion(oldStrategy, this.provider, oldStrategyName)}\n`
      + `New strategy ${await Utils.txHashPrettifyWithLinkAndVersion(newStrategy, this.provider, newStrategyName)}\n`;
    log.info('handleVaultStrategyChanged', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleProxyUpgraded(target: string, oldLogic: string, newLogic: string, receipt: TransactionReceipt) {
    const pName = await Utils.tryToGetContractName(oldLogic);
    const title = `Proxy upgraded on ${this.config.net}`;
    const name = `${pName} Proxy contract was upgraded`;
    const message = `${pName} Proxy ${Utils.addressPrettifyWithLink(target)}\n`
      + `Old logic ${await Utils.txHashPrettifyWithLinkAndVersion(oldLogic, this.provider)}\n`
      + `New logic ${await Utils.txHashPrettifyWithLinkAndVersion(newLogic, this.provider)}`;
    log.info('handleProxyUpgraded', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  async handleMinted(
    mintHelper: string,
    totalAmount: BigNumber,
    distributor: string,
    otherNetworkFund: string,
    mintAllAvailable: boolean,
    receipt: TransactionReceipt
  ) {
    let amountN = +utils.formatUnits(totalAmount);
    let maxAvailable = false;
    if (amountN === 0) {
      const block = receipt.blockNumber - 1;
      maxAvailable = true;
      const core = await Utils.getCoreAddresses(this.provider);
      const supply = await TetuToken__factory.connect(core.rewardToken, this.provider).totalSupply({blockTag: block})
      const maxSupply = await TetuToken__factory.connect(core.rewardToken, this.provider).maxTotalSupplyForCurrentBlock({blockTag: block})
      const toMint = maxSupply.sub(supply);
      amountN = +utils.formatUnits(toMint);
    }
    const title = `TETU was minted on ${this.config.net}`;
    const name = `Minted ${amountN.toLocaleString('en-US', {maximumFractionDigits: 0})} ${maxAvailable ? '(max available) ' : ' '}TETU tokens`;
    let value = '';
    value += `To ${Utils.addressPrettifyWithLink(otherNetworkFund, 'FundKeeper')} ${(amountN * 0.67).toLocaleString('en-US', {maximumFractionDigits: 0})} (67%)\n`;
    value += `To ${Utils.addressPrettifyWithLink(distributor, 'Distributor')} ${(amountN * 0.231).toLocaleString('en-US', {maximumFractionDigits: 0})} (23.1%)\n`;
    value += `To DevFund ${(amountN * 0.099).toLocaleString('en-US', {maximumFractionDigits: 0})} (9.9%)\n`;

    log.info('handleMinted', title, name, value);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      value
    );
    return true;
  }

  async handleDistributorChanged(distributor: string, receipt: TransactionReceipt) {
    const title = `Distributor address was changed on ${this.config.net}`;
    const name = `Reward Distributor was changed`;
    const message = `${Utils.addressPrettifyWithLink(distributor, 'New distributor')}`;
    log.info('handleDistributorChanged', title, name, message);
    await DiscordSender.sendImportantMessage(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }

  // ********************************

  private static mapNameHashToName(hash: string) {
    if (hash === ControllerHandler.nameToHash('governance')) {
      return 'governance';
    } else if (hash === ControllerHandler.nameToHash('dao')) {
      return 'dao';
    } else if (hash === ControllerHandler.nameToHash('feeRewardForwarder')) {
      return 'feeRewardForwarder';
    } else if (hash === ControllerHandler.nameToHash('bookkeeper')) {
      return 'bookkeeper';
    } else if (hash === ControllerHandler.nameToHash('mintHelper')) {
      return 'mintHelper';
    } else if (hash === ControllerHandler.nameToHash('rewardToken')) {
      return 'rewardToken';
    } else if (hash === ControllerHandler.nameToHash('fundToken')) {
      return 'fundToken';
    } else if (hash === ControllerHandler.nameToHash('psVault')) {
      return 'psVault';
    } else if (hash === ControllerHandler.nameToHash('fund')) {
      return 'fund';
    } else if (hash === ControllerHandler.nameToHash('distributor')) {
      return 'distributor';
    } else if (hash === ControllerHandler.nameToHash('announcer')) {
      return 'announcer';
    } else if (hash === ControllerHandler.nameToHash('vaultController')) {
      return 'vaultController';
    } else if (hash === ControllerHandler.nameToHash('psNumerator')) {
      return 'psNumerator';
    } else if (hash === ControllerHandler.nameToHash('psDenominator')) {
      return 'psDenominator';
    } else if (hash === ControllerHandler.nameToHash('fundNumerator')) {
      return 'fundNumerator';
    } else if (hash === ControllerHandler.nameToHash('fundDenominator')) {
      return 'fundDenominator';
    }
    return hash;
  }

  private static nameToHash(name: string) {
    return utils.id(name);
  }

  private async getStrategyName(strategy: string) {
    try {
      return await Strategy__factory.connect(strategy, this.provider).STRATEGY_NAME()
    } catch (e) {
      return 'UNKNOWN_NAME';
    }
  }
}
