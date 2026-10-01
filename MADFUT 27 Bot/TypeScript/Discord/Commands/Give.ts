import { ApplicationCommandOptionType, CommandInteraction, User } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import { Functions } from '../../Functions.js';
import MADFUTDB from '../../Database.js';
import { getPackName } from '../Helpers/Packs.js';

export default class Give extends Command {
    constructor() {
        super(
            'give',
            'Give another person items..',
            [
                { name: 'user', description: 'What Discord User?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'coins', description: 'How Many?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'trades', description: 'How Many?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'cards', description: 'What Cards? | Example: 1x30503 (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'packs', description: 'What Packs? | Example: 2xrandom or Custom Pack IDs (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'packduos', description: 'How Many PackDuo Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'custom-pack-tokens', description: 'How Many Custom Pack Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'picks', description: 'How Many Player Picks?', type: ApplicationCommandOptionType.Integer, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { user: User, coins?: number, trades?: number, cards?: string, packs?: string, packduos?: number, ['custom-pack-tokens']?: number, picks?: number }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), payeeId = String(int.user.id), rId = String(args.user), given: string[] = [];
            
            if (payeeId === rId) return await int.reply(funcs.createEmbed("Give Error", "You can't pay yourself, stupid!", true));
            if (args.user.bot) return await int.reply(funcs.createEmbed("Give Error", "You can't pay a bot, stupid!", true));
            if (!funcs.isLinked(int)) return;
            if (!dBase.username.getFromUID(rId)) return await int.reply(funcs.createEmbed("Give Error", `<@${args.user}> isn't linked yet!\nTherefore you can't pay them..`, true));

            if ((!args.coins || args.coins <= 0) && (!args.trades || args.trades <= 0) && !args.cards && !args.packs && (!args.packduos || args.packduos <= 0) && (!args['custom-pack-tokens'] || args['custom-pack-tokens'] <= 0) && (!args.picks || args.picks <= 0)) {
                return await int.reply(funcs.createEmbed("Give Error", `You MUST give coins, trades, tokens, packs or cards`, true));
            }

            if (args.coins && args.coins > 0) {
                if (dBase.coins.get(payeeId) < args.coins) {
                    return await int.reply(funcs.createEmbed("Give Error", `You don't have enough coins\nCoins Total: \`${dBase.coins.get(payeeId).toLocaleString()}\`/\`${args.coins.toLocaleString()}\``, true));
                }
                
                dBase.coins.remove(payeeId, args.coins);
                dBase.coins.add(rId, args.coins);
                given.push(`\`${args.coins.toLocaleString()}\` Coins`);
            }

            if (args.trades && args.trades > 0) {
                if (dBase.trades.get(payeeId) < args.trades) {
                    return await int.reply(funcs.createEmbed("Give Error", `You don't have enough trades\nBot Trade total: \`${dBase.trades.get(payeeId).toLocaleString()}\`/\`${args.trades.toLocaleString()}\``, true));
                }
                
                dBase.trades.remove(payeeId, args.trades);
                dBase.trades.add(rId, args.trades);
                given.push(`\`${args.trades.toLocaleString()}\` Bot Trades`);
            }

            if (args.packduos && args.packduos > 0) {
                if (dBase.packduos.get(payeeId) < args.packduos) {
                    return await int.reply(funcs.createEmbed("Give Error", `You don't have enough PackDuo Tokens\nToken Total: \`${dBase.packduos.get(payeeId).toLocaleString()}\`/\`${args.packduos.toLocaleString()}\``, true));
                }

                dBase.packduos.remove(payeeId, args.packduos);
                dBase.packduos.add(rId, args.packduos);
                given.push(`\`${args.packduos.toLocaleString()}\` PackDuo Token(s)`);
            }

            if (args['custom-pack-tokens'] && args['custom-pack-tokens'] > 0) {
                if (dBase.packTokens.get(payeeId) < args['custom-pack-tokens']) {
                    return await int.reply(funcs.createEmbed("Give Error", `You don't have enough Custom Pack Tokens\nToken Total: \`${dBase.packTokens.get(payeeId).toLocaleString()}\`/\`${args['custom-pack-tokens'].toLocaleString()}\``, true));
                }

                dBase.packTokens.remove(payeeId, args['custom-pack-tokens']);
                dBase.packTokens.add(rId, args['custom-pack-tokens']);
                given.push(`\`${args['custom-pack-tokens'].toLocaleString()}\` Custom Pack Token(s)`);
            }

            if (args.picks && args.picks > 0) {
                if (dBase.picks.get(payeeId) < args.picks) {
                    return await int.reply(funcs.createEmbed("Give Error", `You don't have enough Player Picks\nPicks Total: \`${dBase.picks.get(payeeId).toLocaleString()}\`/\`${args.picks.toLocaleString()}\``, true));
                }

                dBase.picks.remove(payeeId, args.picks);
                dBase.picks.add(rId, args.picks);
                given.push(`\`${args.picks.toLocaleString()}\` Player Pick(s)`);
            }

            if (args.cards) {
                const invalid: string[] = [], notOwned: string[] = [], notEnough: string[] = [];
                if (/^\d+$/.test(args.cards)) args.cards = `1x${args.cards}`;
                for (const card of funcs.parseCards(args.cards)) {
                    const cardName = dBase.cardInfo.getNameFromID(card.card_id);
                    if (!cardName) {
                        invalid.push(card.card_id);
                        continue;
                    }
                    if (dBase.cards.get(payeeId, card.card_id) <= 0) {
                        notOwned.push(`${cardName}`);
                        continue;
                    }
                    if (dBase.cards.get(payeeId, card.card_id) < card.quantity) {
                        notEnough.push(`${cardName} | Tried: ${card.quantity}, Owned: ${dBase.cards.get(payeeId, card.card_id)}`);
                        continue;
                    }

                    dBase.cards.remove(payeeId, card.card_id, card.quantity);
                    dBase.cards.add(rId, card.card_id, card.quantity);
                    given.push(`x\`${card.quantity}\` ${cardName} (ID: \`${card.card_id}\`)`);
                }

                if (invalid.length > 0) {
                    given.push("\nInvalid Card IDs:");
                    for (const invalidCard of invalid) given.push(`> \`${invalidCard}\`: Invalid`);
                }

                if (notOwned.length > 0) {
                    given.push("\nDoesn't Own:");
                    for (const item of notOwned) given.push(`> ${item}`);
                }

                if (notEnough.length > 0) {
                    given.push("\nNot Enough:");
                    for (const item of notEnough) given.push(`> ${item}`);
                }
            }

            if (args.packs) {
                const resolved = funcs.resolvePacks(dBase, args.packs), notOwned: string[] = [], notEnough: string[] = [];

                for (const pack of resolved.standards) {
                    if (dBase.packs.get(payeeId, pack.pack_id) < pack.quantity) {
                        notEnough.push(`${getPackName(pack.pack_id)} | Tried: ${pack.quantity}, Owned: ${dBase.packs.get(payeeId, pack.pack_id)}`);
                        continue;
                    }

                    dBase.packs.remove(payeeId, pack.pack_id, pack.quantity);
                    dBase.packs.add(rId, pack.pack_id, pack.quantity);
                    given.push(`x\`${pack.quantity}\` ${getPackName(pack.pack_id)} Pack`);
                }

                for (const custom of resolved.customs) {
                    if (custom.userId !== payeeId) {
                        notOwned.push(`\`${custom.name}\` Custom Pack (ID: \`${custom.id}\`)`);
                        continue;
                    }

                    dBase.customPacks.transfer(custom.id, rId);
                    given.push(`\`${custom.name}\` Custom Pack (ID: \`${custom.id}\`)`);
                }

                for (const invalidPack of resolved.invalid) given.push(`\nInvalid Packs:\n> \`${invalidPack}\`: Invalid`);

                if (notOwned.length > 0) {
                    given.push("\nDoesn't Own:");
                    for (const item of notOwned) given.push(`> ${item}`);
                }

                if (notEnough.length > 0) {
                    given.push("\nNot Enough:");
                    for (const item of notEnough) given.push(`> ${item}`);
                }
            }

            if (!given.length) given.push("Nothing Given..");
            await int.reply(funcs.createEmbed("Give Complete", `${int.user} -> <@${args.user}>:\n${given.join("\n")}`, false));
        }
        catch(e) {
            console.log(e);
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}