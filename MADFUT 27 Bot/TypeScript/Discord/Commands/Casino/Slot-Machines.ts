import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';

const SYMBOLS = [
    { emoji: '🍒', weight: 30, triple: 3 },
    { emoji: '🍋', weight: 25, triple: 4 },
    { emoji: '🔔', weight: 18, triple: 6 },
    { emoji: '⭐', weight: 12, triple: 10 },
    { emoji: '💎', weight: 9, triple: 25 },
    { emoji: '💀', weight: 6, triple: 0 }
];

export default class SlotMachines extends Command {
    constructor() {
        super(
            'slot-machines',
            'Spin the slot machines..',
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

            const spin = () => { const r = Math.random() * 100; let acc = 0; for (const s of SYMBOLS) { acc += s.weight; if (r < acc) return s; } return SYMBOLS[SYMBOLS.length - 1]; };
            const reels = [spin(), spin(), spin()], multMap = new Map(SYMBOLS.map(s => [s.emoji, s.triple]));
            let mult = 0;

            if (reels[0].emoji === reels[1].emoji && reels[1].emoji === reels[2].emoji) mult = multMap.get(reels[0].emoji)!;
            else if (reels[0].emoji === reels[1].emoji || reels[1].emoji === reels[2].emoji || reels[0].emoji === reels[2].emoji) mult = 1.5;

            const winnings = Math.floor(args.amount * mult);
            if (winnings > 0) wallet.add(uid, winnings);

            const outcome = winnings >= args.amount * 2 ? "BIG WIN!" : winnings > 0 ? "You won!" : mult === 1.5 ? "Close one.." : "You lost..";
            return await int.reply(funcs.createEmbed("Slot Machines", `${reels.map(r => r.emoji).join(' | ')} | \n\n${outcome}\nBet: \`${args.amount.toLocaleString()}\` ${args.currency === 'coins' ? 'Coins' : 'Bot Trades'}\n${winnings > 0 ? `Won: \`${winnings.toLocaleString()}\`` : `Lost: \`${args.amount.toLocaleString()}\``}`));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
