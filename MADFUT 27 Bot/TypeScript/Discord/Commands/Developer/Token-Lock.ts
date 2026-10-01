import { ChatInputCommandInteraction } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import { Functions } from "../../../Functions.js";
import { Requests } from "../../../MADFUT/Requests.js";

export default class TokenStatus extends Command {
    constructor() {
        super(
            "token-status",
            "[DEV]: View locked MADFUT tokens",
            []
        );
    }

    async run(c: DiscordClient, int: ChatInputCommandInteraction) {
        try {
            const funcs = new Functions(), req = new Requests();
            const status = req.getTokenStatus(), e = Object.entries(status);
            let d = "";

            if (!e.some(([_, locked]) => locked)) {
                d = "None Locked!";
            }
            else {
                for (const [token, locked] of e) {
                    if (locked) d += `\`${token}\`\n`;
                }
            }

            return await int.reply(funcs.createEmbed("MADFUT RToken Status", `${d}`, true));
        }
        catch (e) {
            console.error(e);
            await int.reply(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}