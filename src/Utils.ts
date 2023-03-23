import {ContractTransaction, ethers} from "ethers";
import {CoreAddresses} from "./addresses/CoreAddresses";
import {Addresses} from "./addresses/addresses";
import {ToolsAddresses} from "./addresses/ToolsAddresses";
import {SpeedUp} from "./SpeedUp";
import {Config} from "./Config";
import {SmartVault__factory, Splitter__factory} from "../types/ethers-contracts";
import axios from "axios";

let networkScanLastCall = 0;

export class Utils {

  public static SPLITTER_PREFIX = 'SPLITTER___';

  public static delay(ms: number) {
    if (ms === 0) {
      return;
    }
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async waitBlocks(provider: ethers.providers.JsonRpcProvider, blocks: number) {
    const start = provider.blockNumber;
    while (true) {
      console.log('wait 10sec');
      await Utils.delay(10000);
      if (provider.blockNumber >= start + blocks) {
        break;
      }
    }
  }

  public static async runAndWait(provider: ethers.providers.JsonRpcProvider, callback: () => Promise<ContractTransaction>, stopOnError = true, wait = true) {
    const tr = await callback();
    if (!wait) {
      return;
    }
    await Utils.waitBlocks(provider, 1);

    console.log('tx sent', tr.hash);
    const hash = await Utils.waitAndSpeedUp(provider, tr.hash);
    if (!hash || hash === 'error') {
      throw Error("Wrong hash! " + hash);
    }
    const receipt = await provider.getTransactionReceipt(hash);
    console.log('transaction result', hash, receipt?.status);
    if (receipt?.status !== 1 && stopOnError) {
      throw Error("Wrong status!");
    }
  }

  public static async waitAndSpeedUp(provider: ethers.providers.JsonRpcProvider, hash: string, speedUp = true, addNonce = 0): Promise<string> {
    console.log('waitAndSpeedUp', hash);
    let receipt;
    let count = 0;
    while (true) {
      receipt = await provider.getTransactionReceipt(hash);
      if (!!receipt) {
        break;
      }
      console.log('not yet complete', count, hash);
      await Utils.delay(10000);
      count++;
      if (count > 180 && speedUp) {
        const newHash = await SpeedUp.speedUp(hash, provider, addNonce);
        if (!newHash || newHash === 'error') {
          throw Error("Wrong speedup! " + hash);
        }
        return await Utils.waitAndSpeedUp(provider, newHash, true, addNonce + 1);
      }
    }
    return hash;
  }

  public static async getCoreAddresses(provider: ethers.providers.JsonRpcProvider): Promise<CoreAddresses> {
    const net = await provider.getNetwork();
    const core = Addresses.CORE.get(net.chainId + '');
    if (!core) {
      throw Error('No config for ' + net.chainId);
    }
    return core;
  }

  public static async getToolsAddresses(provider: ethers.providers.JsonRpcProvider): Promise<ToolsAddresses> {
    const net = await provider.getNetwork();
    const tools = Addresses.TOOLS.get(net.chainId + '');
    if (!tools) {
      throw Error('No config for ' + net.chainId);
    }
    return tools;
  }

  public static formatVaultName(name: string) {
    if (name.startsWith('TETU_SWAP_')) {
      return name;
    }
    if (name.startsWith('TETU_IRON_LOAN_')) {
      name = name.replace('TETU_IRON_LOAN_', '');
    }
    if (name.startsWith('TETU_AAVE_')) {
      name = name.replace('TETU_AAVE_', '');
    }
    if (name.startsWith('TETU_')) {
      name = name.replace('TETU_', '')
    }
    return name;
  }

  public static networkScanUrl() {
    const net = new Config().net;
    switch (net) {
      case 'matic':
        return 'https://polygonscan.com';
      case 'fantom':
        return 'https://ftmscan.com';
      case 'mainnet':
        return 'https://etherscan.com'
    }
  }

  public static networkScanUrlApi() {
    const net = new Config().net;
    switch (net) {
      case 'matic':
        return 'https://api.polygonscan.com/api';
      case 'fantom':
        return 'https://api.ftmscan.com/api';
      case 'mainnet' :
        return 'https://api.etherscan.io/api';
    }
  }

  public static abiScanUrl(contract: string) {
    const apiKey = new Config().networkScanApiKey;
    return Utils.networkScanUrlApi() + `?module=contract&action=getsourcecode&address=${contract}&apikey=${apiKey}`;
  }

  public static hashPrettify(hash: string) {
    if (!hash || hash.length < 8) {
      return hash;
    }
    return hash.substr(0, 5) + '...' + hash.substr(hash.length - 4)
  }

  public static addressPrettifyWithLink(hash: string, name?: string) {
    return `${name ? name + ' ' : ''}[${Utils.hashPrettify(hash)}](${Utils.networkScanUrl()}/address/${hash})`;
  }

  public static txPrettifyWithLink(hash: string, name?: string) {
    return `${name ? name + ' ' : ''}[${Utils.hashPrettify(hash)}](${Utils.networkScanUrl()}/tx/${hash})`;
  }

  public static async txHashPrettifyWithLinkAndVersion(hash: string, provider: ethers.providers.JsonRpcProvider, name?: string) {
    const v = await Utils.tryToGetVersion(hash, provider);
    return Utils.addressPrettifyWithLink(hash, name) + ` v${v}`;
  }

  public static async tryToGetVersion(contract: string, provider: ethers.providers.JsonRpcProvider) {
    try {
      const v = await SmartVault__factory.connect(contract, provider).VERSION()
      return v;
    } catch (e) {
    }
    return '0';
  }

  public static async tryToGetContractName(contract: string) {
    try {
      const now = new Date().getTime();
      if (now - networkScanLastCall < 10_000) {
        Utils.delay(1000);
      }
      const url = Utils.abiScanUrl(contract);
      const response = await axios.get(url);
      networkScanLastCall = now;
      return response.data.result[0].ContractName;
    } catch (e) {
    }
    return 'UNKNOWN_NAME';
  }

  public static tryToResolveName(adr: string) {
    const address = adr.toLowerCase();

    if(address === "0xcc16d636dD05b52FF1D8B9CE09B09BC62b11412B".toLowerCase() || address === "0x11d946C4Df8222940F9e7e6E56042Be2832B0871".toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'Governance msig');
    } else if(address === '0x424198579844b0d6f13c3a6B83b9Cf987af9C545'.toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'HardWorker#2');
    } else if(address === '0xADC31a85C01aeBA202Df01adc392a7c6b8D56916'.toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'HardWorker#3');
    } else if(address === '0x9880888C8768f4507bD5793E37470343dBBfF3B6'.toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'HardWorker#4');
    } else if(address === '0x75766Be51F932E738dee52f3A46c394589A36233'.toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'HardWorker#5');
    } else if(address === '0xb70CF120fb4461F77bbB189b125131e3D5234266'.toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'HardWorker#1');
    } else if(address === '0xbbbbb8C4364eC2ce52c59D2Ed3E56F307E529a94'.toLowerCase()) {
      return Utils.txPrettifyWithLink(adr, 'Tetu Deployer');
    }

    return Utils.txPrettifyWithLink(adr);
  }

  public static async vaultName(vaultOrSplitter: string, provider: ethers.providers.Provider): Promise<string> {
    try {
      return await SmartVault__factory.connect(vaultOrSplitter, provider).name()
    } catch (e) {
      //assume it is splitter
      const v = await Splitter__factory.connect(vaultOrSplitter, provider).vault();
      return Utils.SPLITTER_PREFIX + await Utils.vaultName(v, provider);
    }
  }
}
