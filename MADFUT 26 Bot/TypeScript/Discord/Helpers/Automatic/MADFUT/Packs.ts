import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";

const config = new Configuration();
const func = new Functions();

const cFile = "packs_update.json";

export default async function PacksUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel; if (!channel) return;
    
    const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/autoContent/27`);
    const currentUpdate = parseInt(data.fields?.packsUpdateNumber?.integerValue || "0"), lastUpdate = readCacheNumber(cFile); if (currentUpdate <= lastUpdate) return; if (!data.fields.packs?.arrayValue?.values) return;

    const formatName = (id: string): string => {
        if (id.includes('guar_')) {
            const clean = id.replace('guar_', '').replace(/_\d+$/, '');
            return `100% ${clean.split('_').map((w: string) => 
                ({ xi: 'XI', futties: 'Futties', icon: 'Icon', nominee: 'Nominee', historic: 'Historic', best: 'Best' })[w] || 
                w.charAt(0).toUpperCase() + w.slice(1)
            ).join(' ')}`;
        }
        
        if (id.includes('inc_')) {
            const clean = id.replace('inc_', '');
            const match = clean.match(/(.+)_(\d+)$/);
            if (match) {
                const [, packName, percent] = match;
                return `${percent}% ${packName.split('_').map((w: string) =>
                    ({ xi: 'XI', futties: 'Futties', icon: 'Icon', nominee: 'Nominee', historic: 'Historic', best: 'Best', silver: 'Silver', superstar: 'Superstar', madfut: 'Madfut' })[w] ||
                    w.charAt(0).toUpperCase() + w.slice(1)
                ).join(' ')}`;
            }
        }
        
        if (id.includes('pp_') && id.match(/\d+_\d+$/)) {
            const match = id.match(/(\d+)_(\d+)$/);
            if (match) {
                const [low, high] = [match[1], match[2]];
                let clean = id.replace(/_\d+_\d+$/, '').replace('pp_', '');
                if (clean.includes('special')) clean = 'Special';
                else clean = clean.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return `${low}-${high} ${clean}`;
            }
        }
        
        if (id.includes('random_special_')) {
            const num = id.match(/random_special_(\d+)/)?.[1];
            return `${num}x Random Special`;
        }
        
        const map: Record<string, string> = { random_special: 'Random Special', op_special: 'Special', double_special: 'Special', random: 'Random Pack', totw: 'TOTW', gold_super: 'Gold Super', '80+': '80+ Pack' };
        if (map[id]) return map[id];
        
        if (id.match(/^\d+_special$/)) {
            const num = id.match(/(\d+)_special/)?.[1] || "";
            return `${num}+ Special`;
        }
        
        return id.split('_').map((w: string) => {
            const replacements: Record<string, string> = { xi: 'XI', pp: 'Player Pick', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', rare: 'Rare' };
            return replacements[w] || w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
    };

    const packs = data.fields.packs.arrayValue.values.map((pack: { mapValue: { fields: any; }; }) => {
        const p = pack?.mapValue?.fields; if (!p.id?.stringValue) return null;
        
        const name = formatName(p.id.stringValue), price = parseInt(p.price?.integerValue === "-1" ? "0" : p.price?.integerValue), priceText = p.price?.integerValue === "-1" ? "Free (AD)" : `${parseInt(p.price?.integerValue).toLocaleString()} Coins`, available = p.numAvailable?.integerValue === "-1" ? "Unlimited" : `${p.numAvailable?.integerValue}x`;
        return { name, price, priceText, available, text: `${available} ${name} | ${priceText}` };
    }).filter(Boolean);

    const freePacks = packs.filter((p: any) => p.priceText === "Free (AD)"), paidPacks = packs.filter((p: any) => p.priceText !== "Free (AD)").sort((a: any, b: any) => b.price - a.price), unlimitedPacks = paidPacks.filter((p: any) => p.available === "Unlimited"),  limitedPacks = paidPacks.filter((p: any) => p.available !== "Unlimited");
    
    const message = [ ...freePacks.map((p: any) => p.text), ...limitedPacks.map((p: any) => p.text), ...(unlimitedPacks.length > 0 ? ['', ...unlimitedPacks.map((p: any) => p.text)] : []) ].join('\n');

    if (message) {
        await channel.send(func.createEmbed(`<@&${config.Discord.Roles.PingRoles.MADFUTNews}> New Packs:`, message, false));
        writeCacheNumber(cFile, currentUpdate);
    }
}