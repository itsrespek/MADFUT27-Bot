import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import { Functions } from '../../../Functions.js';
import MADFUTDB from '../../../Database.js';

export default class Set extends Command {
    constructor() {
        super(
            'set',
            '[STAFF]: Set cards to be tradable or untradable',
            [
                { name: 'id', description: 'What ID?', type: ApplicationCommandOptionType.String, required: true },
                { name: 'tradable', description: 'True: Can be traded | False: Can\'t be traded', type: ApplicationCommandOptionType.Boolean, required: true }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { id: string, tradable: boolean }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), db = dBase['db'] as any, card = db.prepare("SELECT name, rating, tradable FROM madfut27cards WHERE id = ?").get(args.id) as any;
            if (!card) return await int.reply(funcs.createEmbed("Card Not Found", `No card found with ID: \`${args.id}\``, true));

            db.prepare("UPDATE madfut27cards SET tradable = ? WHERE id = ?").run(args.tradable ? 1 : 0, args.id);
            await int.reply(funcs.createEmbed("Tradable Status Updated", `Card: \`${card.name}\`\nRating: \`${card.rating}\`\nID: \`${args.id}\`\nTradable: \`${args.tradable ? 'Yes' : 'No'}\`\n\n*Changed from: \`${card.tradable ? 'Yes' : 'No'}\`*`, false));
        }
        catch(e) {
            console.log(e);
            await int.reply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}