import { Client, Events, GuildMember, TextChannel } from "discord.js";
import Configuration from "../../../Configuration.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";

const config = new Configuration();
const db = new MADFUTDB();
const func = new Functions();

const levelRewards: Record<string, { coins: number; trades: number; dbField: string }> = {
    [config.Discord.Roles.Levels.Bronze]: { coins: 10000, trades: 1, dbField: 'bronze' },
    [config.Discord.Roles.Levels.Silver]: { coins: 30000, trades: 3, dbField: 'silver' },
    [config.Discord.Roles.Levels.Gold]: { coins: 50000, trades: 5, dbField: 'gold' },
    [config.Discord.Roles.Levels.TOTW]: { coins: 100000, trades: 10, dbField: 'totw' },
    [config.Discord.Roles.Levels.FUT_Champ]: { coins: 150000, trades: 15, dbField: 'fut_champ' },
    [config.Discord.Roles.Levels.UCL]: { coins: 200000, trades: 20, dbField: 'ucl' },
    [config.Discord.Roles.Levels.Future_Stars]: { coins: 250000, trades: 25, dbField: 'future_stars' },
    [config.Discord.Roles.Levels.TOTY_Nominee]: { coins: 300000, trades: 30, dbField: 'toty_nominee' },
    [config.Discord.Roles.Levels.Moments]: { coins: 350000, trades: 35, dbField: 'moments' },
    [config.Discord.Roles.Levels.Icon]: { coins: 400000, trades: 40, dbField: 'icon' },
    [config.Discord.Roles.Levels.TOTY]: { coins: 500000, trades: 50, dbField: 'toty' },
    [config.Discord.Roles.Levels.TOTS]: { coins: 600000, trades: 60, dbField: 'tots' },
};

export default async function LevelListener(client: Client) {
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (oldMember.roles.cache.size === newMember.roles.cache.size) return;
        if (!db.username.getFromUID(newMember.id)) return;

        for (const [roleId, rewards] of Object.entries(levelRewards)) {
            if (!oldMember.roles.cache.has(roleId) && newMember.roles.cache.has(roleId)) {
                if (db.rewardRoles.get(newMember.id)[rewards.dbField]) {
                    continue;
                }
                
                db.coins.add(newMember.id, rewards.coins);
                db.trades.add(newMember.id, rewards.trades);
                db.rewardRoles.set(newMember.id, { ...db.rewardRoles.get(newMember.id), [rewards.dbField]: true });
                
                const levelName = Object.keys(config.Discord.Roles.Levels).find(key => config.Discord.Roles.Levels[key as keyof typeof config.Discord.Roles.Levels] === roleId);
                const channel = newMember.guild.channels.cache.get(config.Discord.Channels.MainChat) as TextChannel;
                if (channel) {
                    await channel.send(func.createEmbed("Level Up Reward!", `Congratulations, <@${newMember.id}>!\nYou have claimed the rewards for: ${levelName}\n\nRewards:\n+${rewards.coins.toLocaleString()} Coins\n+${rewards.trades} Bot Trades`));
                }
                break;
            }
        }
    });
}

export function claimLevelRewards(member: GuildMember) {
    const userId = member.id;
    const currentClaims = db.rewardRoles.get(userId);
    let totalCoins = 0, totalTrades = 0;
    const claimedLevels: string[] = [];

    const newClaims = { ...currentClaims };

    for (const [roleId, rewards] of Object.entries(levelRewards)) {
        if (member.roles.cache.has(roleId) && !currentClaims[rewards.dbField]) {
            totalCoins += rewards.coins;
            totalTrades += rewards.trades;
            newClaims[rewards.dbField] = true;
            
            const levelName = Object.keys(config.Discord.Roles.Levels).find(key => config.Discord.Roles.Levels[key as keyof typeof config.Discord.Roles.Levels] === roleId);
            if (levelName) claimedLevels.push(levelName);
        }
    }

    if (claimedLevels.length === 0) return null;

    db.coins.add(userId, totalCoins);
    db.trades.add(userId, totalTrades);
    db.rewardRoles.set(userId, newClaims);

    return `Claimed rewards for ${claimedLevels.length} level(s) earned while unlinked:\n**Levels:** ${claimedLevels.join(", ")}\n**Total:** +${totalCoins.toLocaleString()} Coins, +${totalTrades} Bot Trades`;
}