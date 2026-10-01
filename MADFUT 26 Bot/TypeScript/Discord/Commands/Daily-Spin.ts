import { CommandInteraction } from "discord.js";
import Command from "../Helpers/Layout/CMDs.js";
import DiscordClient from "../Client.js";
import MADFUTDB from "../../Database.js";
import { Functions } from "../../Functions.js";
import { GamePacks, getPackName } from "../Helpers/Packs.js";

export default class DailySpin extends Command {
    constructor() {
        super(
            "daily-spin", 
            "Claim your daily spin..", 
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const dBase = new MADFUTDB(), db = (dBase as any)['db'], now = Math.floor(Date.now() / 1000), cLength = dBase.cooldown.get(String(int.user.id)); 

            if (!c.functions.isLinked(int)) return;
            if (cLength && cLength > now) {
                return await int.reply(c.functions.createEmbed("Already Claimed", `You have already claimed today!\nCome back: <t:${dBase.cooldown.get(String(int.user.id))}:R>`, true));
            }

            const rewards: string[] = [], types = ["coins", "trades", "cards", "ctokens", "picks", "packs"].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
			if (types.includes("coins")) { const c = Math.floor(Math.random() * 100001) + 300000; dBase.coins.add(String(int.user.id), c); rewards.push(`\`${c.toLocaleString()}\` Coins`); }
			if (types.includes("trades")) { const t = Math.floor(Math.random() * 3) + 4; dBase.trades.add(String(int.user.id), t); rewards.push(`\`${t}\` Bot Trades`); }
			if (types.includes("cards")) { const cards = dBase.cardInfo.getAll(); if (cards.length) { const tCards = db.prepare("SELECT id, name FROM madfut27cards WHERE tradable = 1").all() as { id: string; name: string }[]; if (tCards.length) { const r = tCards[Math.floor(Math.random() * tCards.length)], a = Math.floor(Math.random() * 3) + 1; dBase.cards.add(String(int.user.id), r.id, a); rewards.push(`x\`${a}\` ${r.name} (ID: \`${r.id}\`)`); }}} 
			if (types.includes("ctokens")) { const t = Math.floor(Math.random() * 2) + 1; dBase.packTokens.add(String(int.user.id), t); rewards.push(`\`${t}\` Custom Pack Token(s)`); }
			if (types.includes("picks")) { const p = Math.floor(Math.random() * 2) + 1; dBase.picks.add(String(int.user.id), p); rewards.push(`\`${p}\` Player Pick(s)`); }
			if (types.includes("packs")) { const packIds = Object.keys(GamePacks); if (packIds.length) { const pId = packIds[Math.floor(Math.random() * packIds.length)], q = Math.floor(Math.random() * 2) + 1; dBase.packs.add(String(int.user.id), pId, q); rewards.push(`x\`${q}\` ${getPackName(pId)} Pack`); }}

            const nextDay = now + 86400;
			dBase.cooldown.reset(String(int.user.id)); dBase.cooldown.add(String(int.user.id), nextDay);

            await int.reply(c.functions.createEmbed("Daily Spin", `Congratulations, ${int.user.username}!\nYou won: ${rewards.join(", & ")}`));
            await c.functions.sleep(100);
            await int.followUp(c.functions.createEmbed("Reward Added", `You've recieved the prize\nCome back: <t:${nextDay}:R>`, true));
        } 
        catch (e) {
            console.error(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}