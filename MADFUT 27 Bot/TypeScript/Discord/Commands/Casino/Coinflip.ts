import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';

export default class Coinflip extends Command {
    constructor() {
        super(
            'coinflip',
            'Flip a coin against the house.. | Winner takes x2',
            [
                { name: 'currency', description: 'What do you bet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Coins', value: 'coins' }, { name: 'Bot Trades', value: 'trades' }] },
                { name: 'amount', description: 'How much do you bet?', type: ApplicationCommandOptionType.Integer, required: true },
                { name: 'side', description: 'What does the coin land on?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' }] }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { currency: 'coins' | 'trades', amount: number, side: 'heads' | 'tails' }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            const uid = String(int.user.id), wallet = args.currency === 'coins' ? dBase.coins : dBase.trades;

            if (!Number.isInteger(args.amount) || args.amount <= 0) return await int.reply(funcs.createEmbed("Invalid Bet", "You MUST bet an amount above `0`", true));
            const bal = wallet.get(uid);
            if (bal < args.amount) return await int.reply(funcs.createEmbed("Not Enough", `You can only bet what you have..\n${args.currency === 'coins' ? 'Coins' : 'Bot Trades'} Total: \`${bal.toLocaleString()}\`/\`${args.amount.toLocaleString()}\``, true));

            wallet.remove(uid, args.amount);

            const flip = Math.random() < 0.5 ? 'heads' : 'tails';
            let winnings = 0, outcome: string;
            if (flip === args.side) { winnings = args.amount * 2; outcome = `You win! Payout: \`${winnings.toLocaleString()}\``; }
            else outcome = "House wins..";

            if (winnings > 0) wallet.add(uid, winnings);

            return await int.reply(funcs.createEmbed("Coinflip", `Your call: \`${args.side === 'heads' ? 'Heads' : 'Tails'}\`\nThe coin landed on: \`${flip === 'heads' ? 'Heads' : 'Tails'}\`\nBet: \`${args.amount.toLocaleString()}\` ${args.currency === 'coins' ? 'Coins' : 'Bot Trades'}\n\n${outcome}`));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
