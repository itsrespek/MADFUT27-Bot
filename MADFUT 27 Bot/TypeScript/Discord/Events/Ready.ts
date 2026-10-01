import { ActivityType, Events } from 'discord.js';
import DiscordClient from '../Client.js';
import Event from '../Helpers/Layout/Events.js';
import Configuration from '../../Configuration.js';

export default class BotReady extends Event {
    constructor(private readonly config: Configuration) {
        super(Events.ClientReady);
    }

    public async run(client: DiscordClient): Promise<void> {
        console.log(`MADFUT 27 Bot: Online!`);
        client.user?.setPresence({
            activities: [{ 
                name: this.config.Discord.Status || 'Online', 
                type: ActivityType.Playing 
            }],
            status: 'online',
        });
    }
}