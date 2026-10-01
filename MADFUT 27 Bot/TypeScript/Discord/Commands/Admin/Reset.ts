import { ApplicationCommandOptionType, CommandInteraction, User } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import { Functions } from '../../../Functions.js';
import MADFUTDB from '../../../Database.js';

export default class Reset extends Command {
    constructor() {
        super(
            'reset',
            '[ADMIN]: Reset cooldowns and items',
            [
                { name: 'user', description: 'Which user?', type: ApplicationCommandOptionType.User, required: true },
                { name: 'coins', description: 'Reset Coins?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'trades', description: 'Reset Trades?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'cards', description: 'Reset Cards?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'packs', description: 'Reset Packs?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'tokens', description: 'Reset Custom Pack Tokens?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'picks', description: 'Reset Player Picks?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'cooldown', description: 'Reset Daily Cooldown?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'glasses', description: 'Reset Glasses Cooldown?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'level-rewards', description: 'Reset Level Rewards?', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'staff-restock', description: 'Reset Staff Rewards?', type: ApplicationCommandOptionType.Boolean, required: false },
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { user: User, coins?: boolean, trades?: boolean, cards?: boolean, packs?: boolean, tokens?: boolean, picks?: boolean, cooldown?: boolean, glasses?: boolean, ['level-rewards']?: boolean, ['staff-restock']?: boolean }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), discId = String(args.user), reset: string[] = [];
            if (!args.coins && !args.trades && !args.cards && !args.packs && !args.tokens && !args.picks && !args.cooldown && !args.glasses && !args['level-rewards'] && !args['staff-restock']) return await int.reply(funcs.createEmbed("Missing Option", "You MUST pick either: 'coins, trades, cards or cooldown'", true));

            if (args.coins) dBase.coins.reset(discId), reset.push("Coins");
            if (args.trades) dBase.trades.reset(discId), reset.push("Bot Trades");
            if (args.cards) dBase.cards.reset(discId), reset.push("Cards");
            if (args.packs) dBase.packs.reset(discId), dBase.customPacks.resetAll(discId), reset.push("Packs");
            if (args.tokens) dBase.packTokens.reset(discId), reset.push("Custom Pack Tokens");
            if (args.picks) dBase.picks.reset(discId), reset.push("Player Picks");
            if (args.cooldown) dBase.cooldown.reset(discId), reset.push("Daily Cooldown");
            if (args.glasses) dBase.glass.reset(discId), reset.push("Glasses Cooldown");
            if (args['level-rewards']) dBase.rewardRoles.resetAll(discId), reset.push("Level Rewards");
            if (args['staff-restock']) dBase.staff.reset(discId), reset.push("Staff Restock")

            if (!reset.length) reset.push('Nothing reset..');
            await int.reply(funcs.createEmbed("Reset Complete", `Reset <@${args.user}>'s:\n${reset.join("\n")}`, false));
        }
        catch(e) {
            console.log(e);
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}