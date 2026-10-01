import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";

const config = new Configuration();
const func = new Functions();
const cFile = "main_reward.json";

export default async function MainMenuReward(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel; if (!channel) return;
    const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/autoContent/27`), rewardId = data.fields?.mainMenuRewardedId?.stringValue, amount = data.fields?.mainMenuRewardedAmount?.integerValue, cUpdate = parseInt(data.fields?.mainMenuRewardedUpdateNumber?.integerValue || "0"); if (!rewardId) return;

    const lUpd = readCacheNumber(cFile); if (cUpdate <= lUpd) return;
    const packName = rewardId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const msg = `\`${amount}\`x ${packName} Pack\nOpen MADFUT to claim this!`;

    await channel.send(func.createEmbed(`Reward Update:`, msg, false));
    writeCacheNumber(cFile, cUpdate);
}