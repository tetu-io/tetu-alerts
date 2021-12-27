import {ethers} from "ethers";
import {ContractReader} from "../types/ethers-contracts";
import {Logger} from "tslog";
import logSettings from "../log_settings";
import {Config} from "./Config";
import {DiscordSender} from "./DiscordSender";
import {Utils} from "./Utils";

const log: Logger = new Logger(logSettings);


export class ErrorTxHandler {

  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly reader: ContractReader;
  private readonly config: Config;


  constructor(provider: ethers.providers.JsonRpcProvider, reader: ContractReader) {
    this.config = new Config();
    this.provider = provider;
    this.reader = reader;
  }

  async handleBlock(block: string, listeningAddresses: Set<string>) {
    const blockData = await this.provider.getBlockWithTransactions(block)
    for (let tx of blockData.transactions) {
      await this.handleTx(tx, listeningAddresses);
    }
  }

  async handleTx(tx: ethers.providers.TransactionResponse, listeningAddresses: Set<string>) {
    if (
      (!tx.from || !listeningAddresses.has((tx.from as string)?.toLowerCase()))
      && (!tx.to || !listeningAddresses.has((tx.to as string)?.toLowerCase()))
    ) {
      return false;
    }

    let receipt;
    let reason = '';
    try {
      await tx.wait();
      return false;
    } catch (err) {
      console.log(err);
      // @ts-ignore
      receipt = err.receipt;
      // @ts-ignore
      reason = err.reason;
    }
    if (receipt.status === 1) {
      return false;
    }

    const contractName = await Utils.tryToGetContractName(tx.to as string);

    const title = `Error  on ${this.config.net}`;
    const name = `${contractName} error: ${reason}`;
    const message = `From ${Utils.txPrettifyWithLink(tx.from)} to ${Utils.txPrettifyWithLink(tx.to as string)}`;
    log.info('handleRatioChange', title, name, message);
    await DiscordSender.sendError(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }
}
