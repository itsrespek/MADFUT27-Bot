import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import { Functions } from "../../../Functions.js";
import MADFUTDB from "../../../Database.js";

export default class ManageUsers extends Command {
    constructor() {
        super(
            "manage-users",
            "[DEV]: Manage Users",
            [
                { name: 'action', description: 'Blacklist or Whitelist?', type: ApplicationCommandOptionType.String, required: true,choices: [{ name: 'Check', value: 'check' }, { name: 'Blacklist', value: 'blacklist' }, { name: 'Whitelist', value: 'whitelist' }]},
                { name: 'user', description: 'Who?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'reason', description: 'Why?', type: ApplicationCommandOptionType.String, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: ChatInputCommandInteraction, args: { action: string, user: any, reason?: string }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB();
            if (args.action === 'blacklist') {
                if (dBase.security.isBanned(args.user)) {
                    return await int.reply(funcs.createEmbed("Already Blacklisted", `User: <@${args.user}>\nBan Reason: ${dBase.security.getBanReason(args.user) || "None"}\n\nThey are already bot banned`, true));
                }
                dBase.security.ban(args.user, args.reason || "No Reason");
                await int.reply(funcs.createEmbed("User Blacklisted", `User: <@${args.user}>\nReason: ${args.reason || "No Reason"}\n\nThey have been banned from the bot`, true));

            } 
            else if (args.action === 'whitelist') {
                if (!dBase.security.isBanned(args.user)) {
                    return await int.reply(funcs.createEmbed("Not Blacklisted", `<@${args.user}> is NOT blacklisted`));
                }
                await int.reply(funcs.createEmbed("User Whitelisted", `User: <@${args.user}>\nPrevious Ban Reason: ${dBase.security.getBanReason(args.user) || "None"}\n\nThey have now been unbanned`, true));
                dBase.security.unban(args.user);
            }
            else if (args.action === 'check') {
                const isBanned = dBase.security.isBanned(args.user);
                const banReason = dBase.security.getBanReason(args.user);
                
                if (isBanned) {
                    await int.reply(funcs.createEmbed("User Status: Banned", `User: <@${args.user}>\nBan Reason: ${banReason}`, true));
                } 
                else {
                    await int.reply(funcs.createEmbed("User Status: NOT Banned", `User: <@${args.user}>\nStatus: Not Banned\nThey can use the bot normally`, true));
                }
            }
        } 
        catch (e) {
            console.error(e);
            await int.reply(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}