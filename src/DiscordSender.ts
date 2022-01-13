import {Config} from "./Config";
import axios from "axios";
import {Utils} from "./Utils";
import {Logger} from "tslog";
import logSettings from "../log_settings";

const NAME = 'Tetu Parser';
const AVATAR = 'https://i.ibb.co/Gcv8DK8/61-Vu-N0-Xdh4-L.jpg';
const HEADERS = {
  "Content-type": 'application/json'
}

const log: Logger = new Logger(logSettings);
const rateLimit = 300;

export class DiscordSender {

  private static lastSentMessageTs = 0;

  public static async sendUserAction(
    deposit: boolean,
    vaultName: string,
    value: string,
    txHash: string,
    sender: string,
    network: string,
  ) {
    const params = {
      username: NAME,
      avatar_url: AVATAR,
      embeds: [{
        title: (deposit ? ':money_mouth: Deposit' : ':pleading_face: Withdraw') + ' on ' + network,
        url: Utils.networkScanUrl() + '/tx/' + txHash,
        color: deposit ? DiscordSender.hexToDecimal("#25a826") : DiscordSender.hexToDecimal("#b32424"),
        fields: [{
          name: vaultName,
          value: `$${value} User: ${Utils.addressPrettifyWithLink(sender)}`,
          inline: true,
        }],
      }]
    }
    await DiscordSender.send(new Config().userActionDiscord, params);
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
        url: Utils.networkScanUrl() + '/tx/' + txHash,
        color: DiscordSender.hexToDecimal("#686868"),
        fields: [{
          name: `Strategy type: ${strategyName}`,
          value: `Earned ${amountN} TETU ($${usdAmount})`,
          inline: true,
        }],
      }]
    }
    await DiscordSender.send(new Config().strategyEarnedDiscord, params);
  }

  public static async sendAnnounces(
    txHash: string,
    titleText: string,
    name: string,
    message: string,
  ) {
    const params = {
      username: NAME,
      avatar_url: AVATAR,
      embeds: [{
        title: titleText,
        url: Utils.networkScanUrl() + '/tx/' + txHash,
        color: DiscordSender.hexToDecimal("#3a3f89"),
        fields: [{
          name: name,
          value: message,
          inline: true,
        }],
      }]
    }
    await DiscordSender.send(new Config().timeLocksDiscord, params);
  }

  public static async sendImportantMessage(
    txHash: string,
    titleText: string,
    name: string,
    message: string,
  ) {
    const params = {
      username: NAME,
      avatar_url: AVATAR,
      embeds: [{
        title: titleText,
        url: Utils.networkScanUrl() + '/tx/' + txHash,
        color: DiscordSender.hexToDecimal("#912595"),
        fields: [{
          name: name,
          value: message,
          inline: true,
        }],
      }]
    }
    await DiscordSender.send(new Config().importantMessageDiscord, params);
  }

  static async sendError(transactionHash: string, title: string, name: string, message: string) {
    const params = {
      username: NAME,
      avatar_url: AVATAR,
      embeds: [{
        title: title,
        url: Utils.networkScanUrl() + '/tx/' + transactionHash,
        color: DiscordSender.hexToDecimal("#ba031f"),
        fields: [{
          name: name,
          value: message,
          inline: true,
        }],
      }]
    }
    await DiscordSender.send(new Config().errorMessageDiscord, params);
  }

  // *******************************************

  private static async send(url: string, params: any) {
    if (url && url !== '') {
      if (DiscordSender.lastSentMessageTs + rateLimit > Date.now()) {
        console.log('rate limit reached with limit ms:', rateLimit);
        Utils.delay(rateLimit);
      }
      const http = axios.create();
      try {
        await http.post(url, params, {headers: HEADERS});
      } catch (e) {
        log.error('Error send POST request', url, params);
        throw e;
      }
      DiscordSender.lastSentMessageTs = Date.now();
    }
  }

  public static hexToDecimal(hex: string) {
    return parseInt(hex.replace("#", ""), 16)
  }

  private static emojiEarnedOnAmount(n: number) {
    if (n < 100) {
      return ':smirk:';
    }
    if (n < 1000) {
      return ':relaxed:';
    }
    return ':exploding_head:';
  }
}
