import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";

export default class Drop extends Command {
    constructor() {
        super(
            'drop',
            '[STAFF]: Send a drop in..',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            const coins = Math.floor(Math.random() * 190000) + 10000, trades = Math.floor(Math.random() * 5) + 5, claimed = new Set<string>();

            const button = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("claim").setLabel("Claim Drop").setStyle(ButtonStyle.Success));
            await int.reply(funcs.createEmbed(`Drop!`, `Rewards:\n\`${coins.toLocaleString()}\` Coins\n\`${trades}\` Bot Trades`, false, cont => cont.addActionRowComponents(() => button)));
            
            const message = await int.fetchReply();
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on("collect", async (i: any) => {
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (claimed.has(i.user.id)) return await i.reply({ content: "You've already claimed this!", flags: MessageFlags.Ephemeral });
                if (claimed.size > 0) return await i.reply({ content: "Womp womp dickhead, you didn't get it in time", flags: MessageFlags.Ephemeral });

                claimed.add(i.user.id);
                dBase.coins.add(i.user.id, coins);
                dBase.trades.add(i.user.id, trades);

                const claimEmbed = funcs.createEmbed(`${i.user.displayName} Claimed!`, `Rewards:\n\`${coins.toLocaleString()}\` Coins\n\`${trades}\` Bot Trades`, false, cont => cont.addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("claim").setLabel("Claim Drop").setStyle(ButtonStyle.Success).setDisabled(true))));
                await i.update(claimEmbed);
                collector.stop();
            });

            collector.on("end", async () => {
                if (claimed.size === 0) {
                    await message.edit(funcs.createEmbed("Expired", "Too slow..", false, cont => cont.addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("claim").setLabel("Claim Drop").setStyle(ButtonStyle.Success).setDisabled(true)))));
                }
            });
        } 
        catch (e) {
            console.error(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}