import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import Command from "../Helpers/Layout/CMDs.js";
import DiscordClient from "../Client.js";
import MADFUTDB from "../../Database.js";
import { Functions } from "../../Functions.js";
import { CustomPackSize } from "../Helpers/Packs.js";

export default class CreatePack extends Command {
    constructor() {
        super(
            'create-pack',
            'Create your own pack..',
            [
                { name: 'name', description: 'What is the pack called?', type: ApplicationCommandOptionType.String, required: true },
                { name: 'min-rating', description: 'Lowest card rating?', type: ApplicationCommandOptionType.Integer, required: true },
                { name: 'max-rating', description: 'Highest card rating?', type: ApplicationCommandOptionType.Integer, required: true },
                { name: 'nation-id', description: 'Only pull this Nation ID? (Optional)', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'position', description: 'Only pull this Position? (Optional)', type: ApplicationCommandOptionType.String, required: false, choices: [
                    { name: 'GK', value: 'GK' }, { name: 'RB', value: 'RB' }, { name: 'CB', value: 'CB' }, { name: 'LB', value: 'LB' }, { name: 'LWB', value: 'LWB' }, { name: 'RWB', value: 'RWB' }, { name: 'CDM', value: 'CDM' }, { name: 'CM', value: 'CM' }, { name: 'CAM', value: 'CAM' }, { name: 'LM', value: 'LM' }, { name: 'RM', value: 'RM' }, { name: 'LW', value: 'LW' }, { name: 'RW', value: 'RW' }, { name: 'CF', value: 'CF' }, { name: 'ST', value: 'ST' }
                ]}
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { name: string, ['min-rating']: number, ['max-rating']: number, ['nation-id']?: number, position?: string }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;

            const min = args['min-rating'], max = args['max-rating'];
            if (min < 40 || max > 99 || min > max) return await int.reply(funcs.createEmbed("Invalid Ratings", "Ratings MUST be between `40` and `99`\nMin can NOT be above Max", true));

            const name = args.name.trim();
            if (!name || name.length > 50) return await int.reply(funcs.createEmbed("Invalid Name", "Pack name MUST be between `1` and `50` characters", true));
            if (dBase.packTokens.get(int.user.id) < 1) return await int.reply(funcs.createEmbed("No Custom Pack Tokens", `You need \`1x\` custom pack token to create a pack\nYour have: \`${dBase.packTokens.get(int.user.id)}\` custom pack tokens`, true));

            dBase.packTokens.remove(int.user.id, 1);
            const packId = funcs.rString(8);
            dBase.customPacks.create({ id: packId, userId: int.user.id, name, minRating: min, maxRating: max, nationId: args['nation-id'] ?? null, position: args.position ?? null });

            return await int.reply(funcs.createEmbed("Custom Pack Created!", `**${name}** (ID: \`${packId}\`)\nRating Range: \`${min}-${max}\`${args['nation-id'] ? `\nNation ID: \`${args['nation-id']}\`` : ""}${args.position ? `\nPosition: \`${args.position}\`` : ""}\nSize: \`${CustomPackSize}\` Cards (Tradable Only)\n\nOpen it with: \`/open-pack\`\nTrade it away with: \`/trade\``));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
