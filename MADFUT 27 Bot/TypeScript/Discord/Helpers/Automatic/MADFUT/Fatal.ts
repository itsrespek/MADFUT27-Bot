import { Client, TextChannel } from "discord.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import { Functions } from "../../../../Functions.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";
import { Requests } from "../../../../MADFUT/Requests.js";

const req = new Requests();
const config = new Configuration();
const func = new Functions();
const modes = [
    { key: "fatalSim", file: "fatal_sim.json", label: "Fatal Sim" },
    { key: "fatalMyClub", file: "fatal_myclub.json", label: "Fatal My Club" },
    { key: "fatalDraft", file: "fatal_draft.json", label: "Fatal Draft" },
];

export default async function FatalUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel; if (!channel) return;
    const v = await req.getConfigVersion(), cfg = await req.getConfig(v);

    for (const mode of modes) {
        const p = parseInt(cfg.fields?.[mode.key]?.integerValue || "0"); if (!p) continue;
        const lastPointer = readCacheNumber(mode.file); if (p <= lastPointer) continue;

        const { data } = await axios.get(`${config.MADFUT.URLs.FireStore}/${mode.key}/${p}`);
        const doc = data.fields; if (!doc) continue;
        const series = doc.series?.arrayValue?.values || [];

        for (let i = 0; i < series.length; i++) {
            const s = series[i], f = s.mapValue.fields, rating = f.rating?.integerValue || "?", points = f.pointsNeeded?.integerValue || 0, rewards = f.rewards?.arrayValue?.values || [];
            const rName = rewards.map((r: any) => {
                const rf = r.mapValue.fields, type = rf.type?.stringValue || "unknown", amt = rf.amount?.integerValue || 0;
                
                let fType = type;
                if (type === "rewardQuery") {
                    fType = "100% New 96-99 Special Pack";
                } 
                else if (type.includes("guar_")) {
                    let cleanType = type.replace('guar_', '');
                    cleanType = cleanType.replace(/_\d+$/, '');
                    
                    fType = "100% " + cleanType.split('_').map((word: string) => {
                        if (word === "xi") return "XI";
                        if (word === "futties") return "Futties";
                        if (word === "icon") return "Icon";
                        if (word === "nominee") return "Nominee";
                        if (word === "historic") return "Historic";
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    }).join(' ');
                }
                else if (type.includes("token")) {
                    const parts = type.split('_');
                    const tNum = parts[parts.length - 1];
                    fType = `${tNum} Token`;
                }
                else if (type === "coins") {
                    fType = "Coins";
                }
                else {
                    let cleanType = type.replace(/_\d+$/, '');
                    
                    if (type.includes("pp") && type.match(/\d+_\d+$/)) {
                        const match = type.match(/(\d+)_(\d+)$/);
                        if (match) {
                            const low = match[1];
                            const high = match[2];
                            let namePart = type.replace(/_\d+_\d+$/, '').replace('pp_', '').replace('_', ' ');
                            namePart = namePart.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            fType = `${low}-${high} ${namePart}`;
                        } else {
                            fType = "Player Pick";
                        }
                    }
                    else if (type.includes("pp_") && type.match(/\d+$/)) {
                        const match = type.match(/(\d+)$/);
                        if (match) {
                            const num = match[1];
                            let namePart = type.replace(/_\d+$/, '').replace('pp_', '');
                            namePart = namePart.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            fType = `${num}+ ${namePart}`;
                        } else {
                            fType = "Player Pick";
                        }
                    }
                    else if (type.match(/^\d+_special$/)) {
                        const num = type.match(/(\d+)_special/)?.[1] || "";
                        fType = `${num}+ Special`;
                    }
                    else if (cleanType.includes("random") && cleanType.includes("special")) {
                        fType = "Random Special";
                    }
                    else if (cleanType === "special") {
                        fType = "Special";
                    }
                    else {
                        if (cleanType.includes("inc_")) {
                            cleanType = cleanType.replace('inc_', '');
                        }
                        fType = cleanType.split('_').map((word: string) => {
                            if (word === "xi") return "XI";
                            if (word === "pp") return "Player Pick";
                            if (word === "futties") return "Futties";
                            if (word === "icon") return "Icon";
                            if (word === "nominee") return "Nominee";
                            if (word === "historic") return "Historic";
                            if (word === "ltm") return "LTM";
                            if (word === "random") return "Random";
                            if (word === "special") return "Special";
                            return word.charAt(0).toUpperCase() + word.slice(1);
                        }).join(' ');
                    }
                }
                return `${amt}x ${fType}`;
            }).join("\n");

            await channel.send(func.createEmbed(`${mode.label} Season ${p}`, `${rating} Rated | ${points} Points\n\n__Rewards:__\n${rName || "No rewards"}`, false));
        }
        writeCacheNumber(mode.file, p);
    }
}