import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';
import { GamePacks, getPackName } from '../../Helpers/Packs.js';

const PACK_POOL = Object.keys(GamePacks).filter(key => key !== 'special95' && !key.endsWith('_special'));

export default class Glasses extends Command {
    constructor() {
        super(
            'glasses',
            'Pick a glass and hope for a reward.. ',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            const uid = String(int.user.id), now = Math.floor(Date.now() / 1000);

            const lastPick = dBase.glass.get(uid);
            if (lastPick > now) return await int.reply(funcs.createEmbed("Already Picked", `You already picked a glass today!\nCome back: <t:${lastPick}:R>`, true));

            const rollPrize = () => {
                const r = Math.random() * 100;
                if (r < 35) return { text: "Empty.. nothing", payout: () => null };
                if (r < 60) { const c = Math.floor(Math.random() * 400001) + 100000; return { text: `\`${c.toLocaleString()}\` Coins`, payout: () => dBase.coins.add(uid, c) }; }
                if (r < 75) { const c = Math.floor(Math.random() * 1500001) + 500000; return { text: `\`${c.toLocaleString()}\` Coins`, payout: () => dBase.coins.add(uid, c) }; }
                if (r < 87) { const t = Math.floor(Math.random() * 7) + 2; return { text: `\`${t}\` Bot Trades`, payout: () => dBase.trades.add(uid, t) }; }
                if (r < 95) { const p = PACK_POOL[Math.floor(Math.random() * PACK_POOL.length)]; return { text: `\`1x\` ${getPackName(p)} Pack`, payout: () => dBase.packs.add(uid, p, 1) }; }

                return { text: "`1x` Custom Pack Token", payout: () => dBase.packTokens.add(uid, 1) };
            };

            const prizes = Array.from({ length: 5 }, () => rollPrize());
            await int.reply(funcs.createEmbed("Glasses", `Pick ONE glass out of 5..\nOne of them might hold something good\nCome back every \`24\` hours to try again`, false, cont => cont.addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(
                [1, 2, 3, 4, 5].map(n => new ButtonBuilder().setCustomId(`glass_${n}`).setLabel(`Glass ${n}`).setStyle(ButtonStyle.Primary))
            ))));

            const message = await int.fetchReply();
            const col = (message as any).createMessageComponentCollector({ componentType: ComponentType.Button });
            const timeout = setTimeout(async () => {
                await int.editReply(funcs.createEmbed("Glasses Expired", "You took too long to pick..\nNo cooldown used, come try again"));
                col.stop();
            }, 120_000);

            let picked = false;
            col.on('collect', async (i: any) => {
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (i.user.id !== uid) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));
                if (picked) return await i.reply(funcs.createEmbed("Too Late", "A glass was already picked!", true));

                picked = true;
                clearTimeout(timeout);
                dBase.glass.reset(uid); dBase.glass.add(uid, now + 86400);

                const choice = parseInt(i.customId.split('_')[1]) - 1, prize = prizes[choice];
                prize.payout();

                const reveal = prizes.map((p, n) => `${n === choice ? '>>' : ''} Glass ${n + 1}:${n === choice ? '<<' : ''} ${p.text}`).join('\n');
                await i.update(funcs.createEmbed(prize.text === "Empty.. nothing" ? "Better Luck Next Time.." : "You Won!", `You picked Glass ${choice + 1}\n${prize.text === "Empty.. nothing" ? "..and it was empty" : `Reward: ${prize.text}`}\n---\nWhat was inside:\n${reveal}`));
                return col.stop();
            });
            col.on('end', () => clearTimeout(timeout));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
