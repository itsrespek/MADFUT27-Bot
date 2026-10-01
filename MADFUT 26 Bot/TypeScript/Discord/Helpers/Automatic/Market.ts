import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, ComponentType, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import MADFUTDB from "../../../Database.js";
import Configuration from "../../../Configuration.js";
import { Functions } from "../../../Functions.js";

const config = new Configuration();
const db = new MADFUTDB();

const marketDurations = [300, 600, 1800];

interface Bid {
    userId: string;
    amount: number;
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function hostAuction(client: Client) {
    try {
        const channel = client.channels.cache.get(config.Discord.Channels.Market) as TextChannel;
        if (!channel) return;

        const funcs = new Functions();
        const sqlDb = (db as any)["db"];

        const rare = Math.random() < 0.35;
        const card = (rare
            ? sqlDb.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE rating >= 90 AND tradable = 1 ORDER BY RANDOM() LIMIT 1").get()
            : sqlDb.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE rating > 0 AND rating < 90 AND tradable = 1 ORDER BY RANDOM() LIMIT 1").get()) as any;

        if (!card) return;

        const quantity = randomInt(1, 3);
        const startPrice = (card.rating >= 90 ? randomInt(50, 400) : randomInt(5, 60)) * 1000;
        const duration = marketDurations[randomInt(0, marketDurations.length - 1)] * 1000;
        const endsAt = Math.floor((Date.now() + duration) / 1000);
        const cardLine = `x\`${quantity}\` ${card.rating} ${card.name} (${(card.color || 'Unknown').toUpperCase()})`;

        const bids: Bid[] = [];
        const topBid = () => (bids.length ? bids[bids.length - 1] : null);
        const ping = config.Discord.Roles.PingRoles.Market ? ` <@&${config.Discord.Roles.PingRoles.Market}>` : "";

        const row = (amount: number, uniqueBidders: number, disabled: boolean = false) => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("market_bid").setLabel("Bid").setStyle(ButtonStyle.Success).setDisabled(disabled), new ButtonBuilder().setCustomId("market_topbid").setLabel(`Top Bid: ${amount.toLocaleString()}`).setStyle(ButtonStyle.Secondary).setDisabled(true), new ButtonBuilder().setCustomId("market_unique").setLabel(`Bidders: ${uniqueBidders}`).setStyle(ButtonStyle.Secondary).setDisabled(true));

        const embed = () => {
            const top = topBid();
            const uniqueBidders = new Set(bids.map(b => b.userId)).size;
            return funcs.createEmbed(`Open Market!${ping}`, `**Card:** ${cardLine}\n**Starting Price:** \`${startPrice.toLocaleString()}\` Coins\n**Top Bid:** \`${(top?.amount ?? startPrice).toLocaleString()}\` Coins\n**Top Bidder:** ${top ? `<@${top.userId}>` : "None yet.."}\n**Bids:** ${bids.length}\n**Ends:** <t:${endsAt}:R>\n\nClick **Bid** to place your bid..\nYou must outbid the current top bid..\nWhen time runs out the highest bidder automatically pays and receives the card(s)`, false, cont => cont.addActionRowComponents(() => row(top?.amount ?? startPrice, uniqueBidders)));
        };

        const message = await channel.send(embed());

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: duration });
        collector.on("collect", async (i: any) => {
            if (i.customId !== "market_bid") return;

            const modalId = `market_bid_${message.id}`;
            const modal = new ModalBuilder().setCustomId(modalId).setTitle("Place Your Bid").addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId("bid_amount").setLabel("Your Bid (Coins)").setStyle(TextInputStyle.Short).setPlaceholder(`Minimum: ${(topBid()?.amount ?? startPrice) + 1000 > startPrice ? ((topBid()?.amount ?? startPrice) + 1000).toLocaleString() : startPrice.toLocaleString()}`).setRequired(true).setMaxLength(15)));

            await i.showModal(modal);
            const submitted = await i.awaitModalSubmit({ filter: (m: any) => m.user.id === i.user.id && m.customId === modalId, time: 120_000 }).catch(() => null);
            if (!submitted) return;

            try {
                if (!db.username.getFromUID(submitted.user.id)) return await submitted.reply(funcs.createEmbed("Not Linked", "You are NOT linked\nRun: `/link` to link first.", true));
                if (db.security.isBanned(submitted.user.id)) return await submitted.reply(funcs.createEmbed("Error", "You are bot banned..\nYou can't bid.", true));

                const amount = parseInt(String(submitted.fields.getTextInputValue("bid_amount")).replace(/[,._\s]/g, ""));
                const top = topBid();

                if (top && top.userId === submitted.user.id) return await submitted.reply(funcs.createEmbed("Bid Rejected", "You already hold the top bid..\nSomeone else has to outbid you first!", true));
                if (!Number.isFinite(amount) || amount <= 0) return await submitted.reply(funcs.createEmbed("Bid Rejected", "That isn't a valid coin amount..", true));
                if (top && amount <= top.amount) return await submitted.reply(funcs.createEmbed("Bid Rejected", `You must beat the top bid of \`${top.amount.toLocaleString()}\` Coins..`, true));
                if (!top && amount <= startPrice) return await submitted.reply(funcs.createEmbed("Bid Rejected", `Your bid must be higher than the starting price of \`${startPrice.toLocaleString()}\` Coins..`, true));
                if (db.coins.get(submitted.user.id) < amount) return await submitted.reply(funcs.createEmbed("Bid Rejected", "You don't have enough coins for that bid..", true));

                bids.push({ userId: submitted.user.id, amount });
                await submitted.update(embed());
            }
            catch (e) {
                console.log(e);
                await submitted.reply(funcs.createEmbed("Error", `Something went wrong..\nTry again`, true)).catch(() => null);
            }
        });

        collector.on("end", async () => {
            const sorted = [...bids].reverse();
            const winner = sorted.find(b => db.username.getFromUID(b.userId) && !db.security.isBanned(b.userId) && db.coins.get(b.userId) >= b.amount);

            if (!winner) {
                const reason = bids.length ? "Nobody left could afford their bid.." : "Nobody placed a bid..";
                const uniqueBidders = new Set(bids.map(b => b.userId)).size;
                return await message.edit(funcs.createEmbed("Market Ended!", `${reason}\nThe card(s) went unsold!\nBetter luck next time!`, false, cont => cont.addActionRowComponents(() => row(topBid()?.amount ?? startPrice, uniqueBidders, true))));
            }

            db.coins.remove(winner.userId, winner.amount);
            db.cards.add(winner.userId, card.id, quantity);
            const finalUniqueBidders = new Set(bids.map(b => b.userId)).size;
            await message.edit(funcs.createEmbed("Market Ended!", `Sold to: <@${winner.userId}>\nCard: ${cardLine}\nFinal Price: \`${winner.amount.toLocaleString()}\` Coins\n\nPaid automatically..\nThe card(s) went straight into their wallet\nGG!`, false, cont => cont.addActionRowComponents(() => row(winner.amount, finalUniqueBidders, true))));
        });
    }
    catch (e) {
        console.log(e);
    }
}

export default async function AutoMarket(client: Client) {
    await hostAuction(client);
    setInterval(async () => await hostAuction(client), 30 * 60 * 1000);
}