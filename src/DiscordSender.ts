import {Config} from "./Config";
import axios from "axios";

const NAME = 'Tetu Parser';
const AVATAR = 'https://i.ibb.co/Gcv8DK8/61-Vu-N0-Xdh4-L.jpg';
const HEADERS = {
  "Content-type": 'application/json'
}

export class DiscordSender {

  public static async sendUserAction(
    deposit: boolean,
    vaultName: string,
    value: string,
    txHash: string,
    network: string,
  ) {
    const params = {
      username: NAME,
      avatar_url: AVATAR,
      embeds: [{
        title: (deposit ? ':money_mouth: Deposit' : ':pleading_face: Withdraw') + ' on ' + network,
        url: DiscordSender.networkScanUrl() + '/tx/' + txHash,
        color: deposit ? DiscordSender.hexToDecimal("#25a826") : DiscordSender.hexToDecimal("#b32424"),
        fields: [{
          name: vaultName,
          value: '$' + value,
          inline: true,
        }],
      }]
    }

    const url = new Config().userActionDiscord;
    const http = axios.create();
    await http.post(url, params, {headers: HEADERS});
  }

  public static async sendStrategyEarned(
    vaultNamePretty: string,
    strategyName: string,
    amountN: string,
    usdAmount: string,
    txHash: string,
    network: string,
  ) {
    const params = {
      username: NAME,
      avatar_url: AVATAR,
      embeds: [{
        title: `${DiscordSender.emojiEarnedOnAmount(+usdAmount)} ${vaultNamePretty} earned on ${network}`,
        url: DiscordSender.networkScanUrl() + '/tx/' + txHash,
        color: DiscordSender.hexToDecimal("#686868"),
        fields: [{
          name: `Strategy type: ${strategyName}`,
          value: `Earned ${amountN}TETU ($${usdAmount})`,
          inline: true,
        }],
      }]
    }

    const url = new Config().strategyEarnednDiscord;
    const http = axios.create();
    await http.post(url, params, {headers: HEADERS});
  }

  private static hexToDecimal(hex: string) {
    return parseInt(hex.replace("#", ""), 16)
  }

  private static networkScanUrl() {
    const net = new Config().net;
    switch (net) {
      case 'matic':
        return 'https://polygonscan.com';
      case 'fantom':
        return 'https://ftmscan.com';
    }
  }

  private static emojiEarnedOnAmount(n: number) {
    if (n < 10) {
      return ':smirk:';
    }
    if (n < 100) {
      return ':relaxed:';
    }
    return ':exploding_head:';
  }

  private static txHashPrettify(hash: string) {
    if (hash.length < 8) {
      return hash;
    }
    return hash.substr(0, 6) + '...' + hash.substr(hash.length - 5)
  }

}
