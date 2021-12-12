import axios, {AxiosResponse} from "axios";
import {Config} from "./Config";
import Web3 from 'web3';
import {ethers, utils} from "ethers";
import Common from "ethereumjs-common";
import {Utils} from "./Utils";

const EthereumTx = require('ethereumjs-tx').Transaction;

const MATIC_CHAIN = Common.forCustomChain(
  'mainnet', {
    name: 'matic',
    networkId: 137,
    chainId: 137
  },
  'petersburg'
);

export class SpeedUp {


  public static async speedUp(txHash: string, provider: ethers.providers.JsonRpcProvider, addNonce = 0): Promise<string> {
    console.log('SPEEDUP', txHash, addNonce)
    const config = new Config();

    const web3 = new Web3(new Web3.providers.HttpProvider(config.rpcUrl, {
      keepAlive: true,
      timeout: 120000, // ms
    }));

    let response: AxiosResponse;
    try {
      response = await axios.post(config.rpcUrl,
        `{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["${txHash}"],"id":1}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        },
      );
    } catch (e) {
      console.error('error request', e);
      return 'error';
    }
    const result = response.data.result;
    // console.log('response', txHash, result);
    if (!result) {
      return 'error';
    }

    const nonce = Web3.utils.hexToNumber(result.nonce) + addNonce;
    // console.log('nonce', nonce);

    const gasPrice = Math.max(+(await provider.getGasPrice()).toString(), 30_000_000_000);
    const gasPriceAdjusted = Math.max(+Web3.utils.toBN(gasPrice.toString()).mul(Web3.utils.toBN(3)).toString(), 60_000_000_000);

    console.log('gas', utils.formatUnits(gasPrice.toString(), 9), utils.formatUnits(gasPriceAdjusted, 9));

    const tx = new EthereumTx(
      {
        nonce: Web3.utils.numberToHex(nonce),
        to: result.to,
        data: result.input,
        gasPrice: Web3.utils.numberToHex(gasPriceAdjusted),
        // gasLimit: Web3.utils.numberToHex(19_000_000),
      },
      {common: MATIC_CHAIN});


    tx.sign(Buffer.from(config.privateKey, 'hex'));

    const txRaw = '0x' + tx.serialize().toString('hex');

    let newHash = '';

    try {
      await web3.eth.sendSignedTransaction(txRaw, (err, res) => {
        console.log('SpeedUp tx result', err, res);
        newHash = res;
      });
    } catch (e) {
      console.log('speedup tx error', e);
    }

    while (newHash === '') {
      console.log('wait result')
      await Utils.delay(10000);
    }
    console.log('speed up result hash', newHash);
    return newHash;
  }

}
