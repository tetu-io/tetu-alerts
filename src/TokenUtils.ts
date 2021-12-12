import {BigNumber, ethers} from "ethers";
import {Erc20__factory} from "../types/ethers-contracts";


export class TokenUtils {

  readonly provider: ethers.providers.JsonRpcProvider;


  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
  }

  public async balanceOf(tokenAddress: string, account: string): Promise<BigNumber> {
    const token = Erc20__factory.connect(tokenAddress, this.provider)
    return token.balanceOf(account);
  }

  public async totalSupply(tokenAddress: string): Promise<BigNumber> {
    const token = Erc20__factory.connect(tokenAddress, this.provider)
    return token.totalSupply();
  }

  public static async approve(tokenAddress: string, signer: ethers.Wallet, spender: string, amount: string) {
    const token = Erc20__factory.connect(tokenAddress, signer);
    return token.approve(spender, BigNumber.from(amount));
  }

  // public async approveNFT(tokenAddress: string, signer: ethers.Wallet, spender: string, id: string) {
  //   console.log('approve', await TokenUtils.tokenSymbol(tokenAddress), id);
  //   await TokenUtils.checkNftBalance(tokenAddress, signer.address, id);
  //   const token = await ethers.getContractAt("ERC721", tokenAddress, signer) as ERC721;
  //   return token.approve(spender, id);
  // }

  public static async allowance(tokenAddress: string, signer: ethers.Wallet, spender: string): Promise<BigNumber> {
    const token = Erc20__factory.connect(tokenAddress, signer);
    return token.allowance(signer.address, spender);
  }

  public static async transfer(tokenAddress: string, signer: ethers.Wallet, destination: string, amount: string) {
    const token = Erc20__factory.connect(tokenAddress, signer);
    return token.transfer(destination, BigNumber.from(amount))
  }

  // public async wrapMatic(signer: ethers.Wallet, amount: string) {
  //   const token = await ethers.getContractAt("IWmatic", MaticAddresses.WMATIC_TOKEN, signer) as IWmatic;
  //   return token.deposit({value: utils.parseUnits(amount, 18).toString()})
  // }

  public async decimals(tokenAddress: string): Promise<number> {
    const token = Erc20__factory.connect(tokenAddress, this.provider);
    return token.decimals();
  }

  public async tokenName(tokenAddress: string): Promise<string> {
    const token = Erc20__factory.connect(tokenAddress, this.provider);
    return token.name();
  }

  public async tokenSymbol(tokenAddress: string): Promise<string> {
    const token = Erc20__factory.connect(tokenAddress, this.provider);
    return token.symbol();
  }

  // public async tokenOfOwnerByIndex(tokenAddress: string, account: string, index: number) {
  //   const token = await ethers.getContractAt("IERC721Enumerable", tokenAddress) as IERC721Enumerable;
  //   return token.tokenOfOwnerByIndex(account, index);
  // }

}
