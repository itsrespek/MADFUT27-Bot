import { CommandInteraction } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import MADFUTDB from '../../Database.js';
import { Functions } from '../../Functions.js';

export default class Unlink extends Command {
    constructor() {
        super(
            'unlink',
            'Unlink your MADFUT account..',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions()
            if (dBase.username.getFromUID(int.user.id) === null) return await int.reply(funcs.createEmbed("Not Linked", "You don't have a MADFUT account linked"));

            dBase.username.set(int.user.id, null)
            return await int.reply(funcs.createEmbed("MADFUT Unlink", `Your MADFUT account has been unlinked\nThank you for using the bot!`));
        } 
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}