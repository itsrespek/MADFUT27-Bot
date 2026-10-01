import { Client, Events, TextChannel } from "discord.js";
import Configuration from "../../../Configuration.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";

const config = new Configuration();
const db = new MADFUTDB();
const func = new Functions();

const boostRewards: Record<number, number> = {
    1: 25,
    2: 60
};

const memberBoosts = new Map<string, number>();
let serverBoosts = -1;

function boostReward(boostNumber: number): number {
    if (boostRewards[boostNumber]) return boostRewards[boostNumber];
    return (boostRewards[2] ?? boostRewards[1]) + ((boostNumber - 2) * 35);
}

function seedServer(client: Client) {
    const guild = client.guilds.cache.get(config.Discord.GuildId);
    if (!guild) return;
    if (typeof guild.premiumSubscriptionCount === "number") serverBoosts = guild.premiumSubscriptionCount;
    try {
        guild.members.cache.forEach(member => {
            if (member.premiumSinceTimestamp) memberBoosts.set(member.id, Math.max(memberBoosts.get(member.id) ?? 0, 1));
        });
    } catch {}
}

export default async function BoostListener(client: Client) {
    if (client.isReady()) seedServer(client);
    else client.once(Events.ClientReady, () => seedServer(client));

    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (oldMember.premiumSinceTimestamp && !newMember.premiumSinceTimestamp) {
            const previous = memberBoosts.get(newMember.id);
            if (previous) serverBoosts = Math.max(0, serverBoosts - previous);
            memberBoosts.delete(newMember.id);

            if (config.Discord.Roles.DoubleBooster) {
                try {
                    await newMember.roles.remove(config.Discord.Roles.DoubleBooster);
                } catch {}
            }
            return;
        }

        if (!db.username.getFromUID(newMember.id)) return;

        if (oldMember.premiumSinceTimestamp || !newMember.premiumSinceTimestamp) return;

        if (serverBoosts < 0) serverBoosts = newMember.guild.premiumSubscriptionCount ?? 0;

        let added = (newMember.guild.premiumSubscriptionCount ?? serverBoosts) - serverBoosts;
        added = Math.min(Math.max(added, 1), 10);
        serverBoosts += added;

        const channel = newMember.guild.channels.cache.get(config.Discord.Channels.SystemBoosts) as TextChannel;
        const previous = memberBoosts.get(newMember.id) ?? 0, total = previous + added;
        memberBoosts.set(newMember.id, total);

        for (let i = previous + 1; i <= total; i++) {
            const reward = boostReward(i);
            db.trades.add(newMember.id, reward);

            if (channel) {
                await channel.send(func.createEmbed("Server Boost!", `Thank you for boosting the server, <@${newMember.id}>!\nBoost #${i}\n\nRewards:\n+${reward} Bot Trades`));
            }
        }

        if (total >= 2 && config.Discord.Roles.DoubleBooster && !newMember.roles.cache.has(config.Discord.Roles.DoubleBooster)) {
            try {
                await newMember.roles.add(config.Discord.Roles.DoubleBooster);
                if (channel) {
                    await channel.send(func.createEmbed("Double Booster!", `<@${newMember.id}> is now a Double Booster and has received the <@&${config.Discord.Roles.DoubleBooster}> role!`));
                }
            } 
            catch {}
        }
    });
}
