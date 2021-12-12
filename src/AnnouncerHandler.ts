import {BigNumber} from "ethers";

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
  [11, 'ControllerTokenMove'],
  [12, 'StrategyTokenMove'],
  [13, 'FundTokenMove'],
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

  public static async handleAddressChange(opCode: number, newAddress: string) {

  }

  static async handleUintChange(opCode: number, newValue: BigNumber) {

  }

  static async handleRatioChange(opCode: number, numerator: BigNumber, denominator: BigNumber) {

  }

  static async handleTokenMove(opCode: number, target: string, token: string, amount: BigNumber) {

  }

  static async handleProxyUpgrade(contract: string, implementation: string) {

  }

  static async handleMint(totalAmount: BigNumber, distributor: string, otherNetworkFund: string) {

  }

  static async handleClose(opHash: string) {

  }

  static async handleStrategyUpgrade(vault: string, strategy: string) {

  }

  static async handleVaultStop(vault: string) {

  }
}
