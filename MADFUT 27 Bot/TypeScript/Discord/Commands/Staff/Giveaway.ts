import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, MessageFlags } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";
import { getPackName } from "../../Helpers/Packs.js";
import { CustomPackRow } from "../../Helpers/Interface.js";
import { GiveawayWinning, addGiveawayWinning, payGiveawayWinning } from "../../../Functions.js";
import Configuration from "../../../Configuration.js";

const config = new Configuration();

export default class Giveaway extends Command {
    constructor() {
        super(
            'giveaway',
            '[STAFF]: Host a giveaway straight out of your wallet..',
            [
                { name: 'item', description: 'What are you giving away?', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: 'Coins', value: 'coins' },
                    { name: 'Bot Trades', value: 'trades' },
                    { name: 'PackDuo Tokens', value: 'tokens' },
                    { name: 'Cards', value: 'cards' },
                    { name: 'Packs', value: 'packs' },
                    { name: 'Custom Pack Token', value: 'ctokens' },
                    { name: 'Player Picks', value: 'picks' }
                ]},
                { name: 'duration', description: 'How long is it hosted for?', type: ApplicationCommandOptionType.Integer, required: true, choices: [
                    { name: '1 Minute', value: 60 },
                    { name: '5 Minutes', value: 300 },
                    { name: '10 Minutes', value: 600 },
                    { name: '30 Minutes', value: 1800 },
                    { name: '1 Hour', value: 3600 },
                    { name: '3 Hours', value: 10800 },
                    { name: '6 Hours', value: 21600 },
                    { name: '12 Hours', value: 43200 },
                    { name: '24 Hours', value: 86400 }
                ]},
                { name: 'amount', description: 'How Many? | Coins/Trades/Tokens Only', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'cards', description: 'What Cards? | Example: 1x30503 (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'packs', description: 'What Packs? | Example: 2xrandom or Custom Pack IDs (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { item: 'coins' | 'trades' | 'tokens' | 'cards' | 'packs' | 'ctokens' | 'picks', amount?: number, cards?: string, packs?: string, duration: number }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), database = (dBase as any)['db'], hostId = int.user.id; if (!funcs.isLinked(int)) return;

            if ((args.item !== 'cards' && args.item !== 'packs') && (!args.amount || args.amount <= 0)) return await int.reply(funcs.createEmbed("Missing Amount", "You MUST pick an amount above `0`\nAmount is NOT needed when giving away cards or packs", true));
            if (args.item === 'cards' && !args.cards) return await int.reply(funcs.createEmbed("Missing Cards", "You MUST pick which card(s) to give away\nExample: `1x30503`", true));
            if (args.item === 'packs' && !args.packs) return await int.reply(funcs.createEmbed("Missing Packs", "You MUST pick which pack(s) to give away\nExample: `2xrandom` or a Custom Pack ID", true));

            const prize: string[] = []; let winning!: GiveawayWinning;

            if (args.item === 'coins') {
                if (dBase.coins.get(hostId) < args.amount!) return await int.reply(funcs.createEmbed("Not Enough Coins", `You don't have enough coins to host this\nCoins Total: \`${dBase.coins.get(hostId).toLocaleString()}\`/\`${args.amount!.toLocaleString()}\``, true));

                dBase.coins.remove(hostId, args.amount!);
                prize.push(`\`${args.amount!.toLocaleString()}\` Coins`);
                winning = { label: prize[0], coins: args.amount };
            }
            else if (args.item === 'trades') {
                if (dBase.trades.get(hostId) < args.amount!) return await int.reply(funcs.createEmbed("Not Enough Trades", `You don't have enough trades to host this\nBot Trades Total: \`${dBase.trades.get(hostId).toLocaleString()}\`/\`${args.amount!.toLocaleString()}\``, true));

                dBase.trades.remove(hostId, args.amount!);
                prize.push(`\`${args.amount!.toLocaleString()}\` Bot Trades`);
                winning = { label: prize[0], trades: args.amount };
            }
            else if (args.item === 'tokens') {
                if (dBase.packduos.get(hostId) < args.amount!) return await int.reply(funcs.createEmbed("Not Enough Tokens", `You don't have enough PackDuo Tokens to host this\nTokens Total: \`${dBase.packduos.get(hostId).toLocaleString()}\`/\`${args.amount!.toLocaleString()}\``, true));

                dBase.packduos.remove(hostId, args.amount!);
                prize.push(`\`${args.amount!.toLocaleString()}\` PackDuo Tokens`);
                winning = { label: prize[0], packduos: args.amount };
            }
            else if (args.item === 'ctokens') {
                if (dBase.packTokens.get(hostId) < args.amount!) return await int.reply(funcs.createEmbed("Not Enough Tokens", `You don't have enough Custom Pack Tokens to host this\nToken Total: \`${dBase.packTokens.get(hostId).toLocaleString()}\`/\`${args.amount!.toLocaleString()}\``, true));

                dBase.packTokens.remove(hostId, args.amount!);
                prize.push(`\`${args.amount!.toLocaleString()}\` Custom Pack Token(s)`);
                winning = { label: prize[0], ctokens: args.amount };
            }
            else if (args.item === 'picks') {
                if (dBase.picks.get(hostId) < args.amount!) return await int.reply(funcs.createEmbed("Not Enough Picks", `You don't have enough Player Picks to host this\nPicks Total: \`${dBase.picks.get(hostId).toLocaleString()}\`/\`${args.amount!.toLocaleString()}\``, true));

                dBase.picks.remove(hostId, args.amount!);
                prize.push(`\`${args.amount!.toLocaleString()}\` Player Pick(s)`);
                winning = { label: prize[0], picks: args.amount };
            }
            else if (args.item === 'packs') {
                const resolved = funcs.resolvePacks(dBase, args.packs!), notEnough: string[] = [], validPacks: { pack_id: string; quantity: number }[] = [], yourPacks: CustomPackRow[] = [];

                for (const pack of resolved.standards) {
                    const owned = dBase.packs.get(hostId, pack.pack_id);
                    if (owned < pack.quantity) { notEnough.push(`${getPackName(pack.pack_id)} | Tried: \`${pack.quantity}\`, Owned: \`${owned}\``); continue; }

                    validPacks.push({ pack_id: pack.pack_id, quantity: pack.quantity });
                }
                for (const custom of resolved.customs) {
                    if (custom.userId !== hostId) { notEnough.push(`\`${custom.name}\` (ID: \`${custom.id}\`) isn't yours`); continue; }

                    yourPacks.push(custom);
                }

                const issues: string[] = [];
                if (resolved.invalid.length > 0) { issues.push("Invalid/Unknown Packs:"); for (const i of resolved.invalid) issues.push(`> \`${i}\`: Invalid`); }
                if (notEnough.length > 0) { issues.push("\nNot Enough Of / Not Yours:"); for (const n of notEnough) issues.push(`> ${n}`); }
                if ((!validPacks.length && !yourPacks.length) || issues.length > 0) return await int.reply(funcs.createEmbed("Giveaway Stopped", issues.join("\n") || "Nothing was valid..", true));

                for (const pack of validPacks) { dBase.packs.remove(hostId, pack.pack_id, pack.quantity); prize.push(`x\`${pack.quantity}\` ${getPackName(pack.pack_id)} Pack`); }
                for (const custom of yourPacks) { dBase.customPacks.remove(custom.id); prize.push(`\`${custom.name}\` Custom Pack (ID: \`${custom.id}\`)`); }
                winning = { label: prize.join("\n"), packs: validPacks, cPacks: yourPacks };
            }
            else {
                const parsed = funcs.parseCards(/^\d+$/.test(args.cards!) ? `1x${args.cards}` : args.cards!), invalid: string[] = [], notOwned: string[] = [], notEnough: string[] = [], valid: { card_id: string; quantity: number; text: string }[] = [];
                if (!parsed.length) return await int.reply(funcs.createEmbed("Invalid Cards", "None of those Card IDs are valid\nExample: `1x30503`", true));

                for (const card of parsed) {
                    const cardInfo = database.prepare("SELECT name, rating, color FROM madfut27cards WHERE id = ?").get(card.card_id) as any;
                    if (!cardInfo) { invalid.push(card.card_id); continue; }

                    const owned = dBase.cards.get(hostId, card.card_id);
                    if (owned <= 0) { notOwned.push(`${cardInfo.name}`); continue; }
                    if (owned < card.quantity) { notEnough.push(`${cardInfo.name} | Tried: \`${card.quantity}\`, Owned: \`${owned}\``); continue; }

                    valid.push({ card_id: card.card_id, quantity: card.quantity, text: `x\`${card.quantity}\` ${cardInfo.rating} ${cardInfo.name} (${(cardInfo.color || 'Unknown').toUpperCase()})` });
                }

                const issues: string[] = [];
                if (invalid.length > 0) { issues.push("Invalid Card IDs:"); for (const i of invalid) issues.push(`> \`${i}\`: Invalid`); }
                if (notOwned.length > 0) { issues.push("\nYou Don't Own:"); for (const o of notOwned) issues.push(`> ${o}`); }
                if (notEnough.length > 0) { issues.push("\nNot Enough Of:"); for (const n of notEnough) issues.push(`> ${n}`); }
                if (!valid.length || issues.length > 0) return await int.reply(funcs.createEmbed("Giveaway Stopped", issues.join("\n") || "Nothing was valid..", true));

                for (const card of valid) { dBase.cards.remove(hostId, card.card_id, card.quantity); prize.push(card.text); }
                winning = { label: prize.join("\n"), cards: valid.map(({ card_id, quantity }) => ({ card_id, quantity })) };
            }

            const endsAt = Math.floor((Date.now() + args.duration * 1000) / 1000);
            const giveawayPing = config.Discord.Roles.PingRoles.Giveaways ? ` <@&${config.Discord.Roles.PingRoles.Giveaways}>` : "";
            const row = (entries: number) => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("join").setLabel("Join").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("entries").setLabel(`Entries: ${entries}`).setStyle(ButtonStyle.Secondary).setDisabled(true));
            const gEmbed = (entries: number) => funcs.createEmbed(`Giveaway!${giveawayPing}`, `**Prize**:\n${prize.join("\n")}\n**Host:** <@${hostId}>\n**Ends:** <t:${endsAt}:R>\n\nClick **Join** for a chance to win..\nThe prize gets paid straight into the winner's wallet`, false, cont => cont.addActionRowComponents(() => row(entries)));

            await int.reply(gEmbed(0));
            const message = await int.fetchReply(), entrants = new Set<string>();
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: args.duration * 1000 });

            collector.on("collect", async (i: any) => {
                if (i.customId !== "join") return;
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (i.user.id === hostId) return await i.reply({ content: "You can't join your own giveaway!", flags: MessageFlags.Ephemeral });
                if (entrants.has(i.user.id)) return await i.reply({ content: "You've already joined this giveaway!", flags: MessageFlags.Ephemeral });

                entrants.add(i.user.id);
                await i.update(gEmbed(entrants.size));
            });

            collector.on("end", async () => {
                if (entrants.size === 0) {
                    payGiveawayWinning(hostId, winning);
                    return await message.edit(funcs.createEmbed("Giveaway Ended", `Nobody entered..\nThe prize has been returned to <@${hostId}>'s wallet`, false, cont => cont.addActionRowComponents(() => row(0))));
                }

                const winner = [...entrants][Math.floor(Math.random() * entrants.size)];
                if (dBase.username.getFromUID(winner)) {
                    payGiveawayWinning(winner, winning);
                    await message.edit(funcs.createEmbed("Giveaway Ended!", `Winner: <@${winner}>\n**Prize:**\n${winning.label}\n\nPaid straight into their wallet..\nGG!`, false, cont => cont.addActionRowComponents(() => row(entrants.size))));
                }
                else {
                    addGiveawayWinning(winner, winning);
                    await message.edit(funcs.createEmbed("Giveaway Ended!", `Winner: <@${winner}>\n**Prize:**\n${winning.label}\n\nThey aren't linked..\nThe prize is saved and pays out automatically once they run \`/link\``, false, cont => cont.addActionRowComponents(() => row(entrants.size))));
                }
            });
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
