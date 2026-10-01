import { CommandInteraction } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import MADFUTDB from '../../Database.js';
import { Functions } from '../../Functions.js';

export default class StarterPack extends Command {
    constructor() {
        super(
            'starter-pack',
            'Claim your starter pack..',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            if (dBase.rewards.get(int.user.id) > 0) return await int.reply(funcs.createEmbed("Already Claimed", "Sorry mate, you have claimed already\nYou can NOT claim again", true));

            dBase.trades.add(int.user.id, 5);
            dBase.rewards.set(int.user.id, 1);

            return await int.reply(funcs.createEmbed("Starter Pack Claimed!", `Reward: 5 Free Bot Trades\nThank you for using our bot!`));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}