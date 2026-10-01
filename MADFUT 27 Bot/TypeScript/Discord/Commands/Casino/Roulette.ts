import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';

const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default class Roulette extends Command {
    constructor() {
        super(
            'roulette',
            'Spin the roulette wheel..',
            [
                { name: 'currency', description: 'What do you bet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Coins', value: 'coins' }, { name: 'Bot Trades', value: 'trades' }] },
                { name: 'amount', description: 'How much do you bet?', type: ApplicationCommandOptionType.Integer, required: true },
                { name: 'bet-type', description: 'What do you bet on?', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: 'Red (x2)', value: 'red' }, { name: 'Black (x2)', value: 'black' }, { name: 'Odd (x2)', value: 'odd' },
                    { name: 'Even (x2)', value: 'even' }, { name: 'Low 1-18 (x2)', value: 'low' }, { name: 'High 19-36 (x2)', value: 'high' }, { name: 'Green 0 (x36)', value: 'green' }
                ]},
                { name: 'number', description: 'Straight bet on a single number? | 0-36 Pays x36', type: ApplicationCommandOptionType.Integer, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { currency: 'coins' | 'trades', amount: number, ['bet-type']: 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'green', number?: number }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            const uid = String(int.user.id), wallet = args.currency === 'coins' ? dBase.coins : dBase.trades;

            if (!Number.isInteger(args.amount) || args.amount <= 0) return await int.reply(funcs.createEmbed("Invalid Bet", "You MUST bet an amount above `0`", true));
            if (args.number != null && (!Number.isInteger(args.number) || args.number < 0 || args.number > 36)) return await int.reply(funcs.createEmbed("Invalid Number", "Straight bets MUST be between `0` and `36`", true));

            const bal = wallet.get(uid);
            if (bal < args.amount) return await int.reply(funcs.createEmbed("Not Enough", `You can only bet what you have..\n${args.currency === 'coins' ? 'Coins' : 'Bot Trades'} Total: \`${bal.toLocaleString()}\`/\`${args.amount.toLocaleString()}\``, true));

            wallet.remove(uid, args.amount);

            const landed = Math.floor(Math.random() * 37), color = landed === 0 ? 'green' : RED.includes(landed) ? 'red' : 'black';
            let winnings = 0, played: string;

            if (args.number != null) {
                played = `Straight Bet: \`${args.number}\`${landed !== args.number ? " (Missed)" : ""}`;
                if (landed === args.number) winnings = args.amount * 36;
            }
            else {
                const type = args['bet-type'];
                played = `Type: \`${{ red: 'Red', black: 'Black', odd: 'Odd', even: 'Even', low: 'Low 1-18', high: 'High 19-36', green: 'Green 0' }[type]}\``;

                const won = (type === 'red' && color === 'red') || (type === 'black' && color === 'black') || (type === 'green' && color === 'green') ||
                    (type === 'odd' && landed % 2 === 1) || (type === 'even' && landed !== 0 && landed % 2 === 0) ||
                    (type === 'low' && landed >= 1 && landed <= 18) || (type === 'high' && landed >= 19);

                if (won) winnings = args.amount * (type === 'green' ? 36 : 2);
            }

            if (winnings > 0) wallet.add(uid, winnings);

            const outcome = winnings > 0 ? `You won! Payout: \`${winnings.toLocaleString()}\`` : "The house wins..";
            return await int.reply(funcs.createEmbed("Roulette", `The ball landed on: \`${landed}\` (${color.toUpperCase()})\n${played}\nBet: \`${args.amount.toLocaleString()}\` ${args.currency === 'coins' ? 'Coins' : 'Bot Trades'}\n\n${outcome}`));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
