import { GatewayIntentBits, Partials } from 'discord.js';
import DiscordClient from './Discord/Client.js';
import Configuration from './Configuration.js';
import { cSlashCMDs, loadCMDs, loadEvents } from './Discord/Helpers/Register.js';
import { BotError } from './Discord/Helpers/Interface.js';
import MADFUTDB from './Database.js';
import { Automation } from './Discord/Helpers/Automatic/Utils.js';

export default class Bot {
    public readonly client: DiscordClient;
    public readonly config: Configuration;
    public readonly db: MADFUTDB;
    private automation: Automation

    constructor() {
        this.config = new Configuration();
        if (!this.config.Discord.GuildId) {
            throw new Error('Missing Guild ID: Unable to start bot');
        }

        this.db = new MADFUTDB();
        this.client = new DiscordClient({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction,
                Partials.GuildMember,
                Partials.User
            ],
            rest: { 
                version: '10'
            },
            shards: 'auto'
        });

        this.automation = new Automation(this.client)
        this.registerErrorHandlers();
    }

    async start(): Promise<this> {
        await loadEvents(this.client, '../../Discord/Events/', this.config);
        await cSlashCMDs(this.client, '../../Discord/Commands/', ['mf']);
        await this.client.login(this.config.Discord.Token);
        await loadCMDs(this.client, this.config);

        await this.automation.runAuto();
        return this;
    }

    private registerErrorHandlers() {
        process.on('uncaughtException', (e: any) => {
            if (e?.message?.includes('getCMDsID')) return console.log('Invalid CMDs ID');
            if (e?.message?.includes('getTradingID')) return console.log('Invalid Trading ID');
            if (e?.message?.includes('getCoinFlipID')) return console.log('Invalid CoinFlip ID');
            console.error('Exception:', e);
        });

        process.on('unhandledRejection', (rsn: unknown, p) => {
            const r = rsn as BotError;
            if (r?.code === 'TokenInvalid') return console.log('Invalid Bot Token');
            if (r?.code === 'User disallowed intents' || r?.message === 'Used disallowed intents') return console.log('Missing Intents');
            console.error('Unhandled Rejection:', r, p);
        });
    }
}

new Bot().start();