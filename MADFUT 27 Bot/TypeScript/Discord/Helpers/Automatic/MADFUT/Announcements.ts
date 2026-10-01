import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { Requests } from "../../../../MADFUT/Requests.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";

const config = new Configuration();
const func = new Functions();
const req = new Requests();
const cFile = "announcement.json";

export default async function AnnouncementUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel;
    if (!channel) return;

    const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/configs/${await req.getConfigVersion()}`), msg = data.fields?.mainMenuMessage?.mapValue?.fields; if (!msg) return;
    const uNum = parseInt(msg.updateNumber?.integerValue || "0"); if (uNum <= readCacheNumber(cFile)) return;

    const text = msg.message?.stringValue || "No message";
    const seeFor = msg.seeFor?.integerValue || 0;

    let desc = text;
    if (seeFor) desc += `\nVisible for ${seeFor}s`;
    await channel.send(func.createEmbed("New Announcement", desc, false));
    writeCacheNumber(cFile, uNum);
}