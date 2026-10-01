import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";
import { Requests } from "../../../../MADFUT/Requests.js";

const config = new Configuration();
const func = new Functions();
const req = new Requests();

const sFile = "evolutions_standard.json";
const eFile = "evolutions_elite.json";

const formatReward = (type: string, amt: number) => {
    if (type === "rewardQuery") return `${amt}x 100% New 96-99 Special Pack`;
    if (type.includes("guar_")) {
        const clean = type.replace('guar_', '').replace(/_\d+$/, '');
        return `${amt}x 100% ${clean.split('_').map((w: string) => ({ xi: 'XI', futties: 'Futties', icon: 'Icon', nominee: 'Nominee', historic: 'Historic' })[w] || w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    }
    if (type.includes("inc_")) {
        const clean = type.replace('inc_', '');
        const match = clean.match(/(.+)_(\d+)$/);
        if (match) {
            const [, name, percent] = match;
            return `${amt}x ${percent}% ${name.split('_').map((w: string) => ({ xi: 'XI', futties: 'Futties', icon: 'Icon', nominee: 'Nominee', historic: 'Historic' })[w] || w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
        }
        return `${amt}x ${clean.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    }
    if (type.includes("token")) {
        const num = type.split('_').pop();
        return `${amt}x ${num} Token`;
    }
    if (type === "coins") return `${amt.toLocaleString()} Coins`;
    if (type.match(/^\d+_special$/)) {
        const num = type.match(/(\d+)_special/)?.[1] || "";
        return `${amt}x ${num}+ Special Pack`;
    }
    if (type.includes("random_special")) {
        const num = type.match(/\d+$/)?.[0] || "";
        if (num) return `${amt}x ${num} Random Special`;
        return `${amt}x Random Special`;
    }
    if (type.includes("pp_")) {
        const match = type.match(/(\d+)_(\d+)$/);
        if (match) {
            const low = match[1];
            const high = match[2];
            let name = type.replace(/_\d+_\d+$/, '').replace('pp_', '');
            name = name.split('_').map((w: string) => {
                if (w === "new") return "New";
                if (w === "special") return "Special";
                return w.charAt(0).toUpperCase() + w.slice(1);
            }).join(' ');
            return `${amt}x ${low}-${high} ${name}`;
        }
        const singleMatch = type.match(/(\d+)$/);
        if (singleMatch) {
            const num = singleMatch[1];
            let name = type.replace(/_\d+$/, '').replace('pp_', '');
            name = name.split('_').map((w: string) => {
                if (w === "new") return "New";
                if (w === "special") return "Special";
                return w.charAt(0).toUpperCase() + w.slice(1);
            }).join(' ');
            return `${amt}x ${num} ${name}`;
        }
        return `${amt}x Player Pick`;
    }
    return `${amt}x ${type.split('_').map((w: string) => ({ xi: 'XI', pp: 'Player Pick', futties: 'Futties', icon: 'Icon', nominee: 'Nominee', historic: 'Historic', ltm: 'LTM', random: 'Random', special: 'Special' })[w] || w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
};

const buildEvolutionEmbed = (f: any, isElite: boolean) => {
    const name = f.name?.stringValue || `Unknown ${isElite ? 'Elite ' : ''}Evolution`;
    const description = f.description?.stringValue || "";
    const requirements = f.requirements?.stringValue || "";
    const points = f.points?.arrayValue?.values || [];
    const upgrades = f.standardUpgrades?.arrayValue?.values || [];
    
    const pLine = points.map((p: any, i: number) => {
        const pointVal = parseInt(p.integerValue) || 0;
        const upgrade = upgrades[i]?.stringValue || "";
        return `${pointVal} Points → ${upgrade}`;
    }).filter(Boolean).join("\n");

    const rewards = f.rewards?.arrayValue?.values || [];
    const rName = rewards.map((r: any) => {
        const rf = r.mapValue.fields;
        return formatReward(rf.type?.stringValue || "unknown", rf.amount?.integerValue || 0);
    }).join("\n");

    let desc = `**${name}**${description ? ` - ${description}` : ""}`;
    if (requirements) desc += `\n\nRequirements: ${requirements}`;
    if (pLine) desc += `\n\n__Progression:__\n${pLine}`;
    if (rName) desc += `\n\n__Rewards:__\n${rName}`;
    return desc;
};

export default async function EvolutionsUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel;
    if (!channel) return;

    const v = await req.getConfigVersion();
    if (!v) return;
    const cfg = await req.getConfig(v);
    if (!cfg) return;

    const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/autoContent/27`);
    if (!data) return;

    const sUpd = parseInt(data.fields?.evoStandardUpdateNumber?.integerValue || "0");
    if (sUpd > readCacheNumber(sFile)) {
        try {
            const { data: evoData } = await axios.get(`${config.MADFUT.URLs.FireStore}/evosStandard/${sUpd}`);
            const evos = evoData?.fields?.evos?.arrayValue?.values || [];
            for (const evo of evos) {
                const desc = buildEvolutionEmbed(evo.mapValue.fields, false);
                await channel.send(func.createEmbed(`New Standard Evolution!`, desc, false));
            }
            writeCacheNumber(sFile, sUpd);
        } catch (e) { 
            console.error(e); 
        }
    }

    const eUpd = parseInt(cfg.fields?.evosElite?.integerValue || "0");
    if (eUpd > readCacheNumber(eFile)) {
        try {
            const { data: evoData } = await axios.get(`${config.MADFUT.URLs.FireStore}/evosElite/${eUpd}`);
            const evos = evoData?.fields?.evos?.arrayValue?.values || [];
            for (const evo of evos) {
                const desc = buildEvolutionEmbed(evo.mapValue.fields, true);
                await channel.send(func.createEmbed(`New Elite Evolution!`, desc, false));
            }
            writeCacheNumber(eFile, eUpd);
        } 
        catch (e) { 
            console.error(e); 
        }
    }
}