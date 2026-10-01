import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType, ContainerBuilder } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";
import { getPackName } from "../../Helpers/Packs.js";

export default class ShowWallet extends Command {
    constructor() {
        super(
            "show-wallet",
            "[STAFF]: View someone's wallet..",
            [
                { name: "user", description: "Who?", type: ApplicationCommandOptionType.User, required: true }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { user: any }) {
        try {
            const db = new MADFUTDB(), funcs = new Functions(), database = (db as any)['db']; if (!funcs.isLinked(int)) return;
            await int.deferReply();

            const userId = String(args.user), target = c.users.cache.get(userId) ?? await c.users.fetch(userId).catch(() => null);
            if (!target) return await int.editReply(funcs.createEmbed("Error", "Couldn't find that user..\nAre you sure they're in this server?", true));

            const coins = db.coins.get(userId), trades = db.trades.get(userId), packduo = db.packduos.get(userId), cpTokens = db.packTokens.get(userId), picks = db.picks.get(userId), messages = db.messages.get(userId), userCards = db.cards.getAll(userId), userPacks = db.packs.getAll(userId).filter(p => p.Total > 0), userCustomPacks = db.customPacks.getAll(userId), cardEntries: string[] = [];
            const packEntries = [
                ...userPacks.map(p => `\`x${p.Total}\` ${getPackName(p.PackID)}`),
                ...userCustomPacks.map(p => `\`x1\` ${p.name} (Custom | Range: \`${p.minRating}-${p.maxRating}\` | ID: \`${p.id}\`)`)
            ];
            const cardData = [];
            for (const card of userCards) {
                const cardInfo = database.prepare("SELECT name, rating, color FROM madfut27cards WHERE id = ?").get(card.CardID) as any;
                cardData.push({
                    entry: cardInfo ? `\`x${card.Total}\` ${cardInfo.rating} ${cardInfo.name} (${cardInfo.color.toUpperCase()} | ID: \`${card.CardID}\`)` : `\`x${card.Total}\` Unknown Card (ID: \`${card.CardID}\`)`,
                    rating: cardInfo?.rating || 0
                });
            }
            cardData.sort((a, b) => b.rating - a.rating);
            for (const data of cardData) {
                cardEntries.push(data.entry);
            }

            const walletBody = (cardsSection: string) => `Coins: \`${coins.toLocaleString()}\`\nBot Trades: \`${trades.toLocaleString()}\`\nPackDuo Tokens: \`${packduo.toLocaleString()}\`\nCustom Pack Tokens: \`${cpTokens.toLocaleString()}\`\nPlayer Picks: \`${picks.toLocaleString()}\`\n---\nMessages: \`${messages.toLocaleString()}\`\n---\nCards:\n${cardsSection}\n---\nPacks:\n${packEntries.length ? packEntries.join('\n') : "You have none"}`;

            const pages: any[] = [];
            for (let i = 0; i < cardEntries.length; i += 10) {
                const pageCards = cardEntries.slice(i, i + 10);
                pages.push(funcs.createEmbed(`${target.displayName}'s MADFUT Wallet (Page: ${pages.length + 1}/${Math.ceil(cardEntries.length / 10)})`, walletBody(pageCards.join('\n')), false));
            }

            if (!pages.length) pages.push(funcs.createEmbed(`${target.displayName}'s MADFUT Wallet`, walletBody("You have none"), false));

            let page = 0, timeout: NodeJS.Timeout;
            const cPage = (p: number) => {
                const pageData = { ...pages[p], components: [new ContainerBuilder(pages[p].components[0].toJSON())] };
                pageData.components[0].addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("back").setLabel("Back").setStyle(ButtonStyle.Secondary).setDisabled(p === 0), new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(p === pages.length - 1)));
                return pageData;
            };
            const endInteraction = async () => {
                await int.editReply(funcs.createEmbed("Wallet Timeout", "This interaction has timed out\nUse `/show-wallet` to view this again"));
                col.stop();
            };

            const col = (await int.editReply(cPage(page)) as any).createMessageComponentCollector({ componentType: ComponentType.Button });
            timeout = setTimeout(endInteraction, 120_000);

            col.on("collect", async (i: any) => {
                if (i.user.id !== int.user.id) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));

                clearTimeout(timeout);
                timeout = setTimeout(endInteraction, 120_000);
                await i.update(cPage(page += i.customId === "next" ? 1 :  -1));
            });
            col.on("end", () => clearTimeout(timeout));
        }
        catch (e: any) {
            console.error(e);
            await int.followUp(new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true));
        }
    }
}
