import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import { Functions, claimGiveaways } from "../../../Functions.js";
import MADFUTDB from "../../../Database.js";
import { claimInvites } from "../../Helpers/Automatic/Invites.js";
import { claimMessages } from "../../Helpers/Automatic/Messages.js";

export default class AdminLink extends Command {
    constructor() {
        super(
            'link',
            '[ADMIN]: Force link/unlink a user',
            [
                { name: 'action', description: 'Link or Unlink?', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: 'Link', value: 'link' },
                    { name: 'Unlink', value: 'unlink' }
                ]},
                { name: 'user', description: 'Which user?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'username', description: 'What MADFUT Username? (Link only)', type: ApplicationCommandOptionType.String, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { action: 'link' | 'unlink', user: string, username?: string }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), discId = String(args.user);
            const target = c.users.cache.get(discId);
            if (target?.bot) return await int.reply(funcs.createEmbed("Admin Link Error", "You can't link a bot, stupid!\nBots don't play MADFUT..", true));

            if (args.action === 'unlink') {
                const old = dBase.username.getFromUID(discId);
                if (!old) return await int.reply(funcs.createEmbed("Not Linked", `<@${discId}> doesn't have a MADFUT account linked`, true));
                dBase.username.set(discId, null);
                return await int.reply(funcs.createEmbed("Account Force Unlinked", `Removed link: <@${discId}> was linked to: \`${old}\``));
            }

            const username = args.username?.trim().toLowerCase();
            if (!username || username.length > 30) return await int.reply(funcs.createEmbed("Invalid Name", "You MUST provide a valid MADFUT username\nUsernames MUST be between `1` and `30` characters", true));

            const holder = dBase.username.getUIDFromUsername(username);
            if (holder && holder !== discId) return await int.reply(funcs.createEmbed("Username Already Used", `Username: \`${username}\` is already linked to <@${holder}>!\nUnlink them first if you want to steal it`, true));

            const old = dBase.username.getFromUID(discId);
            if (old === username) return await int.reply(funcs.createEmbed("Already Linked", `<@${discId}> is already linked to: \`${username}\``));

            dBase.username.set(discId, username);

            let m = old ? `Replaced old link: \`${old}\`\n` : "";
            m += `Forced link: <@${discId}> is now linked to: \`${username}\`\nNo trade verification was done`;

            const pInvites = claimInvites(discId), pMessages = claimMessages(discId), pGiveaways = claimGiveaways(discId);
            if (pInvites) m += `\n\n${pInvites}`; if (pMessages) m += `\n\n${pMessages}`; if (pGiveaways) m += `\n\n${pGiveaways}`;

            return await int.reply(funcs.createEmbed("Account Force Linked", m));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
