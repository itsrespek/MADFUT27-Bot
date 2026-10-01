import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { Requests } from "../../../../MADFUT/Requests.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";

const config = new Configuration();
const func = new Functions();
const req = new Requests();
const cFile = "sbc_updates.json", gFile = "sbc_groups.json";
const MAX_GROUPS_PER_RUN = 10;

type Fields = Record<string, any>;

function reqSuffix(s: Fields): string {
    const conds = s.conditions?.arrayValue?.values || [];
    const rating = conds.find((c: any) => c.mapValue.fields.type?.stringValue === "rating")?.mapValue.fields.value?.integerValue;
    const chem = conds.find((c: any) => c.mapValue.fields.type?.stringValue === "chemistry")?.mapValue.fields.value?.integerValue;
    const parts: string[] = [];
    if (rating) parts.push(`${rating} RAT`);
    if (chem) parts.push(`${chem} CHEM`);
    return parts.length ? ` - ${parts.join(" | ")}` : "";
}

function rewardSummary(list: Fields[]): string {
    const packs: Record<string, number> = {};
    let coins = 0;
    for (const s of list) {
        for (const r of s.rewards?.arrayValue?.values || []) {
            const f = r.mapValue.fields, type = f.type?.stringValue || "unknown", amt = parseInt(f.amount?.integerValue) || 0;
            if (type === "coins") coins += amt;
            else packs[type] = (packs[type] || 0) + amt;
        }
    }
    const lines: string[] = [];
    if (coins) lines.push(`${coins.toLocaleString()} Coins`);
    lines.push(...Object.entries(packs).map(([name, count]) => `\`${count}\`x ${name}`));
    return lines.join("\n") || "No Rewards";
}

export default async function SBCUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel; if (!channel) return;

    // Live SBCs from autoContent
    const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/autoContent/27`), cur = parseInt(data.fields?.sbcsUpdateNumber?.integerValue || "0");
    if (cur > readCacheNumber(cFile)) {
        const sbcs = data.fields?.sbcs?.arrayValue?.values?.map((v: any) => v.mapValue.fields) || []; if (!sbcs.length) return;

        const groups: Record<string, Fields[]> = {};
        for (const s of sbcs) (groups[s.category?.stringValue || "Uncategorized"] ??= []).push(s);
        for (const [cat, list] of Object.entries(groups)) {
            const lines = list.map(s => `${s.name?.stringValue || "Unknown"}`).join("\n");
            await channel.send(func.createEmbed(`<@&${config.Discord.Roles.PingRoles.MADFUTNews}> New SBC Group: ${cat}`, `__${list.length} SBCs__\n${lines}\n\n__Rewards:__\n${rewardSummary(list)}`, false));
        }
        writeCacheNumber(cFile, cur);
    }

    // Named SBC groups walked down from configs.sbcGroups
    const cfg = await req.getConfig(await req.getConfigVersion());
    const newest = parseInt(cfg.fields?.sbcGroups?.integerValue || "0"); if (!newest) return;

    const last = readCacheNumber(gFile); if (newest <= last) return;
    if (!last) { writeCacheNumber(gFile, newest); return; }

    const found: { page: number, fields: Fields }[] = [];
    for (let page = newest; page > last && found.length < MAX_GROUPS_PER_RUN; page--) {
        try {
            const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/sbcGroups/${page}`);
            if (!data.fields) break;
            found.unshift({ page, fields: data.fields });
        }
        catch { break; }
    }
    if (!found.length) return;

    for (const g of found) {
        const list: Fields[] = g.fields.sbcs?.arrayValue?.values?.map((v: any) => v.mapValue.fields) || []; if (!list.length) continue;
        const name = g.fields.name?.stringValue || `#${g.page}`;
        const desc = g.fields.description?.stringValue ? `${g.fields.description.stringValue}\n\n` : "";
        const lines = list.map(s => `\`${s.numAvailable?.integerValue || 1}x\` ${s.name?.stringValue || "Unknown"}${reqSuffix(s)}`).join("\n");
        await channel.send(func.createEmbed(`<@&${config.Discord.Roles.PingRoles.MADFUTNews}> New SBC Group: ${name}`, `${desc}__${list.length} SBCs__\n${lines}\n\n__Rewards:__\n${rewardSummary(list)}`, false));
    }
    writeCacheNumber(gFile, found[0].page);
}
