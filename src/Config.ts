import Common from "ethereumjs-common";

export class Config {

  public readonly RINKEBY_CHAIN = Common.forCustomChain(
    'mainnet', {
      name: 'rinkeby',
      networkId: 4,
      chainId: 4
    },
    'petersburg'
  );

  public readonly MATIC_CHAIN = Common.forCustomChain(
    'mainnet', {
      name: 'matic',
      networkId: 137,
      chainId: 137
    },
    'petersburg'
  );

  public readonly FANTOM_CHAIN = Common.forCustomChain(
    'mainnet', {
      name: 'fantom',
      networkId: 250,
      chainId: 250
    },
    'petersburg'
  );

  rpcUrl: string;
  privateKey: string;
  networkScanApiKey: string;
  chain: Common;
  net: string;
  userActionDiscord: string;
  strategyEarnedDiscord: string;
  timeLocksDiscord: string;
  importantMessageDiscord: string;


  constructor() {


    this.privateKey = process.env.SIGNER_KEY as string;
    this.net = process.env.NET as string;

    if (this.net === 'rinkeby') {
      this.chain = this.RINKEBY_CHAIN;
      this.rpcUrl = process.env.RINKEBY_URL as string;
      this.networkScanApiKey = '';
      this.userActionDiscord = '';
      this.strategyEarnedDiscord = '';
      this.timeLocksDiscord = '';
      this.importantMessageDiscord = '';
    } else if (this.net === 'matic') {
      this.chain = this.MATIC_CHAIN;
      this.rpcUrl = process.env.MATIC_URL as string;
      this.networkScanApiKey = process.env.POLYGONSCAN_API_KEY as string;
      this.userActionDiscord = process.env.MATIC_USER_ACTION_DISCORD as string;
      this.strategyEarnedDiscord = process.env.MATIC_STRATEGY_EARNED_DISCORD as string;
      this.timeLocksDiscord = process.env.MATIC_TIME_LOCKS_DISCORD as string;
      this.importantMessageDiscord = process.env.MATIC_IMPORTANT_MESSAGE_DISCORD as string;
    } else if (this.net === 'fantom') {
      this.chain = this.FANTOM_CHAIN;
      this.rpcUrl = process.env.FANTOM_URL as string;
      this.networkScanApiKey = process.env.FTMSCAN_API_KEY as string;
      this.userActionDiscord = process.env.FANTOM_USER_ACTION_DISCORD as string;
      this.strategyEarnedDiscord = process.env.FANTOM_STRATEGY_EARNED_DISCORD as string;
      this.timeLocksDiscord = process.env.FANTOM_TIME_LOCKS_DISCORD as string;
      this.importantMessageDiscord = process.env.FANTOM_IMPORTANT_MESSAGE_DISCORD as string;
    } else {
      throw Error('Unknown network ' + this.net);
    }
  }
}
