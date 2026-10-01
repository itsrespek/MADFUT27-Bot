import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import { Functions } from '../../Functions.js';
import { Trading } from '../../MADFUT/Trading.js';
import MADFUTDB from '../../Database.js';
import { Requests } from '../../MADFUT/Requests.js';
import { sendPaged } from '../Helpers/Pages.js';

export default class WithdrawAll extends Command {
    constructor() {
        super(
            'withdraw-all',
            'Withdraw EVERYTHING from your wallet..',
            [
                { name: 'bot-trades', description: 'Withdraw ALL Your Trades?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'cards', description: 'Withdraw ALL Your Cards?', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { 'bot-trades'?: boolean, cards?: boolean }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = (dBase as any)['db'], req = new Requests(), given: { rating: number, text: string }[] = [];
            const gCards = new Map();
            const errors: Record<string, string> = {
                "UserLeft": "You left the trade..\nI have left the trade and wont reinvite",
                "No Interaction": "You didn't interact with the trade..\nI have left the trade and wont reinvite",
                "Cheater": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                "Spam": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                "Trade Error": "Your trade didn't work due to an error\nWe have NOT removed any items",
                "TimeOut": "You took too long to accept the invite..\nI have now removed the invite",
            };

            if (!funcs.isLinked(int)) return;
            if (!args['bot-trades'] && !args.cards) return await int.reply(funcs.createEmbed("Missing Option", "You MUST pick either: 'Bot-Trades OR Cards'", true));
            if (args['bot-trades'] && args.cards) return await int.reply(funcs.createEmbed("Too Many Options", "You can only pick ONE option: 'Bot-Trades OR Cards'", true));

            if (funcs.lock.has(int.user.id)) return await int.reply(funcs.createEmbed("Transaction In Progress", "You already have a transaction going\nPlease wait for it to finish first", true));
            funcs.lock.add(int.user.id);

            if (args['bot-trades']) {
                let totalTrades = dBase.trades.get(int.user.id), tradesDone = 0;
                if (!totalTrades || totalTrades <= 0) return await int.reply(funcs.createEmbed("Nothing To Withdraw", "You don't have ANY trades in your wallet", true));

                await int.reply(funcs.createEmbed("Withdraw All Started", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nTrades Left: \`${totalTrades.toLocaleString()}\``, false));

                while ((totalTrades = dBase.trades.get(int.user.id)) > 0) {
                    await req.getToken();
                    const WsConnection = await new Trading(req.Info.IDToken!).getWS();
                    await req.inviteUser(dBase.username.getFromUID(int.user.id)!);

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
                        await int.editReply(funcs.createEmbed("Withdraw All Running", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nTrades Left: \`${dBase.trades.get(int.user.id).toLocaleString()}\``, false));
                    }
                    else {
                        req.releaseToken();
                        const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                        await int.followUp(funcs.createEmbed("Withdraw All Stopped", errorMsg));
                        return;
                    }
                }

                const lines: { rating: number, text: string }[] = [];
                for (const [key, count] of gCards) {
                    const [name, rating, position, color] = key.split("|");
                    lines.push({ rating: parseInt(rating) || 0, text: rating ? `x${count} ${rating} ${name} (${position}, ${String(color).toUpperCase()})` : `x${count} ${name} (${position})` });
                }
                lines.sort((a, b) => b.rating - a.rating);
                await int.editReply(funcs.createEmbed("Withdraw All Completed", `Username: \`${dBase.username.getFromUID(int.user.id)}\` has finished\nTrades: \`${tradesDone.toLocaleString()}\``, false));
                await sendPaged(int, funcs, "Withdraw All: Given", lines.map(l => l.text));
                return;
            }

            if (args.cards) {
                let userCards = dBase.cards.getAll(int.user.id);
                if (!userCards || userCards.length === 0) return await int.reply(funcs.createEmbed("Nothing To Withdraw", "You don't have ANY cards in your wallet", true));

                await int.reply(funcs.createEmbed("Withdraw All Started", `Inviting: \`${dBase.username.getFromUID(int.user.id)}\` for withdrawal\nYou have 30 seconds to accept the invite\nCards Left: \`${userCards.length.toLocaleString()}\``, false));

                while ((userCards = dBase.cards.getAll(int.user.id)) && userCards.length > 0) {
                    const seenIds = new Set(), cardsToGive: string[] = [];
                    for (const uc of userCards) {
                        if (!seenIds.has(uc.CardID)) {
                            seenIds.add(uc.CardID);
                            cardsToGive.push(String(uc.CardID));
                        }
                        if (cardsToGive.length >= 3) break;
                    }

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

                    if (typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked") {
                        req.releaseToken();
                        for (const cardId of cardsToGive) {
                            dBase.cards.remove(int.user.id, cardId, 1);
                            const cardInfo = db.prepare("SELECT name, rating, position, color FROM madfut27cards WHERE id = ?").get(cardId) as any;
                            given.push({
                                rating: cardInfo?.rating || 0,
                                text: cardInfo ? `\`${cardInfo.rating}\` ${cardInfo.name} (${cardInfo.position}, ${String(cardInfo.color).toUpperCase()})` : `\`Unknown Card\``
                            });
                        }
                        await int.editReply(funcs.createEmbed("Withdraw All Running", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nCards Left: \`${dBase.cards.getAll(int.user.id).length.toLocaleString()}\``, false));
                    }
                    else {
                        req.releaseToken();
                        const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                        await int.followUp(funcs.createEmbed("Withdraw All Stopped", errorMsg));
                        return;
                    }
                }

                await int.editReply(funcs.createEmbed("Withdraw All Completed", `Username: \`${dBase.username.getFromUID(int.user.id)}\` has finished\nCards Given: \`${given.length.toLocaleString()}\``, false));
                given.sort((a, b) => b.rating - a.rating);
                await sendPaged(int, funcs, "Withdraw All: Given", given.map(g => g.text), "Nothing Given..");
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