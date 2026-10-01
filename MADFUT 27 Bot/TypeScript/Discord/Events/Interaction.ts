import { AutocompleteInteraction, CommandInteraction, Events } from "discord.js";
import DiscordClient from "../../Discord/Client.js";
import Configuration from "../../Configuration.js";
import Event from "../Helpers/Layout/Events.js";
import { Functions } from "../../Functions.js";
import MADFUTDB from "../../Database.js";

export default class InteractionCreateEvent extends Event {
    private db: MADFUTDB

    constructor(private config: Configuration, private helpers: Functions = new Functions()) {
        super(Events.InteractionCreate);
        this.db = new MADFUTDB()
    }

    private getCommand(int: CommandInteraction | AutocompleteInteraction): [string, any] {
        if (!int.isChatInputCommand() && !int.isAutocomplete()) return [int.commandName, []];
        
        const first = int.options.data[0];
        if (first?.type === 2) { // SubcommandGroup
            const sub = first.options?.[0];
            return [`${int.commandName}${first.name}${sub?.name}`, sub?.options];
        }
        if (first?.type === 1) { // Subcommand
            return [`${int.commandName}${first.name}`, first.options];
        }
        return [int.commandName, int.options.data];
    }

    async run(client: DiscordClient, int: CommandInteraction | AutocompleteInteraction) {
        if (typeof client === 'number') {
            console.error('Invalid client passed to interaction handler');
            return;
        }
        const isDeveloper = int.isCommand() ? this.helpers.isDeveloper(int) : false;
        if (!isDeveloper && this.db.security.isBanned(int.user.id)) {
            if (int.isCommand()) return await int.reply(this.helpers.createEmbed("Bot Banned", "You have been banned from using the bot\nPlease message an owner if you think this is wrong", true));
            else if (int.isAutocomplete()) return await int.respond([]); 
            return;
        }
        if (int.isCommand()) {
            const [cmd, opts] = this.getCommand(int);
            const c = client.commands.get(cmd); 
            if (!c) return;

            const allow = cmd.startsWith("mfadmin") || cmd.startsWith("mfdeveloper") || cmd.startsWith("mfstaff");
            if (cmd.startsWith("mfcasino")) {
                const casinoChan = this.config.Discord.Channels.Casino || this.config.Discord.Channels.CMDs;
                if (int.channelId !== casinoChan) return this.helpers.wrongChannel(int, casinoChan);
            }
            else if (!allow && int.channelId !== this.config.Discord.Channels.CMDs) {
                return this.helpers.wrongChannel(int, this.config.Discord.Channels.CMDs);
            }
            
            if (cmd.startsWith("mfadmin") && !this.helpers.hasRole(int, this.config.Discord.Roles.AdminID, ['232227470546305025'])) return this.helpers.missingRole(int);
            if (cmd.startsWith("mfstaff") && !this.helpers.hasRole(int, this.config.Discord.Roles.StaffID, ['232227470546305025'])) return this.helpers.missingRole(int);
            if (cmd.startsWith("mfdeveloper") && !this.helpers.isDeveloper(int)) return this.helpers.missingRole(int);

            const flat = opts?.[0]?.options || opts || [];
            const args: Record<string, any> = {};
            if (c.args) {
                const map = new Map(flat.map((o: { name: any; value: any; }) => [o.name, o.value]));
                for (const arg of c.args) if (map.has(arg.name)) args[arg.name] = map.get(arg.name);
            }
            
            return c.run(client, int, args);
        } 
        else if (int.isAutocomplete()) {
            const [cmd] = this.getCommand(int);
            const c = client.commands.get(cmd);
            if (!c?.complete) return;

            const focused = int.options.getFocused(true);
            await c.complete(client, int, { [focused.name]: focused.value }, focused.value);
        }
    }
}