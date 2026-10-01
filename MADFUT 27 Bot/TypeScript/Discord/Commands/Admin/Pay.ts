import { ApplicationCommandOptionType, CommandInteraction, User } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import { Functions } from '../../../Functions.js';
import MADFUTDB from '../../../Database.js';
import { getPackName } from '../../Helpers/Packs.js';

export default class Pay extends Command {
    constructor() {
        super(
            'pay',
            '[ADMIN]: Pay items to a wallet',
            [
                { name: 'user', description: 'Which user?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'coins', description: 'How Many Coins?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'trades', description: 'How Many Trades?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'cards', description: 'What Cards? | Example: 1x30503 (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'packs', description: 'What Packs? | Example: 2xrandom or Custom Pack IDs (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'pack-duo-tokens', description: 'How Many PackDuo Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'custom-pack-tokens', description: 'How Many Custom Pack Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'picks', description: 'How Many Player Picks?', type: ApplicationCommandOptionType.Integer, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { user: User, coins?: number, trades?: number, cards?: string, packs?: string, ['pack-duo-tokens']?: number, ['custom-pack-tokens']?: number, picks?: number }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = (dBase as any)['db'], discId = args.user
            if (discId.bot) return await int.reply(funcs.createEmbed("Payment Error", "You can't pay a bot, stupid!\nBots don't have wallets..", true));
            if (!args.coins && !args.trades && !args.cards && !args.packs && (!args['pack-duo-tokens'] || args['pack-duo-tokens'] <= 0) && (!args['custom-pack-tokens'] || args['custom-pack-tokens'] <= 0) && (!args.picks || args.picks <= 0)) return await int.reply(funcs.createEmbed("Missing Option", "You MUST pick either: 'coins, trades or cards'", true));

            const paid: string[] = [];
            if (args.coins && args.coins > 0) {
                dBase.coins.add(String(discId), args.coins);
                paid.push(`\`${args.coins.toLocaleString()}\` Coins`);
            }

            if (args.trades && args.trades > 0) {
                dBase.trades.add(String(discId), args.trades);
                paid.push(`\`${args.trades.toLocaleString()}\` Bot Trades`);
            }

            if (args.cards) {
                const invalid: string[] = [];
                for (const card of funcs.parseCards(/^\d+$/.test(args.cards) ? `1x${args.cards}` : args.cards)) {
                    const cardInfo = db.prepare("SELECT name, rating, color FROM madfut27cards WHERE id = ?").get(card.card_id) as any;
                    if (!cardInfo) {
                        invalid.push(card.card_id);
                        continue;
                    }
                    dBase.cards.add(String(discId), card.card_id, card.quantity);
                    paid.push(`x\`${card.quantity}\` ${cardInfo.rating} ${cardInfo.name} (${cardInfo.color.toUpperCase()})`);
                }
                if (invalid.length > 0) {
                    paid.push("\nInvalid Card IDs:");
                    for (const invalidCard of invalid) paid.push(`\`${invalidCard}\`: Invalid`);
                }
            }

            if (args.packs) {
                const resolved = funcs.resolvePacks(dBase, args.packs);

                for (const pack of resolved.standards) {
                    dBase.packs.add(String(discId), pack.pack_id, pack.quantity);
                    paid.push(`x\`${pack.quantity}\` ${getPackName(pack.pack_id)} Pack`);
                }

                for (const custom of resolved.customs) {
                    const clone = { ...custom, id: funcs.rString(8), userId: String(discId) };
                    dBase.customPacks.create(clone);
                    paid.push(`\`${clone.name}\` Custom Pack (New ID: \`${clone.id}\`)`);
                }

                if (resolved.invalid.length > 0) {
                    paid.push("\nInvalid Pack IDs:");
                    for (const invalidPack of resolved.invalid) paid.push(`\`${invalidPack}\`: Invalid`);
                }
            }

            if (args['pack-duo-tokens'] && args['pack-duo-tokens'] > 0) {
                dBase.packduos.add(String(discId), args['pack-duo-tokens']);
                paid.push(`\`${args['pack-duo-tokens'].toLocaleString()}\` PackDuo Token(s)`);
            }
            if (args['custom-pack-tokens'] && args['custom-pack-tokens'] > 0) {
                dBase.packTokens.add(String(discId), args['custom-pack-tokens']);
                paid.push(`\`${args['custom-pack-tokens'].toLocaleString()}\` Custom Pack Token(s)`);
            }
            if (args.picks && args.picks > 0) {
                dBase.picks.add(String(discId), args.picks);
                paid.push(`\`${args.picks.toLocaleString()}\` Player Pick(s)`);
            }
            if (!paid.length) paid.push('Nothing Given..');
            await int.reply(funcs.createEmbed("Payment Complete", `Paid <@${args.user}>:\n${paid.join("\n")}`, false));
        }
        catch(e) {
            console.log(e)
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}