import { Client, TextChannel } from "discord.js";
import Configuration from "../../../Configuration.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";
import { LeaderboardEntry } from "../Interface.js";

const config = new Configuration();
const db = new MADFUTDB();
const func = new Functions();

export default async function Leaderboard(client: Client) {
    const guild = client.guilds.cache.get(config.Discord.GuildId), channel = client.channels.cache.get(config.Discord.Channels.Leaderboard) as TextChannel; if (!channel || !guild) return;

    const svMembers = await guild.members.fetch().catch(() => null);
    if (!svMembers) return;

    const data: LeaderboardEntry[] = [];
    for (const row of db.leaderboard.getAll()) {
        const member = svMembers.get(row.userId);
        if (!member || member.roles.cache.has(config.Discord.Roles.AdminID)) continue;
        data.push({
            userId: member.id,
            displayName: member.displayName,
            coins: row.coins ?? 0,
            trades: row.trades ?? 0,
            messages: row.messages ?? 0
        });
    }

    const formatTop = (key: 'coins' | 'trades' | 'messages', label: string) => {
        const top = [...data].sort((a, b) => b[key] - a[key]).slice(0, 5);
        if (!top.length) return 'Nobody linked yet';
        return top.map((d, i) => `${i + 1}] ${d.displayName} - \`${d[key].toLocaleString()}\` ${label}`).join('\n');
    };

    const description = `Coins Leaderboard:\n${formatTop('coins', 'Coins')}\n\nBoy Trades Leaderboard:\n${formatTop('trades', 'Boy Trades')}\n\nMessage Leaderboard:\n${formatTop('messages', 'Messages')}`;
    try {
        const recent = await channel.messages.fetch({ limit: 50 });
        const lastMessage = recent.find(m => m.author.id === client.user?.id);
        if (lastMessage) {
            await lastMessage.edit(func.createEmbed("MADFUT Leaderboard", description));
        }
        else {
            await channel.send(func.createEmbed("MADFUT Leaderboard", description));
        }
    }
    catch (err) {
        console.log('Leaderboard update failed:', err);
    }
}
