import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";

const config = new Configuration();
const func = new Functions();
const cFile = "market_token.json";

export default async function MarketTokenUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel; if (!channel) return;
    const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/autoContent/27`), token = data.fields?.marketToken?.mapValue?.fields; if (!token) return;
    const rating = parseInt(token.rating?.integerValue || "0"), nAv = parseInt(token.numAvailable?.integerValue || "0"), isRewarded = token.isRewarded?.booleanValue || false;

    const cHas = rating * 1000000 + nAv * 1000 + (isRewarded ? 1 : 0), lHash = readCacheNumber(cFile);
    if (cHas === lHash) return;

    writeCacheNumber(cFile, cHas);
    await channel.send(func.createEmbed(`Market Token Update:`, `\`${nAv}\`x ${rating} Token\nInformation: ${isRewarded ? "MUST Watch AD" : "Free Token!!"}`, false));
}