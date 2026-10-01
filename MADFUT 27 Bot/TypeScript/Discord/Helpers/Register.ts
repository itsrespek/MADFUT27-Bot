import { ApplicationCommandOptionType, Routes } from 'discord.js';
import { readdirSync, lstatSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join as pathJoin } from 'path';
import DiscordClient from '../../Discord/Client.js';
import Configuration from '../../Configuration.js';

const baseDir = dirname(fileURLToPath(import.meta.url));
const guildCMDs: any[] = [];

export async function loadEvents(client: DiscordClient, dir: string = '', config?: Configuration): Promise<void> {
    for (const file of readdirSync(pathJoin(baseDir, dir))) {
        const fullPath = pathJoin(pathJoin(baseDir, dir), file);
        
        if (lstatSync(fullPath).isDirectory()) {
            await loadEvents(client, pathJoin(dir, file), config);
            continue;
        }
        if (!file.endsWith('.js')) continue;

        const eventModule = await import(pathJoin(dir, file).replace(/\\/g, '/'));
        const event = new eventModule.default(config);
        
        client.events.set(event.getName(), event);
        client.on(event.getName(), event.run.bind(event, client));
    }
}

export async function cSlashCMDs(client: DiscordClient, dir: string = '', groups: string[] = []): Promise<void> {
    if (groups.length === 1 && groups[0] === 'mf' && !guildCMDs.find(c => c.name === 'mf')) {
        guildCMDs.push({
            name: "mf",
            description: "MADFUT 27 Bot Commands",
            options: []
        });
    }

    for (const file of readdirSync(pathJoin(baseDir, dir))) {
        const fullPath = pathJoin(baseDir, dir, file);
        const isDir = lstatSync(fullPath).isDirectory();
        const safeName = file.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);

        if (isDir) {
            if (groups.length === 0) {
                guildCMDs.push({ 
                    name: safeName, 
                    description: "This is a command", 
                    options: [] 
                });
            } 
            else {
                const root = guildCMDs.find(c => c.name === groups[0]);
                let target = root;
                for (let i = 1; i < groups.length; i++) {
                    target = target.options.find((o: any) => o.name === groups[i]);
                }
                target.options.push({ 
                    name: safeName, 
                    description: "This is a sub command group", 
                    type: ApplicationCommandOptionType.SubcommandGroup, 
                    options: [] 
                });
            }
            await cSlashCMDs(client, pathJoin(dir, file), [...groups, safeName]);
            continue;
        }

        if (!file.endsWith('.js')) continue;

        const { default: Slash } = await import(pathJoin(dir, file).replace(/\\/g, '/'));
        const cmd = new Slash();
        client.commands.set([...groups, cmd.name].join(""), cmd);

        const command = { 
            name: cmd.name, 
            description: cmd.description, 
            type: ApplicationCommandOptionType.Subcommand, 
            options: cmd.args 
        };

        if (groups.length === 0) {
            guildCMDs.push(command);
        } 
        else {
            const root = guildCMDs.find(c => c.name === groups[0]);
            let target = root;
            for (let i = 1; i < groups.length; i++) {
                target = target.options.find((o: any) => o.name === groups[i]);
            }
            target.options.push(command);
        }
    }
}

export async function loadCMDs(client: DiscordClient, config: Configuration): Promise<void> {
    await client.rest.put(Routes.applicationGuildCommands(client.application?.id!, config.Discord.GuildId), { body: guildCMDs });
    console.log(client.application?.id)
    console.log(`Commands Loaded - CMDs ID: ${config.Discord.Channels.CMDs}`);
}