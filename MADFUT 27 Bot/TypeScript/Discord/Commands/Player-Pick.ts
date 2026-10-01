import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from "discord.js";
import Command from "../Helpers/Layout/CMDs.js";
import DiscordClient from "../Client.js";
import MADFUTDB from "../../Database.js";
import { Functions } from "../../Functions.js";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export default class PlayerPick extends Command {
    constructor() {
        super(
            "player-pick",
            "Use a Player Pick to choose 1 of 5 cards..",
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = (dBase as any)['db'], userId = String(int.user.id);
            if (!funcs.isLinked(int)) return;
            if (funcs.lock.has(userId)) return await int.reply(funcs.createEmbed("Transaction In Progress", "You already have a transaction going\nPlease wait for it to finish first", true));
            if (dBase.picks.get(userId) < 1) return await int.reply(funcs.createEmbed("No Player Picks", `You don't have ANY player picks\nPicks Total: \`${dBase.picks.get(userId).toLocaleString()}\``, true));

            const roll = Math.random(), target = roll < 0.6 ? randomInt(84, 91) : roll < 0.9 ? randomInt(92, 95) : randomInt(96, 99);
            const grab = (spread: number) => db.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE tradable = 1 AND rating BETWEEN ? AND ? ORDER BY RANDOM() LIMIT 5").all(target - spread, target + spread) as any[];
            let options = grab(0);
            if (options.length < 5) options = grab(1);
            if (options.length < 5) options = grab(2);
            if (options.length < 5) options = db.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE tradable = 1 AND rating >= 80 ORDER BY RANDOM() LIMIT 5").all() as any[];

            funcs.lock.add(userId);

            const cardText = (card: any) => `\`x1\` ${card.rating} ${card.name} (${String(card.color || 'Unknown').toUpperCase()})`;
            const body = [
                `Picks Available: \`${dBase.picks.get(userId).toLocaleString()}\``,
                '',
                '**Your Options:**',
                ...options.map((o, i) => `**${i + 1}.** ${cardText(o)}`),
                '',
                'All options are around the same rating..\nClick a button below to pick your card'
            ].join('\n');
            const rows = (disabled: boolean) => [
                new ActionRowBuilder<ButtonBuilder>().addComponents(options.slice(0, 5).map((o, i) => new ButtonBuilder().setCustomId(`ppick_${i}`).setLabel(`${o.rating} ${String(o.name)}`.slice(0, 80)).setStyle(ButtonStyle.Secondary).setDisabled(disabled)))
            ];
            const view = (title: string, note?: string) => funcs.createEmbed(title, note ? `${note}` : body, false, cont => { for (const row of rows(false)) cont.addActionRowComponents(() => row); });

            if (options.length < 5) {
                funcs.lock.remove(userId);
                return await int.reply(funcs.createEmbed("Pick Error", "Not enough cards in the database right now\nTry again later", true));
            }

            await int.reply(view("Player Pick"));
            const message = await int.fetchReply();
            const col = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });
            let done = false;

            col.on("collect", async (i: any) => {
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (i.user.id !== userId) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));
                if (done) return await i.reply(funcs.createEmbed("Pick Over", "This pick has already been finalized", true));

                if (dBase.picks.get(userId) < 1) {
                    done = true;
                    col.stop('nopicks');
                    return await i.update(funcs.createEmbed("No Player Picks", "You don't have a pick anymore\nNothing was used", false, cont => { for (const row of rows(true)) cont.addActionRowComponents(() => row); }));
                }

                done = true;
                dBase.picks.remove(userId, 1);
                const picked = options[parseInt(i.customId.split("_")[1])] ?? options[0];
                dBase.cards.add(userId, picked.id, 1);
                col.stop('picked');

                await i.update(funcs.createEmbed("Player Pick Complete", `You picked:\n${cardText(picked)}\n\nPaid straight into your wallet..\nRemaining Picks: \`${dBase.picks.get(userId).toLocaleString()}\``, false, cont => { for (const row of rows(true)) cont.addActionRowComponents(() => row); }));
            });

            col.on("end", async () => {
                funcs.lock.remove(userId);
                if (done) return;
                await message.edit(funcs.createEmbed("Pick Expired", "Time ran out before you chose..\nNo pick was used", false, cont => { for (const row of rows(true)) cont.addActionRowComponents(() => row); })).catch(() => null);
            });
        }
        catch (e) {
            console.error(e);
            const payload = new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true);
            try { await (int.replied || int.deferred ? int.followUp(payload) : int.reply(payload)); } catch { }
        }
    }
}
