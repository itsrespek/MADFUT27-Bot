import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import Command from "../Helpers/Layout/CMDs.js";
import DiscordClient from "../Client.js";
import { Functions, claimGiveaways } from "../../Functions.js";
import { Requests } from "../../MADFUT/Requests.js";
import { Trading } from "../../MADFUT/Trading.js";
import MADFUTDB from "../../Database.js";
import { claimInvites } from "../Helpers/Automatic/Invites.js";
import { claimMessages } from "../Helpers/Automatic/Messages.js";
import { claimLevelRewards } from "../Helpers/Automatic/Level.js";
import { GuildMember } from "discord.js";

export default class Link extends Command {
    constructor() {
        super(
            "link", 
            "Link your MADFUT account..", [
                {
                    name: "username", description: "What Username?", type: ApplicationCommandOptionType.String, required: true,
                },
            ]
        );
    }
    async run(c: DiscordClient, int: CommandInteraction, args: { username: string }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), req = new Requests();

            if (dBase.username.getFromUID(int.user.id)) return await int.reply(funcs.createEmbed("Already Linked", `You're already linked to: \`${dBase.username.getFromUID(int.user.id)}\`!`));
            if (dBase.username.getUIDFromUsername(args.username.toLowerCase())) return await int.reply(funcs.createEmbed("Username Already Used", `Username: \`${args.username.toLowerCase()}\` is already linked to <@${dBase.username.getUIDFromUsername(args.username.toLowerCase())}>!`));
            if (funcs.lock.has(int.user.id)) return await int.reply(funcs.createEmbed("Transaction In Progress", "You already have a transaction going\nPlease wait for it to finish first", true));
            funcs.lock.add(int.user.id);

            await int.reply(funcs.createEmbed("Link Account", `Invited: \`${args.username}\` x\`1\` on MADFUT 27\nYou have 30 seconds to accept the invite` ))
            await req.getToken();

            const WsConnection = await new Trading(req.Info.IDToken!).getWS();
            await req.inviteUser(args.username.toLowerCase());
            const tradeResult = await req.listenQueue(req.Info.AccessToken!, req.Info.BotUID!,
                async (data: any) => {
                    if (data && data.roomId) {
                        const roomId = data.roomId, amHosting = data.isHost;
                        return await new Trading(req.Info.IDToken!).trade({ amHosting, tradeId: roomId }, WsConnection, int.user.id, false, true, false);
                    }
                }, 500, 30000);

            if (typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked") {
                req.releaseToken();
                dBase.username.set(int.user.id, args.username.toLowerCase());
                const pInvites = claimInvites(int.user.id), pMessages = claimMessages(int.user.id), pGiveaways = claimGiveaways(int.user.id), pLevels = claimLevelRewards(int.member as GuildMember);
    
                let m = `You have been linked to: \`${args.username.toLowerCase()}\``;
                if (pInvites) m += `\n\n${pInvites}`; if (pMessages) m += `\n\n${pMessages}`; if (pGiveaways) m += `\n\n${pGiveaways}`; if (pLevels) m += `\n\n${pLevels}`;

                await int.followUp(funcs.createEmbed("Successfully Linked", m));
            }
            else {
                req.releaseToken();
                const errors: Record<string, string> = {
                    "InvalidUsername": `Username: \`${args.username}\` is NOT a valid MADFUT username!\nPlease check your spelling and try again`,
                    "No Interaction": `\`${args.username}\` didn't interact with the trade..\nWe have NOT linked your account`,
                    "UserLeft": `\`${args.username}\` left the trade..\nWe have NOT linked your account`,
                    "Cheater": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                    "Spam": "Hahaha.. you tried it\nYou have been bot banned for trying to exploit",
                    "TimeOut": `\`${args.username}\` took too long to accept the invite..\nWe have NOT linked your account`,
                    "Trade Error": `Your trade didn't work due to an error\nWe have NOT linked your account`
                };
                const errorMsg = errors[tradeResult.MSG] || "Error..\nPlease report this to mxltple";
                await int.followUp(funcs.createEmbed("Link Stopped", errorMsg));
            }
        } 
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
        finally {
            new Functions().lock.remove(int.user.id);
        }
    }
}
