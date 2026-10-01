import { ApplicationCommandOptionType, CommandInteraction, User } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import { Functions } from '../../../Functions.js';
import MADFUTDB from '../../../Database.js';
import { getPackName } from '../../Helpers/Packs.js';

export default class Remove extends Command {
    constructor() {
        super(
            'remove',
            '[ADMIN]: Remove items from wallet',
            [
                { name: 'user', description: 'Which user?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'coins', description: 'How Many?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'trades', description: 'How Many?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'cards', description: 'What Card IDs/Names?', type: ApplicationCommandOptionType.String, required: false },
                { name: 'packs', description: 'What Packs? | Example: 2xrandom or Custom Pack IDs (Seperators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'tokens', description: 'How Many Custom Pack Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'picks', description: 'How Many Player Picks?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'level', description: 'What Level?', type: ApplicationCommandOptionType.String, required: false, choices: [{ name: 'Bronze', value: 'bronze' }, { name: 'Silver', value: 'silver' }, { name: 'Gold', value: 'gold' }, { name: 'TOTW', value: 'totw' }, { name: 'FUT Champ', value: 'fut_champ' }, { name: 'UCL', value: 'ucl' }, { name: 'Future Stars', value: 'future_stars' }, { name: 'TOTY Nominee', value: 'toty_nominee' }, { name: 'Moments', value: 'moments' }, { name: 'Icon', value: 'icon' }, { name: 'TOTY', value: 'toty' }, { name: 'TOTS', value: 'tots' }] }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { user: User, coins?: number, trades?: number, cards?: string, packs?: string, tokens?: number, picks?: number, level?: string }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), discId = String(args.user), removed: string[] = [];
            if (!args.coins && !args.trades && !args.cards && !args.packs && (!args.tokens || args.tokens <= 0) && (!args.picks || args.picks <= 0) && !args.level) return await int.reply(funcs.createEmbed("Missing Option", "You MUST pick either: 'coins, trades or cards'", true));
            if (args.coins && args.coins > 0) {
                dBase.coins.remove(discId, args.coins);
                removed.push(`\`${args.coins.toLocaleString()}\` Coins`);
            }

            if (args.trades && args.trades > 0) {
                dBase.trades.remove(discId, args.trades);
                removed.push(`\`${args.trades.toLocaleString()}\` Bot Trades`);
            }

            if (args.cards) {
                const invalid: string[] = [], notOwned: string[] = [], notEnough: string[] = [];
                for (const card of funcs.parseCards(/^\d+$/.test(args.cards) ? `1x${args.cards}` : args.cards)) {
                    const cardName = dBase.cardInfo.getNameFromID(card.card_id);
                    if (!cardName) {
                        invalid.push(card.card_id);
                        continue;
                    }

                    if (dBase.cards.get(discId, card.card_id) <= 0) {
                        notOwned.push(`${cardName}`);
                        continue;
                    }
                    if (dBase.cards.get(discId, card.card_id) < card.quantity) {
                        notEnough.push(`${cardName} | Tried: \`${card.quantity}\`, Owned: \`${dBase.cards.get(discId, card.card_id)}\``);
                        continue;
                    }
                    dBase.cards.remove(discId, card.card_id, card.quantity);
                    removed.push(`x\`${card.quantity}\` ${cardName}`);
                }
                if (invalid.length > 0) {
                    removed.push("\nInvalid Card IDs:");
                    for (const invalidCard of invalid) removed.push(`\`${invalidCard}\`: Invalid`);
                }
                if (notOwned.length > 0) {
                    removed.push("\nDoesn't Own:");
                    for (const item of notOwned) removed.push(`${item}`);
                }
                if (notEnough.length > 0) {
                    removed.push("\nNot Enough:");
                    for (const item of notEnough) removed.push(`${item}`);
                }
            }

            if (args.packs) {
                const resolved = funcs.resolvePacks(dBase, args.packs), notOwned: string[] = [], notEnough: string[] = [];

                for (const pack of resolved.standards) {
                    if (dBase.packs.get(discId, pack.pack_id) <= 0) {
                        notOwned.push(`${getPackName(pack.pack_id)} Pack`);
                        continue;
                    }
                    if (dBase.packs.get(discId, pack.pack_id) < pack.quantity) {
                        notEnough.push(`${getPackName(pack.pack_id)} | Tried: \`${pack.quantity}\`, Owned: \`${dBase.packs.get(discId, pack.pack_id)}\``);
                        continue;
                    }

                    dBase.packs.remove(discId, pack.pack_id, pack.quantity);
                    removed.push(`x\`${pack.quantity}\` ${getPackName(pack.pack_id)} Pack`);
                }

                for (const custom of resolved.customs) {
                    if (custom.userId !== discId) {
                        notOwned.push(`\`${custom.name}\` Custom Pack (ID: \`${custom.id}\`)`);
                        continue;
                    }

                    dBase.customPacks.remove(custom.id);
                    removed.push(`\`${custom.name}\` Custom Pack (ID: \`${custom.id}\`)`);
                }

                if (resolved.invalid.length > 0) {
                    removed.push("\nInvalid Pack IDs:");
                    for (const invalidPack of resolved.invalid) removed.push(`\`${invalidPack}\`: Invalid`);
                }

                if (notOwned.length > 0) {
                    removed.push("\nDoesn't Own:");
                    for (const item of notOwned) removed.push(`${item}`);
                }

                if (notEnough.length > 0) {
                    removed.push("\nNot Enough:");
                    for (const item of notEnough) removed.push(`${item}`);
                }
            }

            if (args.tokens && args.tokens > 0) {
                dBase.packTokens.remove(discId, args.tokens);
                removed.push(`\`${args.tokens.toLocaleString()}\` Custom Pack Token(s)`);
            }

            if (args.picks && args.picks > 0) {
                dBase.picks.remove(discId, args.picks);
                removed.push(`\`${args.picks.toLocaleString()}\` Player Pick(s)`);
            }

            if (args.level) {
                const levelNames: Record<string, string> = { 'bronze': 'Bronze', 'silver': 'Silver', 'gold': 'Gold', 'totw': 'TOTW', 'fut_champ': 'FUT Champ', 'ucl': 'UCL', 'future_stars': 'Future Stars', 'toty_nominee': 'TOTY Nominee', 'moments': 'Moments', 'icon': 'Icon', 'toty': 'TOTY', 'tots': 'TOTS'};
                dBase.rewardRoles.set(discId, { ...dBase.rewardRoles.get(discId), [args.level]: false });
                removed.push(`${levelNames[args.level]} Level Reward Reset`);
            }

            if (!removed.length) removed.push('Nothing removed..');
            await int.reply(funcs.createEmbed("Removal Complete", `<@${args.user}>, the following was removed:\n${removed.join("\n")}`, false));
        }
        catch(e) {
            console.log(e);
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}