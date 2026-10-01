import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import Configuration from "../../../Configuration.js";
import { Functions } from "../../../Functions.js";

export default class AppCheck extends Command {
    constructor() {
        super(
            "appcheck",
            "[DEV]: View, Set or Reset the Firebase AppCheck token",
            [
                { name: 'action', description: 'What do you want to do?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'View', value: 'view' }, { name: 'Set', value: 'set' }, { name: 'Reset', value: 'reset' }] },
                { name: 'token', description: 'The new AppCheck token | Required for Set', type: ApplicationCommandOptionType.String, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: ChatInputCommandInteraction, args: { action: 'view' | 'set' | 'reset', token?: string }) {
        try {
            const funcs = new Functions(), config = new Configuration();
            const preview = (token: string) => `\`${token.length > 70 ? `${token.slice(0, 45)}...${token.slice(-20)}\` (\`${token.length.toLocaleString()}\` chars)` : `${token}\``}`;

            if (args.action === 'view') {
                const token = config.MADFUT.AppCheck;
                return await int.reply(funcs.createEmbed("Firebase AppCheck", `Current AppCheck:\n${preview(token)}\nSource: \`${Configuration.isCustomAppCheck() ? "Custom" : "Default"}\`\n\n${funcs.expiryLines(funcs.analyzeToken(token))}`, true));
            }

            if (args.action === 'set') {
                const raw = (args.token || "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
                if (!raw) return await int.reply(funcs.createEmbed("Missing Token", "You MUST provide the new AppCheck token\nUse the `token` option alongside `Set`", true));

                Configuration.setAppCheck(raw);
                return await int.reply(funcs.createEmbed("AppCheck Updated", `New AppCheck applied & saved..\nIt's live for ALL MADFUT requests instantly\n\nNew AppCheck:\n${preview(config.MADFUT.AppCheck)}\n\n${funcs.expiryLines(funcs.analyzeToken(raw))}`, true));
            }

            Configuration.resetAppCheck();
            return await int.reply(funcs.createEmbed("AppCheck Reset", `Restored the default AppCheck token\nThe saved override was deleted..\n\nCurrent AppCheck:\n${preview(config.MADFUT.AppCheck)}`, true));
        }
        catch (e) {
            console.error(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
