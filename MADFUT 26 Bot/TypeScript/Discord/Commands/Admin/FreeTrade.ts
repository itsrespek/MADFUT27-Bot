import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import { Functions } from '../../../Functions.js';
import { Trading } from '../../../MADFUT/Trading.js';
import MADFUTDB from '../../../Database.js';
import { Requests } from '../../../MADFUT/Requests.js';
import { sendPaged } from '../../Helpers/Pages.js';

export default class FreeTrade extends Command {
    constructor() {
        super(
            'freetrade',
            '[ADMIN]: Free trades..',
            [
                { name: 'username', description: 'Who?', type: ApplicationCommandOptionType.String, required: true },
                { name: 'amount', description: 'How Many Trades?', type: ApplicationCommandOptionType.Integer, required: true },
                { name: 'wishlist', description: 'Wishlist | Yes Or No?', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { amount: number, username: string, wishlist?: boolean }) {
        try {
            const funcs = new Functions(), req = new Requests(), dBase = new MADFUTDB(), db = dBase['db'] as any, wishlist = args.wishlist ?? true, gCards = new Map()
            await int.reply(funcs.createEmbed("FreeTrade Started", `Username: \`${args.username.toLowerCase()}\`\nTrades: \`0/${args.amount}\`\n---\nWishlist: \`${wishlist}\``, false));

            let tradesDone = 0;
            while (tradesDone < args.amount) {
                await req.getToken();
                const WsConnection = await new Trading(req.Info.IDToken!).getWS();
                await req.inviteUser(args.username.toLowerCase());
    
                const tradeResult = await req.listenQueue(req.Info.AccessToken!, req.Info.BotUID!,
                    async (data: any) => {
                        if (data && data.roomId) {
                            const roomId = data.roomId, amHosting = data.isHost;
                            return await new Trading(req.Info.IDToken!).trade({ amHosting, tradeId: roomId }, WsConnection, int.user.id, true, true, false);
                        }
                    }, 500, 30000);
                    WsConnection.close();
                
                if (typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked") {
                    req.releaseToken();
                    tradesDone++;
                    if (tradeResult.Given?.Cards && Array.isArray(tradeResult.Given.Cards)) {
                        for (const card of tradeResult.Given.Cards) {
                            if (card) {
                                const c = db.prepare("SELECT name, rating, position, color FROM madfut27cards WHERE id = ?").get(card) as any;
                                const key = c ? `${c.name}|${c.rating}|${c.position}|${c.color}` : `Unknown Card|?|Unknown|Unknown`;
                                gCards.set(key, (gCards.get(key) || 0) + 1);
                            }
                        }
                    }
                    
                    await int.editReply(funcs.createEmbed("FreeTrade Running", `Username: \`${args.username.toLowerCase()}\`\nTrades: \`${tradesDone}/${args.amount}\`\n---\nWishlist: \`${wishlist}\``, false));
                } 
                else {
                    req.releaseToken();
                    const errors: Record<string, string> = {
                        "InvalidUsername": `Username: \`${args.username}\` is NOT a valid MADFUT username!\nPlease check your spelling and try again`,
                        "No Interaction": `\`${args.username}\` didn't interact with the trade..\nI have left the trade`,
                        "UserLeft": `\`${args.username}\` left the trade..\nI have now removed the invite`,
                        "Cheater": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                        "Spam": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                        "TimeOut": `You took too long to accept the invite..\nI have now removed the invite`,
                        "Trade Error": `Your trade didn't work due to an error\nPlease try and use this command again`
                    };
                    const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                    await int.followUp(funcs.createEmbed("FreeTrade Stopped", errorMsg));
                    break;
                }
            }
            
            if (tradesDone >= args.amount) {
                await int.editReply(funcs.createEmbed("FreeTrade Completed", `Username: \`${args.username.toLowerCase()}\` has finished\nTrades: \`${tradesDone}\`\n---\nWishlist: \`${wishlist}\``, false));

                const lines: { rating: number, text: string }[] = [];
                for (const [key, count] of gCards) {
                    const [name, rating, position, color] = key.split("|");
                    lines.push({ rating: parseInt(rating) || 0, text: rating ? `x${count} ${rating} ${name} (${position}, ${String(color).toUpperCase()})` : `x${count} ${name} (${position})` });
                }
                lines.sort((a, b) => b.rating - a.rating);
                await sendPaged(int, funcs, "FreeTrade: Given", lines.map(l => l.text));
            }
        } 
        catch (e: any) {
            console.error(e);
            await int.followUp(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}