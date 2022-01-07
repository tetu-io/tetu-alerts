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
      // console.error(err);
      const transaction = await this.provider.call({
        gasPrice: tx.gasPrice,
        gasLimit: tx.gasLimit,
        value: tx.value,
        to: tx.to,
        from: tx.from,
        nonce: tx.nonce,
        data: tx.data,
        chainId: tx.chainId,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        maxFeePerGas: tx.maxFeePerGas,
      }, tx.blockNumber);
      reason = decodeMessage(transaction)
      // @ts-ignore
      receipt = err.receipt;
    }
    if (receipt.status === 1) {
      return false;
    }

    const contractName = await Utils.tryToGetContractName(tx.to as string);

    const title = `Error  on ${this.config.net}`;
    const name = `${contractName} error: ${reason}`;
    const message = `From ${Utils.tryToResolveName(tx.from)} to ${Utils.tryToResolveName(tx.to as string)}`;
    log.info('handleTx', title, name, message);
    await DiscordSender.sendError(
      receipt.transactionHash,
      title,
      name,
      message
    );
    return true;
  }
}

function decodeMessage(code: string) {
  let codeString
  const fnSelectorByteLength = 4
  const dataOffsetByteLength = 32
  const strLengthByteLength = 32
  const strLengthStartPos = 2 + ((fnSelectorByteLength + dataOffsetByteLength) * 2)
  const strDataStartPos = 2 + ((fnSelectorByteLength + dataOffsetByteLength + strLengthByteLength) * 2)
  codeString = `0x${code.substr(138)}`.replace(/0+$/, '')
  // If the codeString is an odd number of characters, add a trailing 0
  if (codeString.length % 2 === 1) {
    codeString += '0'
  }

  return ethers.utils.toUtf8String(codeString)

}
