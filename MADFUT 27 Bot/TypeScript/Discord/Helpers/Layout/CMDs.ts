import { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { InteractionCommandArgs } from '../Interface.js';
import DiscordClient from '../../../Discord/Client.js';

export default abstract class Command {
    constructor(
        private readonly _name: string, 
        private readonly _description: string, 
        private readonly _args: InteractionCommandArgs[], 
        private readonly _versions?: string[]
    ) {}
    
    get name(): string { return this._name; }
    get description(): string { return this._description; }
    get versions(): string[] | undefined { return this._versions; }
    get args(): InteractionCommandArgs[] { return this._args; }

    abstract run(client: DiscordClient, message: CommandInteraction, args: Object): Promise<any>;
    
    complete?(
        client: DiscordClient, 
        interaction: AutocompleteInteraction, 
        args: Record<string, any>, 
        focused: string
    ): Promise<any>;
}