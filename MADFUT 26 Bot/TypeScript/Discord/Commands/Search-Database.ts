import { ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import MADFUTDB from '../../Database.js';
import { Functions } from '../../Functions.js';

export default class SearchDB extends Command {
    constructor() {
        super(
            'searchdb',
            'Search MADFUT database..',
            [
                { name: 'query', description: 'What? (ID OR Name)', type: ApplicationCommandOptionType.String, required: true, autocomplete: true }
            ]
        );
    }

    async complete(c: DiscordClient, int: AutocompleteInteraction, args: any, focusedInput: string) {
        try {
            const dBase = new MADFUTDB(), db = dBase['db'] as any;
            const cds = db.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE name LIKE ? ORDER BY rating DESC LIMIT 25").all(`%${focusedInput}%`) as { id: string; name: string; rating: number; color: string }[];
            await int.respond(cds.map(card => ({ name: `${card.rating} | ${card.name} | ${card.color.toUpperCase()}`, value: card.id })));
        } 
        catch (e) {
            console.error(e);
        }
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { query: string }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), db = dBase['db'] as any;
            await int.deferReply();

            const card = db.prepare(`SELECT id, name, rating, position, baseId, altPositions, color, clubId, leagueId, nationId, url, man, tradable, inTokens, inPicks, premiumChem, totwNumber, packable, date, PAC, SHO, PAS, DRI, DEF, PHY, attack, control, defense, itemId FROM madfut27cards WHERE id = ?`).get(args.query) as any;
            const stats = `PAC: \`${card.PAC}\` | SHO: \`${card.SHO}\` | PAS: \`${card.PAS}\`\nDRI: \`${card.DRI}\` | DEF: \`${card.DEF}\` | PHY: \`${card.PHY}\`\nATT: \`${card.attack}\` | CTRL: \`${card.control}\` | DEF: \`${card.defense}\``;
            await int.editReply(funcs.createEmbed("Card Found", `Name: \`${card.name}\`\nRating: \`${card.rating}\`\nType: \`${card.color.toUpperCase()}\`\nMain Position: \`${card.position}\`\nAlt Position: \`${card.altPositions || 'None'}\`\nTradable? \`${card.tradable ? 'Yes' : 'No'}\`\n\nStats:\n${stats}`));
        }
        catch (e) {
            console.error(e);
            await int.editReply(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e)));
        }
    }
}