import { CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';
import { getPackName } from '../../Helpers/Packs.js';

export default class Restock extends Command {
    constructor() {
        super(
            'restock',
            '[STAFF]: Claim your weekly restock..',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), database = (dBase as any)['db']; if (!funcs.isLinked(int)) return;
            if (dBase.staff.get(int.user.id) > 0) return await int.reply(funcs.createEmbed("Already Claimed", "Sorry mate, you have claimed already\nYou can NOT claim again yet", true));

            const rewards: string[] = [], packPool = ["bronze", "silver", "gold", "totw"], bonusPack = packPool[Math.floor(Math.random() * packPool.length)];

            dBase.trades.add(int.user.id, 35);
            dBase.coins.add(int.user.id, 3000000);
            dBase.packTokens.add(int.user.id, 1);
            dBase.picks.add(int.user.id, 2);
            dBase.packs.add(int.user.id, 'random', 1);
            dBase.packs.add(int.user.id, bonusPack, 1);

            rewards.push("`35` Bot Trades", "`3,000,000` Coins", "`1x` Custom Pack Token", "`2x` Player Picks", "`1x` 100% Random Pack", `\`1x\` ${getPackName(bonusPack)} Pack`);

            for (const card of database.prepare("SELECT id FROM madfut27cards WHERE tradable = 1 ORDER BY RANDOM() LIMIT 9").all() as { id: string }[]) {
                const amount = Math.floor(Math.random() * 8) + 1;
                dBase.cards.add(int.user.id, card.id, amount);

                const cardInfo = database.prepare("SELECT name, rating, color FROM madfut27cards WHERE id = ?").get(card.id) as any;
                rewards.push(`\`x${amount}\` ${cardInfo.rating} ${cardInfo.name} (${(cardInfo.color || 'Unknown').toUpperCase()})`);
            }

            dBase.staff.set(int.user.id, 1);

            return await int.reply(funcs.createEmbed("Restock Claimed!", `Rewards:\n${rewards.join("\n")}`));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
