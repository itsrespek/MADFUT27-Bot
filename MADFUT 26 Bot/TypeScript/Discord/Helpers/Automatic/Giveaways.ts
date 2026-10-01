import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, ComponentType, MessageFlags, TextChannel } from "discord.js";
import MADFUTDB from "../../../Database.js";
import Configuration from "../../../Configuration.js";
import { Functions, GiveawayWinning, addGiveawayWinning, payGiveawayWinning } from "../../../Functions.js";
import { GamePacks } from "../Packs.js";

const config = new Configuration();
const db = new MADFUTDB();

const maxAutoCoins = 4000000;
const maxAutoTrades = 60;
const autoGiveawayDurations = [300, 600, 1800];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAutoPrize(): GiveawayWinning {
    const lines: string[] = [];
    const winning: GiveawayWinning = { label: "" };
    const sqlDb = (db as any)["db"];

    if (Math.random() < 0.5) {
        const amount = randomInt(25, maxAutoCoins / 1000) * 1000;
        winning.coins = amount;
        lines.push(`\`${amount.toLocaleString()}\` Coins`);
    }

    if (Math.random() < 0.4) {
        const amount = randomInt(3, maxAutoTrades);
        winning.trades = amount;
        lines.push(`\`${amount}\` Bot Trades`);
    }

    if (Math.random() < 0.2) {
        const amount = randomInt(1, 5);
        winning.packduos = amount;
        lines.push(`\`${amount}\` PackDuo Tokens`);
    }

    if (Math.random() < 0.25) {
        const packIds = Object.keys(GamePacks);
        const packId = packIds[randomInt(0, packIds.length - 1)];
        const quantity = randomInt(1, 3);
        winning.packs = [...(winning.packs ?? []), { pack_id: packId, quantity }];
        lines.push(`x\`${quantity}\` ${GamePacks[packId].name} Pack`);
    }

    if (Math.random() < 0.05) {
        const amount = randomInt(1, 2);
        winning.ctokens = amount;
        lines.push(`\`${amount}\` Custom Pack Token(s)`);
    }

    if (Math.random() < 0.15) {
        const amount = randomInt(1, 3);
        winning.picks = amount;
        lines.push(`\`${amount}\` Player Pick(s)`);
    }

    if (Math.random() < 0.35) {
        for (let i = 0; i < randomInt(1, 5); i++) {
            const rare = Math.random() < 0.05;
            const card = (rare
                ? sqlDb.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE rating >= 90 AND tradable = 1 ORDER BY RANDOM() LIMIT 1").get()
                : sqlDb.prepare("SELECT id, name, rating, color FROM madfut27cards WHERE rating > 0 AND rating < 90 AND tradable = 1 ORDER BY RANDOM() LIMIT 1").get()) as any;

            if (!card || winning.cards?.some(c => c.card_id === card.id)) continue;

            const quantity = randomInt(1, 3);
            winning.cards = [...(winning.cards ?? []), { card_id: card.id, quantity }];
            lines.push(`x\`${quantity}\` ${card.rating} ${card.name} (${(card.color || 'Unknown').toUpperCase()})`);
        }
    }

    if (!lines.length) {
        const amount = randomInt(25, 500) * 1000;
        winning.coins = amount;
        lines.push(`\`${amount.toLocaleString()}\` Coins`);
    }

    winning.label = lines.join("\n");
    return winning;
}

async function hostAutoGiveaway(client: Client) {
    try {
        const channel = client.channels.cache.get(config.Discord.Channels.Giveaways) as TextChannel;
        if (!channel) return;

        const funcs = new Functions();
        const winning = generateAutoPrize();
        const duration = autoGiveawayDurations[randomInt(0, autoGiveawayDurations.length - 1)] * 1000;
        const endsAt = Math.floor((Date.now() + duration) / 1000);
        const ping = config.Discord.Roles.PingRoles.Giveaways ? ` <@&${config.Discord.Roles.PingRoles.Giveaways}>` : "";

        const row = (entries: number, disabled: boolean = false) => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("join").setLabel("Join").setStyle(ButtonStyle.Success).setDisabled(disabled), new ButtonBuilder().setCustomId("entries").setLabel(`Entries: ${entries}`).setStyle(ButtonStyle.Secondary).setDisabled(true));
        const embed = (entries: number) => funcs.createEmbed(`Bot Giveaway!${ping}`, `**Prize:**\n${winning.label}\n**Ends:** <t:${endsAt}:R>\n\nClick **Join** for a chance to win\nPrize's are paid into the winner's wallet`, false, cont => cont.addActionRowComponents(() => row(entries)));

        const message = await channel.send(embed(0));
        const entrants = new Set<string>();

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: duration });
        collector.on("collect", async (i: any) => {
            if (i.customId !== "join") return;
            if (db.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
            if (entrants.has(i.user.id)) return await i.reply({ content: "You've already joined this giveaway!", flags: MessageFlags.Ephemeral });

            entrants.add(i.user.id);
            await i.update(embed(entrants.size));
        });

        collector.on("end", async () => {
            if (entrants.size === 0) return await message.edit(funcs.createEmbed("Giveaway Ended!", `Nobody entered..\nBetter luck next time!`, false, cont => cont.addActionRowComponents(() => row(0, true))));

            const winner = [...entrants][Math.floor(Math.random() * entrants.size)];
            if (db.username.getFromUID(winner)) {
                payGiveawayWinning(winner, winning);
                await message.edit(funcs.createEmbed("Giveaway Ended!", `Winner: <@${winner}>\n**Prize:**\n${winning.label}\n\nPaid straight into their wallet`, false, cont => cont.addActionRowComponents(() => row(entrants.size, true))));
            }
            else {
                addGiveawayWinning(winner, winning);
                await message.edit(funcs.createEmbed("Giveaway Ended!", `Winner: <@${winner}>\n**Prize:**\n${winning.label}\n\nThey aren't linked..\nThis prize will be added in their wallet once they link`, false, cont => cont.addActionRowComponents(() => row(entrants.size, true))));
            }
        });
    }
    catch (e) {
        console.log(e);
    }
}

export default async function AutoGiveaways(client: Client) {
    await hostAutoGiveaway(client);
    setInterval(async () => await hostAutoGiveaway(client), 30 * 60 * 1000);
}