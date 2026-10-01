import { CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import { Functions } from '../../../Functions.js';
import { getCurrentBotGiveaway } from '../../Helpers/BotGiveaways.js';

export default class ForceEndBGW extends Command {
    constructor() {
        super(
            'force-end-bgw',
            '[ADMIN]: Force stop a bot giveaway..',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const funcs = new Functions(), state = getCurrentBotGiveaway();
            if (!state || state.phase === 'ended') return await int.reply(funcs.createEmbed("Nothing Running", "There's no active bot giveaway..", true));

            state.forceStopped = true;
            if (state.startTimer) {
                clearTimeout(state.startTimer);
                state.startTimer = undefined;
            }

            await int.reply(funcs.createEmbed("Bot Giveaway: Force Stopped", `All trades from the bot have been stopped..\nStats will be posted shortly`, true));
            state.onForce?.();
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
