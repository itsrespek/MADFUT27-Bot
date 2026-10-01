import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';

export default class RollADice extends Command {
    constructor() {
        super(
            'roll-a-dice',
            'Roll the dice against the house.. | Winner takes x2, Tie refunds',
            [
                { name: 'currency', description: 'What do you bet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Coins', value: 'coins' }, { name: 'Bot Trades', value: 'trades' }] },
                { name: 'amount', description: 'How much do you bet?', type: ApplicationCommandOptionType.Integer, required: true }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { currency: 'coins' | 'trades', amount: number }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            const uid = String(int.user.id), wallet = args.currency === 'coins' ? dBase.coins : dBase.trades;

            if (!Number.isInteger(args.amount) || args.amount <= 0) return await int.reply(funcs.createEmbed("Invalid Bet", "You MUST bet an amount above `0`", true));
            const bal = wallet.get(uid);
            if (bal < args.amount) return await int.reply(funcs.createEmbed("Not Enough", `You can only bet what you have..\n${args.currency === 'coins' ? 'Coins' : 'Bot Trades'} Total: \`${bal.toLocaleString()}\`/\`${args.amount.toLocaleString()}\``, true));

            wallet.remove(uid, args.amount);

            const roll = () => [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
            const yours = roll(), houses = roll(), yourSum = yours[0] + yours[1], houseSum = houses[0] + houses[1];

            let winnings = 0, outcome: string;
            if (yourSum > houseSum) { winnings = args.amount * 2; outcome = `You win! Payout: \`${winnings.toLocaleString()}\``; }
            else if (yourSum === houseSum) { winnings = args.amount; outcome = "Tie! Your bet was refunded"; }
            else outcome = "House wins..";

            if (winnings > 0) wallet.add(uid, winnings);

            return await int.reply(funcs.createEmbed("Roll-A-Dice", `You rolled: ${yours[0]} + ${yours[1]} = \`${yourSum}\`\nHouse rolled: ${houses[0]} + ${houses[1]} = \`${houseSum}\`\nBet: \`${args.amount.toLocaleString()}\` ${args.currency === 'coins' ? 'Coins' : 'Bot Trades'}\n\n${outcome}`));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
