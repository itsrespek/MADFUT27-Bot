import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import { Functions } from '../../Functions.js';
import { Trading } from '../../MADFUT/Trading.js';
import MADFUTDB from '../../Database.js';
import { Requests } from '../../MADFUT/Requests.js';
import { sendPaged } from '../Helpers/Pages.js';

export default class Withdraw extends Command {
    constructor() {
        super(
            'withdraw',
            'Withdraw from your wallet..',
            [
                { name: 'bot-trades', description: 'How Many Trades?', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'cards', description: 'What Cards? | Example: 1xid50489671', type: ApplicationCommandOptionType.String, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { 'bot-trades'?: number, cards?: string }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = (dBase as any)['db'], req = new Requests(), given: { rating: number, text: string }[] = [];
            const userTrades = dBase.trades.get(int.user.id), userCards = dBase.cards.getAll(int.user.id), gCards = new Map();

            if (!funcs.isLinked(int)) return;
            if (!args['bot-trades'] && !args.cards) return await int.reply(funcs.createEmbed("Missing Option", "You MUST pick either: 'Bot-Trades or Cards'", true));
            if (args['bot-trades'] && args.cards) return await int.reply(funcs.createEmbed("Too Many Options", "You can only pick ONE option: 'Bot-Trades OR Cards'", true));
            if (args['bot-trades'] && args['bot-trades'] > userTrades) return await int.reply(funcs.createEmbed("Not Enough Trades", `Total: \`${userTrades.toLocaleString()}\` / \`${args['bot-trades'].toLocaleString()}\``, true));

            if (funcs.lock.has(int.user.id)) return await int.reply(funcs.createEmbed("Transaction In Progress", "You already have a transaction going\nPlease wait for it to finish first", true));
            funcs.lock.add(int.user.id);

            if (args['bot-trades'] && args['bot-trades'] > 0) {
                let tradesDone = 0;
                await int.reply(funcs.createEmbed("Withdraw Started", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nTrades: \`0/${args['bot-trades']}\``, false));
                
                while (tradesDone < args['bot-trades']) {
                    await req.getToken();
                    const WsConnection = await new Trading(req.Info.IDToken!).getWS();
                    await req.inviteUser(dBase.username.getFromUID(int.user.id)!)

                    const tradeResult = await req.listenQueue(req.Info.AccessToken!, req.Info.BotUID!, async (data: any) => {
                        if (data && data.roomId) {
                            const roomId = data.roomId, amHosting = data.isHost;
                            return await new Trading(req.Info.IDToken!).trade({ amHosting, tradeId: roomId }, WsConnection, int.user.id, true, true, false);
                        }
                    }, 500, 30000);
                    WsConnection.close();

                    if (typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked") {
                        req.releaseToken();
                        tradesDone++;
                        dBase.trades.remove(int.user.id, 1);
                        if (tradeResult.Given?.Cards && Array.isArray(tradeResult.Given.Cards)) {
                            for (const card of tradeResult.Given.Cards) {
                                if (card) {
                                    const c = db.prepare("SELECT name, rating, position, color FROM madfut27cards WHERE id = ?").get(card) as any;
                                    const key = c ? `${c.name}|${c.rating}|${c.position}|${c.color}` : `Unknown Card|?|Unknown|Unknown`;
                                    gCards.set(key, (gCards.get(key) || 0) + 1);
                                }
                            }
                        }
                        await int.editReply(funcs.createEmbed("Withdraw Started", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nTrades: \`${tradesDone}/${args['bot-trades']}\``, false));
                    }
                    else {
                        req.releaseToken();
                        const errors: Record<string, string> = {
                            "UserLeft": "You left the trade..\nI have left the trade and wont reinvite",
                            "No Interaction": "You didn't interact with the trade..\nI have left the trade and wont reinvite",
                            "Cheater": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                            "Spam": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                            "Trade Error": `Your trade didn't work due to an error\nWe have NOT removed any items`,
                            "TimeOut": `You took too long to accept the invite..\nI have now removed the invite`,
                        };
                        const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                        await int.followUp(funcs.createEmbed("Withdraw Stopped", errorMsg));
                        break;
                    }
                }
                
                if (tradesDone >= args['bot-trades']) {
                    await int.editReply(funcs.createEmbed("Withdraw Completed", `Username: \`${dBase.username.getFromUID(int.user.id)}\` has finished\nTrades: \`${tradesDone}\``, false));

                    const lines: { rating: number, text: string }[] = [];
                    for (const [key, count] of gCards) {
                        const [name, rating, position, color] = key.split("|");
                        lines.push({ rating: parseInt(rating) || 0, text: rating ? `x${count} ${rating} ${name} (${position}, ${String(color).toUpperCase()})` : `x${count} ${name} (${position})` });
                    }
                    lines.sort((a, b) => b.rating - a.rating);
                    await sendPaged(int, funcs, "Withdraw: Given", lines.map(l => l.text));
                }
                return;
            }

            if (args.cards) {
                const cardsToGive: string[] = [], pCards = funcs.parseCards(args.cards)
                if (args.cards) {
                    if (args.cards.includes('-')) return await int.reply(funcs.createEmbed("Invalid Input", "Negative amounts aren't allowed\nDon't try to exploit the bot", true));
                    if (pCards.length === 0) return await int.reply(funcs.createEmbed("Invalid Input", "Nothing was found to withdraw\nMake sure you're using positive amounts", true));
                    if (pCards.reduce((sum, card) => sum + card.quantity, 0) > 3) return await int.reply(funcs.createEmbed("Too Many Cards", "You can't do that!\nMaximum: 3 Card IDs at once", true));
                    for (const card of pCards) {
                        if (card.quantity <= 0) {
                            return await int.reply(funcs.createEmbed("Invalid Quantity", `You CAN'T withdraw x\`${card.quantity}\` of \`${card.card_id}\``, true));
                        }
                        if (card.quantity > 1) {
                            return await int.reply(funcs.createEmbed("Invalid Quantity", `You can only withdraw ONE of \`${card.card_id}\` per trade\nUse: \`${card.card_id}\` instead of \`${card.quantity}x${card.card_id}\``, true));
                        }
                    }
                    const seenIds = new Set();
                    for (const card of pCards) {
                        if (seenIds.has(card.card_id)) {
                            return await int.reply(funcs.createEmbed("Duplicate Cards", `You can NOT withdraw x\`${card.card_id}\`\nOnly ONE of this ID can be used at once`, true));
                        }
                        seenIds.add(card.card_id);

                        const userCard = userCards.find(uc => uc.CardID === card.card_id);
                        if (!userCard || userCard.Total < card.quantity) {
                            return await int.reply(funcs.createEmbed("Not Enough", `You don't have x${card.quantity} \`${card.card_id}\``, true));
                        }
                        for (let i = 0; i < card.quantity; i++) cardsToGive.push(card.card_id)
                    }
                }
                await int.reply(funcs.createEmbed("Withdraw Started", `Inviting: \`${dBase.username.getFromUID(int.user.id)}\` for withdrawal\nYou have 30 seconds to accept the invite`, false));

                await req.getToken();
                const WsConnection = await new Trading(req.Info.IDToken!).getWS();
                await req.inviteUser(dBase.username.getFromUID(int.user.id)!);

                const tradeResult = await req.listenQueue(req.Info.AccessToken!, req.Info.BotUID!, async (data: any) => {
                    if (data && data.roomId) {
                        const roomId = data.roomId, amHosting = data.isHost;
                        return await new Trading(req.Info.IDToken!).trade({ amHosting, tradeId: roomId }, WsConnection, int.user.id, cardsToGive, true, false);
                    }
                }, 500, 30000);
                WsConnection.close();

                if (typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked" && args.cards) {
                    req.releaseToken();
                    for (const card of funcs.parseCards(args.cards)) {
                        dBase.cards.remove(int.user.id, card.card_id, card.quantity);
                        const cardInfo = db.prepare("SELECT name, rating, position, color FROM madfut27cards WHERE id = ?").get(card.card_id) as any;
                        given.push({
                            rating: cardInfo?.rating || 0,
                            text: cardInfo ? `x\`${card.quantity}\` ${cardInfo.rating} ${cardInfo.name} (${cardInfo.position}, \`${String(cardInfo.color).toUpperCase()}\`)` : `x\`${card.quantity}\` Unknown Card`
                        });
                    }
                    given.sort((a, b) => b.rating - a.rating);
                    await sendPaged(int, funcs, "Withdraw Complete", given.map(g => g.text), "Nothing Given..");
                }
                else {
                    req.releaseToken();
                    const errors: Record<string, string> = {
                        "UserLeft": "You left the trade..\nI have left the trade and wont reinvite",
                        "No Interaction": "You didn't interact with the trade..\nI have left the trade and wont reinvite",
                        "Cheater": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                        "Spam": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                        "Trade Error": `Your trade didn't work due to an error\nWe have NOT removed any items`,
                        "TimeOut": `You took too long to accept the invite..\nI have now removed the invite`,
                    };
                    const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                    await int.followUp(funcs.createEmbed("Withdraw Stopped", errorMsg));
                }
            }
        } 
        catch (e) {
            console.error(e);
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
        finally {
            new Functions().lock.remove(int.user.id);
        }
    }
}