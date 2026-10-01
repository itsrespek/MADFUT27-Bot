import { Client, Events, TextChannel } from "discord.js";
import Configuration from "../../../Configuration.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";

const config = new Configuration();
const db = new MADFUTDB();
const func = new Functions();
const inviteCache = new Map(), claimed = new Map();

export default async function InviteListener(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.MainChat) as TextChannel;
    client.once(Events.ClientReady, async () => {
        const guild = client.guilds.cache.get(config.Discord.GuildId);
        if (guild) {
            const invites = await guild.invites.fetch();
            inviteCache.set(guild.id, new Map(invites.map(invite => [invite.code, invite.uses || 0])));
        }
    });

    client.on(Events.GuildMemberAdd, async (member) => {
        if (claimed.has(member.id)) return;

        const guild = member.guild;
        const newInvites = await guild.invites.fetch();
        const oldCache = inviteCache.get(guild.id) || new Map();
        
        const usedInvite = newInvites.find(invite => {
            const oldUses = oldCache.get(invite.code) || 0;
            return (invite.uses || 0) > oldUses;
        });

        if (usedInvite?.inviter) {
            if (db.username.getFromUID(usedInvite.inviter.id)) {
                claimed.set(member.id, true)
                db.trades.add(usedInvite.inviter.id, 5);
                db.coins.add(usedInvite.inviter.id, 125000);

                try {
                    await usedInvite.inviter.send(func.createEmbed("Invite Reward", `Congratulations, <@${usedInvite.inviter.id}>!\n<@${member.id}> joined using your invite!\n\nRewards:\n+5 Bot Trades\n+125,000 Coins`));
                }
                catch {
                    if (channel) {
                        await channel.send(func.createEmbed("Invite Reward", `Congratulations, <@${usedInvite.inviter.id}>!\n<@${member.id}> joined using your invite!\n\nRewards:\n+5 Bot Trades\n+125,000 Coins`));
                    }
                }
            }
            else {
                db.invites.add(usedInvite.inviter.id, 1);
                const pendingCount = db.invites.get(usedInvite.inviter.id);
                try {
                    await usedInvite.inviter.send(func.createEmbed("Invite Reward", `Uh oh!\n<@${member.id}> joined using your invite\nYou are NOT linked so I cant pay..\n\nRun \`/link\` to claim your ${pendingCount} pending invite rewards!`));
                }
                catch {
                    if (channel) {
                        await channel.send(func.createEmbed("Invite Reward", `Uh oh, <@${usedInvite.inviter.id}>!\n<@${member.id}> joined using your invite\nYou are NOT linked so I cant pay..\n\nRun \`/link\` to claim your ${pendingCount} invite rewards!`));
                    }
                }
            }
        }
        inviteCache.set(guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses || 0])));
    });
}

export function claimInvites(userId: string) {
    const pAmount = db.invites.get(userId); if (!pAmount || pAmount <= 0) return null;
    
    db.trades.add(userId, pAmount * 5);
    db.coins.add(userId, pAmount * 125000);
    db.invites.reset(userId);
    
    return `Claimed ${pAmount} pending invite(s):\n+${pAmount * 5} Bot Trades\n+${(pAmount * 125000).toLocaleString()} Coins`;
}