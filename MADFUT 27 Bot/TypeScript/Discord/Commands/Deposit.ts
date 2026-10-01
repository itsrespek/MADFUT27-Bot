import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import { Functions } from '../../Functions.js';
import { Trading } from '../../MADFUT/Trading.js';
import MADFUTDB from '../../Database.js';
import { Requests } from '../../MADFUT/Requests.js';

export default class Deposit extends Command {
    constructor() {
        super(
            'deposit',
            'Deposit cards to your wallet..',
            [
                { name: 'amount', description: 'How Many Trades?', type: ApplicationCommandOptionType.Integer, required: true }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { amount: number }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = (dBase as any)['db'], req = new Requests(), depositedCards = new Map();

            if (!funcs.isLinked(int)) return;
            if (args.amount <= 0) return await int.reply(funcs.createEmbed("Invalid Amount", "Amount must be greater than 0", true));
            if (args.amount > 5) return await int.reply(funcs.createEmbed("Too Many Trades", `Sorry, the maximum amount is 5\nYou tried ${args.amount} deposit invites`, true));
            if (funcs.lock.has(int.user.id)) return await int.reply(funcs.createEmbed("Transaction In Progress", "You already have a transaction going\nPlease wait for it to finish first", true));
            funcs.lock.add(int.user.id);

            let tradesDone = 0;
            await int.reply(funcs.createEmbed("Deposit Started", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nTrades: \`0/${args.amount}\``, false));
            
            while (tradesDone < args.amount) {
                await req.getToken();
                const WsConnection = await new Trading(req.Info.IDToken!).getWS();
                await req.inviteUser(dBase.username.getFromUID(int.user.id)!)

                const tradeResult = await req.listenQueue(req.Info.AccessToken!, req.Info.BotUID!, async (data: any) => {
                    if (data && data.roomId) {
                        const roomId = data.roomId, amHosting = data.isHost;
                        return await new Trading(req.Info.IDToken!).trade({ amHosting, tradeId: roomId }, WsConnection, int.user.id, false, false, true); //cards, withdraw?, deposit?
                    }
                }, 500, 30000);
                WsConnection.close();

                if (typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked") {
                    req.releaseToken();
                    tradesDone++;
                    if (tradeResult.Received?.Cards && Array.isArray(tradeResult.Received.Cards)) {
                        for (const card of tradeResult.Received.Cards) {
                            const cardInfo = typeof card === 'string' ? db.prepare("SELECT name, rating, position, color FROM madfut27cards WHERE id = ?").get(card) as any : null;
                            if (!cardInfo) continue;
                            dBase.cards.add(int.user.id, card, 1);
                            const key = `${cardInfo.name}|${cardInfo.rating}|${cardInfo.position}|${cardInfo.color}`;
                            depositedCards.set(key, (depositedCards.get(key) || 0) + 1);
                        }
                    }
                    
                    await int.editReply(funcs.createEmbed("Deposit Started", `Username: \`${dBase.username.getFromUID(int.user.id)}\`\nTrades: \`${tradesDone}/${args.amount}\``, false));
                }
                else {
                    req.releaseToken();
                    const errors: Record<string, string> = {
                        "WastingDepositTime": "I have left the trade..\nYou did NOT give me any cards\nStop wasting my time",
                        "UserLeft": "You left the trade..\nI have left the trade and wont reinvite",
                        "No Interaction": "You didn't interact with the trade..\nI have left the trade and wont reinvite",
                        "Cheater": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                        "Spam": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                        "Trade Error": `Your trade didn't work due to an error\nWe have NOT removed any items`,
                        "TimeOut": `You took too long to accept the invite..\nI have now removed the invite`,
                    };
                    const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                    await int.followUp(funcs.createEmbed("Deposit Stopped", errorMsg));
                    break;
                }
            }
            
            if (tradesDone >= args.amount) {
                await int.editReply(funcs.createEmbed("Deposit Completed", `Username: \`${dBase.username.getFromUID(int.user.id)}\` has finished\nTrades: \`${tradesDone}\``, false));

                const depositLines: { rating: number, text: string }[] = [];
                for (const [key, count] of depositedCards) {
                    const [name, rating, position, color] = key.split("|");
                    depositLines.push({ rating: parseInt(rating) || 0, text: `x${count} ${rating} ${name} (${position}, ${String(color).toUpperCase()})` });
                }
                depositLines.sort((a, b) => b.rating - a.rating);
                const depositSummary = depositLines.map(l => l.text).join("\n");
                
                await int.followUp(funcs.createEmbed("Deposit: Received", `Total Cards Deposited: ${Array.from(depositedCards.values()).reduce((sum, count) => sum + count, 0)}\n\n${depositSummary || "No Cards Received"}`));
            }
        } 
        catch (e) {
            console.error(e);
            await int.followUp(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
        finally {
            new Functions().lock.remove(int.user.id);
        }
    }
}