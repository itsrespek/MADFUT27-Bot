import { Client, Events, TextChannel } from "discord.js";
import Configuration from "../../../Configuration.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";
import { RewardActions } from "../Types.js";

const config = new Configuration();
const db = new MADFUTDB();
const func = new Functions();

const rewards: RewardActions = {
    "Bot Trades": (id, amt) => db.trades.add(id, amt),
    "Coins": (id, amt) => db.coins.add(id, amt),
    "PackDuo Tokens": (id, amt) => db.packduos.add(id, amt),
};

const milestones: Record<number, Record<string, number>> = {
    250: { "Bot Trades": 2, Coins: 25000 },
    500: { "Bot Trades": 4, Coins: 50000 },
    1000: { "Bot Trades": 6, Coins: 100000, "PackDuo Tokens": 1 },
    1500: { "Bot Trades": 8, Coins: 250000, "PackDuo Tokens": 2 },
    3000: { "Bot Trades": 10, Coins: 500000, "PackDuo Tokens": 3 },
    5000: { "Bot Trades": 12, Coins: 650000, "PackDuo Tokens": 4 },
    10000: { "Bot Trades": 14, Coins: 800000, "PackDuo Tokens": 5 },
};

export default async function MessageListener(client: Client) {
    client.on(Events.MessageCreate, async (message) => {
        if (message.channelId !== config.Discord.Channels.MainChat || message.author.bot) return;
        if (!(message.channel instanceof TextChannel)) return;

        const userId = message.author.id;
        db.messages.add(userId, 1);
        
        const nMsgs = db.messages.get(userId);
        const mRwrds = milestones[nMsgs]; if (!mRwrds) return;

        if (db.username.getFromUID(userId)) {
            for (const [type, amount] of Object.entries(mRwrds)) {
                rewards[type]?.(userId, amount);
            }
            db.messages.setLastMilestone(userId, nMsgs);
            await message.channel.send(func.createEmbed("Milestone Reached", `Congratulations, <@${userId}>..\nYou've sent **${nMsgs}** messages!\n\n${Object.entries(mRwrds).map(([key, val]) => `+${val} ${key}`).join("\n")}`));
        } 
        else {
            await message.channel.send(func.createEmbed("Milestone Reached", `Congratulations, <@${userId}>..\nYou've sent **${nMsgs}** messages!\n\nYou are NOT linked so I cant pay..\nRun \`/link\` to claim your message rewards!`));
        }
    });
}

export function claimMessages(userId: string) {
    const totalMsgs = db.messages.get(userId);
    const lastClaimed = db.messages.getLastMilestone(userId);
    
    let totalCoins = 0, totalTrades = 0, totalTokens = 0;
    const claimedMilestones: number[] = [];

    for (const [milestone, mRewards] of Object.entries(milestones)) {
        const m = parseInt(milestone);
        if (m <= totalMsgs && m > lastClaimed) {
            totalCoins += mRewards["Coins"] || 0;
            totalTrades += mRewards["Bot Trades"] || 0;
            totalTokens += mRewards["PackDuo Tokens"] || 0;
            claimedMilestones.push(m);
        }
    }

    if (claimedMilestones.length === 0) return null;

    if (totalCoins > 0) db.coins.add(userId, totalCoins);
    if (totalTrades > 0) db.trades.add(userId, totalTrades);
    if (totalTokens > 0) db.packduos.add(userId, totalTokens);
    
    const maxMilestone = Math.max(...claimedMilestones);
    db.messages.setLastMilestone(userId, maxMilestone);
    
    const lines = [];
    if (totalCoins > 0) lines.push(`+${totalCoins.toLocaleString()} Coins`);
    if (totalTrades > 0) lines.push(`+${totalTrades} Bot Trades`);
    if (totalTokens > 0) lines.push(`+${totalTokens} PackDuo Tokens`);

    return `Claimed rewards for ${claimedMilestones.length} milestone(s) reached while unlinked:\n${lines.join("\n")}`;
}