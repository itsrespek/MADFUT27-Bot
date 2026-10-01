import { ApplicationCommandOptionType, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, User } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import MADFUTDB from '../../Database.js';
import { Functions } from '../../Functions.js';
import { getPackName } from '../Helpers/Packs.js';
import { CustomPackRow, TradeOffer } from '../Helpers/Interface.js';

export default class Trade extends Command {
    constructor() {
        super(
            'trade',
            'Trade items with another user..',
            [
                { name: 'user', description: 'Who Are You Trading With?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'coins', description: 'Your Offer: How Many Coins?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'trades', description: 'Your Offer: How Many Bot Trades?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'packduos', description: 'Your Offer: How Many PackDuo Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'ctokens', description: 'Your Offer: How Many Custom Pack Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'picks', description: 'Your Offer: How Many Player Picks?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'cards', description: 'Your Offer: What Cards? | Example: 1xid30503 (Separators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'packs', description: 'Your Offer: What Packs? | Example: 2xrandom,special95,CustomPackID', type: ApplicationCommandOptionType.String, required: false },
                { name: 'request-coins', description: 'Their Offer: How Many Coins?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'request-trades', description: 'Their Offer: How Many Bot Trades?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'request-packduos', description: 'Their Offer: How Many PackDuo Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'request-ctokens', description: 'Their Offer: How Many Custom Pack Tokens?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'request-picks', description: 'Their Offer: How Many Player Picks?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'request-cards', description: 'Their Offer: What Cards? | Example: 1xid30503 (Separators: ,.)', type: ApplicationCommandOptionType.String, required: false },
                { name: 'request-packs', description: 'Their Offer: What Packs? | Example: 2xrandom,95_special,CustomPackID', type: ApplicationCommandOptionType.String, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: {
        user: User,
        coins?: number,
        trades?: number,
        packduos?: number,
        ctokens?: number,
        picks?: number,
        cards?: string,
        packs?: string,
        'request-coins'?: number,
        'request-trades'?: number,
        'request-packduos'?: number,
        'request-ctokens'?: number,
        'request-picks'?: number,
        'request-cards'?: string,
        'request-packs'?: string
    }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = (dBase as any)['db'];
            if (!funcs.isLinked(int)) return;

            const reject = (msg: string) => int.reply(funcs.createEmbed("Trade Error", msg, true));
            const initiator = int.user;
            const initiatorId = String(initiator.id), receiverId = String(args.user);
            const receiver = c.users.cache.get(receiverId) ?? await c.users.fetch(receiverId).catch(() => null);
            if (!receiver) return await reject("Couldn't find that user..\nAre you sure they're in this server?");

            if (initiatorId === receiverId) return await reject("You can't trade with yourself!");
            if (receiver.bot) return await reject("You can't trade with a bot..\nBots don't have a wallet and can never confirm");
            if (!dBase.username.getFromUID(receiverId)) return await reject(`<@${receiverId}> isn't linked yet!\nTherefore you can't trade with them..`);
            if (dBase.security.isBanned(receiverId)) return await reject("That user is bot banned..\nTherefore you can't trade with them..");
            if (funcs.lock.has(initiatorId) || funcs.lock.has(receiverId)) return await reject("Transaction In Progress\nOne of you already has a transaction going\nPlease wait for it to finish first");

            const readAmount = (v?: number) => (v === undefined ? 0 : (Number.isInteger(v) && v > 0 ? v : -1));
            const offer: TradeOffer = {
                coins: readAmount(args.coins), trades: readAmount(args.trades),
                packduos: readAmount(args.packduos), ctokens: readAmount(args.ctokens), picks: readAmount(args.picks),
                cards: [], packs: [], cPacks: []
            };
            const wanted: TradeOffer = {
                coins: readAmount(args['request-coins']), trades: readAmount(args['request-trades']),
                packduos: readAmount(args['request-packduos']), ctokens: readAmount(args['request-ctokens']), picks: readAmount(args['request-picks']),
                cards: [], packs: [], cPacks: []
            };
            if ([offer.coins, offer.trades, offer.packduos, offer.ctokens, offer.picks, wanted.coins, wanted.trades, wanted.packduos, wanted.ctokens, wanted.picks].some(a => a < 0)) {
                return await reject("Invalid Amount..\nAmounts MUST be above 0");
            }

            const parseCardsSide = (raw?: string) => {
                if (!raw || !raw.trim()) return [] as TradeOffer['cards'];
                const cleaned = /^\d+$/.test(raw.trim()) ? `1xid${raw.trim()}` : raw;
                const map = new Map<string, number>();
                for (const card of funcs.parseCards(cleaned)) map.set(card.card_id, (map.get(card.card_id) || 0) + card.quantity);
                return [...map].map(([card_id, quantity]) => ({ card_id, quantity }));
            };
            const parsePacksSide = (raw?: string): { packs: TradeOffer['packs'], cPacks: CustomPackRow[], invalid: string[] } => {
                if (!raw || !raw.trim()) return { packs: [], cPacks: [], invalid: [] };
                const resolved = funcs.resolvePacks(dBase, raw);
                const map = new Map<string, number>();
                for (const pack of resolved.standards) map.set(pack.pack_id, (map.get(pack.pack_id) || 0) + pack.quantity);
                const seen = new Set<string>();
                const cPacks = resolved.customs.filter(p => !seen.has(p.id) && seen.add(p.id));
                return { packs: [...map].map(([pack_id, quantity]) => ({ pack_id, quantity })), cPacks, invalid: resolved.invalid };
            };

            offer.cards = parseCardsSide(args.cards);
            wanted.cards = parseCardsSide(args['request-cards']);
            const offerPacks = parsePacksSide(args.packs), wantedPacks = parsePacksSide(args['request-packs']);
            offer.packs = offerPacks.packs, offer.cPacks = offerPacks.cPacks;
            wanted.packs = wantedPacks.packs, wanted.cPacks = wantedPacks.cPacks;

            const invalidIds = [
                ...offer.cards, ...wanted.cards
            ].filter(x => !dBase.cardInfo.getNameFromID(x.card_id)).map(x => `\`${x.card_id}\` (Card)`);
            for (const inv of [...offerPacks.invalid, ...wantedPacks.invalid]) invalidIds.push(`\`${inv}\` (Pack)`);

            const overlap = offer.cPacks.filter(p => wanted.cPacks.some(w => w.id === p.id));
            if (overlap.length > 0) return await reject(`Duplicate Custom Packs..\n${overlap.map(p => `> \`${p.name}\` (ID: \`${p.id}\`)`).join('\n')}\nA Custom Pack can NOT be on both sides of a trade`);

            const isEmpty = (o: TradeOffer) => o.coins <= 0 && o.trades <= 0 && o.packduos <= 0 && o.ctokens <= 0 && o.picks <= 0 && o.cards.length === 0 && o.packs.length === 0 && o.cPacks.length === 0;
            if (isEmpty(offer) && isEmpty(wanted)) return await reject("Empty Trade..\nSomeone has to offer something");

            if (invalidIds.length > 0) return await reject(`Invalid Items:\n${invalidIds.map(i => `> ${i}`).join('\n')}\n\nNote: Custom Packs can only be traded \`1x\` at a time`);

            const missingFor = (userId: string, o: TradeOffer) => {
                const missing: string[] = [];
                if (o.coins > 0 && dBase.coins.get(userId) < o.coins) missing.push(`Coins | Owned: \`${dBase.coins.get(userId).toLocaleString()}\`, Needed: \`${o.coins.toLocaleString()}\``);
                if (o.trades > 0 && dBase.trades.get(userId) < o.trades) missing.push(`Bot Trades | Owned: \`${dBase.trades.get(userId).toLocaleString()}\`, Needed: \`${o.trades.toLocaleString()}\``);
                if (o.packduos > 0 && dBase.packduos.get(userId) < o.packduos) missing.push(`PackDuo Tokens | Owned: \`${dBase.packduos.get(userId).toLocaleString()}\`, Needed: \`${o.packduos.toLocaleString()}\``);
                if (o.ctokens > 0 && dBase.packTokens.get(userId) < o.ctokens) missing.push(`Custom Pack Tokens | Owned: \`${dBase.packTokens.get(userId).toLocaleString()}\`, Needed: \`${o.ctokens.toLocaleString()}\``);
                if (o.picks > 0 && dBase.picks.get(userId) < o.picks) missing.push(`Player Picks | Owned: \`${dBase.picks.get(userId).toLocaleString()}\`, Needed: \`${o.picks.toLocaleString()}\``);
                for (const card of o.cards) {
                    const owned = dBase.cards.get(userId, card.card_id), name = dBase.cardInfo.getNameFromID(card.card_id) ?? 'Unknown Card';
                    if (owned < card.quantity) missing.push(`x\`${card.quantity}\` ${name} | Owned: \`${owned.toLocaleString()}\``);
                }
                for (const pack of o.packs) {
                    const owned = dBase.packs.get(userId, pack.pack_id);
                    if (owned < pack.quantity) missing.push(`x\`${pack.quantity}\` ${getPackName(pack.pack_id)} Pack | Owned: \`${owned.toLocaleString()}\``);
                }
                for (const cPack of o.cPacks) {
                    const row = dBase.customPacks.get(cPack.id);
                    if (!row || row.userId !== userId) missing.push(`Custom Pack **${cPack.name}** (ID: \`${cPack.id}\`)`);
                }
                return missing;
            };

            const initProblems = missingFor(initiatorId, offer), recvProblems = missingFor(receiverId, wanted);
            if (initProblems.length > 0 || recvProblems.length > 0) {
                const parts: string[] = [];
                if (initProblems.length > 0) parts.push(`You are missing from YOUR offer:\n${initProblems.map(p => `> ${p}`).join('\n')}`);
                if (recvProblems.length > 0) parts.push(`<@${receiverId}> is missing from THEIR requested offer:\n${recvProblems.map(p => `> ${p}`).join('\n')}`);
                return await reject(`Missing Items:\n\n${parts.join('\n\n')}`);
            }

            const describe = (o: TradeOffer) => {
                const lines: string[] = [];
                if (o.coins > 0) lines.push(`- \`${o.coins.toLocaleString()}\` Coins`);
                if (o.trades > 0) lines.push(`- \`${o.trades.toLocaleString()}\` Bot Trades`);
                if (o.packduos > 0) lines.push(`- \`${o.packduos.toLocaleString()}\` PackDuo Tokens`);
                if (o.ctokens > 0) lines.push(`- \`${o.ctokens.toLocaleString()}\` Custom Pack Tokens`);
                if (o.picks > 0) lines.push(`- \`${o.picks.toLocaleString()}\` Player Picks`);

                const sorted = o.cards
                    .map(card => ({ ...card, info: db.prepare("SELECT name, rating, color FROM madfut27cards WHERE id = ?").get(card.card_id) as any }))
                    .sort((a, b) => (b.info?.rating || 0) - (a.info?.rating || 0));
                for (const card of sorted) {
                    lines.push(card.info
                        ? `- \`x${card.quantity}\` ${card.info.rating} ${card.info.name} (${card.info.position}, ${String(card.info.color || '?').toUpperCase()})`
                        : `- \`x${card.quantity}\` Unknown Card`);
                }
                for (const pack of o.packs) lines.push(`- \`x${pack.quantity}\` ${getPackName(pack.pack_id)} Pack`);
                for (const cPack of o.cPacks) lines.push(`- Custom Pack **${cPack.name}** (\`${cPack.minRating}-${cPack.maxRating}\` | ID: \`${cPack.id}\`)`);
                return lines;
            };
            const capLines = (lines: string[]) => (lines.length > 10 ? [...lines.slice(0, 10), `- ..and \`${lines.length - 10}\` more`] : lines);

            const offerLines = capLines(describe(offer)), wantedLines = capLines(describe(wanted));

            const move = (fromId: string, toId: string, o: TradeOffer) => {
                if (o.coins > 0) { dBase.coins.remove(fromId, o.coins); dBase.coins.add(toId, o.coins); }
                if (o.trades > 0) { dBase.trades.remove(fromId, o.trades); dBase.trades.add(toId, o.trades); }
                if (o.packduos > 0) { dBase.packduos.remove(fromId, o.packduos); dBase.packduos.add(toId, o.packduos); }
                if (o.ctokens > 0) { dBase.packTokens.remove(fromId, o.ctokens); dBase.packTokens.add(toId, o.ctokens); }
                if (o.picks > 0) { dBase.picks.remove(fromId, o.picks); dBase.picks.add(toId, o.picks); }
                for (const card of o.cards) { dBase.cards.remove(fromId, card.card_id, card.quantity); dBase.cards.add(toId, card.card_id, card.quantity); }
                for (const pack of o.packs) { dBase.packs.remove(fromId, pack.pack_id, pack.quantity); dBase.packs.add(toId, pack.pack_id, pack.quantity); }
                for (const cPack of o.cPacks) dBase.customPacks.transfer(cPack.id, toId);
            };

            let initConfirmed = false, recvConfirmed = false, done = false;

            const buttons = () => new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('trade_confirm').setLabel('Confirm Trade').setStyle(ButtonStyle.Success).setDisabled(done),
                new ButtonBuilder().setCustomId('trade_deny').setLabel('Deny Trade').setStyle(ButtonStyle.Danger).setDisabled(done)
            );

            const view = (title: string, note?: string) => {
                const body = [
                    `**${initiator.displayName}** ⇄ **${receiver.displayName}**`,
                    '',
                    `**${initiator.displayName} Offers:**`,
                    ...(offerLines.length ? offerLines : ['- Nothing']),
                    '',
                    `**${receiver.displayName} Offers:**`,
                    ...(wantedLines.length ? wantedLines : ['- Nothing']),
                    '',
                    '**Status:**',
                    `${initiator.displayName}: ${initConfirmed ? '**Confirmed**' : '*Waiting..*'}`,
                    `${receiver.displayName}: ${recvConfirmed ? '**Confirmed**' : '*Waiting..*'}`
                ];
                if (note) body.push('', note);
                return funcs.createEmbed(title, body.join('\n'), false, cont => cont.addActionRowComponents(() => buttons()));
            };

            await int.reply(view('Trade Proposal'));
            const message = await int.fetchReply();
            const col = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

            col.on('collect', async (i: any) => {
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (i.user.id !== initiatorId && i.user.id !== receiverId) return await i.reply(funcs.createEmbed("Error", "This isn't your trade!", true));
                if (done) return await i.reply(funcs.createEmbed("Trade Over", "This trade has already been finalized", true));

                if (i.customId === 'trade_deny') {
                    done = true;
                    col.stop('denied');
                    return await i.update(view('Trade Declined', `${i.user.displayName} denied the trade..\nNothing was transferred`));
                }

                if (i.user.id === initiatorId) initConfirmed = true;
                else recvConfirmed = true;

                if (initConfirmed && recvConfirmed) {
                    done = true;
                    if (funcs.lock.has(initiatorId) || funcs.lock.has(receiverId)) {
                        col.stop('failed');
                        return await i.update(view('Trade Failed', 'One of you started another transaction..\nNothing was transferred'));
                    }

                    funcs.lock.add(initiatorId);
                    funcs.lock.add(receiverId);
                    try {
                        const initProblems2 = missingFor(initiatorId, offer), recvProblems2 = missingFor(receiverId, wanted);
                        if (initProblems2.length > 0 || recvProblems2.length > 0) {
                            const parts: string[] = [];
                            if (initProblems2.length > 0) parts.push(`**${initiator.displayName} no longer has:**\n${initProblems2.map(p => `> ${p}`).join('\n')}`);
                            if (recvProblems2.length > 0) parts.push(`**${receiver.displayName} no longer has:**\n${recvProblems2.map(p => `> ${p}`).join('\n')}`);
                            col.stop('failed');
                            return await i.update(view('Trade Failed', `Someone no longer has the items..\nNothing was transferred\n\n${parts.join('\n\n')}`));
                        }

                        move(initiatorId, receiverId, offer);
                        move(receiverId, initiatorId, wanted);
                        col.stop('accepted');
                        return await i.update(view('Trade Accepted', 'Both users confirmed..\nAll items have been swapped'));
                    }
                    finally {
                        funcs.lock.remove(initiatorId);
                        funcs.lock.remove(receiverId);
                    }
                }

                await i.update(view('Trade Proposal', `${i.user.displayName} confirmed the trade..\nWaiting on the other user`));
            });

            col.on('end', async () => {
                if (done) return;
                done = true;
                await message.edit(view('Trade Expired', 'Time ran out before both users confirmed..\nNothing was transferred')).catch(() => null);
            });
        }
        catch (e) {
            console.log(e);
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}
