import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder } from "discord.js";
import Command from "../Helpers/Layout/CMDs.js";
import DiscordClient from "../Client.js";
import MADFUTDB from "../../Database.js";
import { Functions } from "../../Functions.js";
import { CustomPackSize, GamePacks, GamePackRoll, getPackName } from "../Helpers/Packs.js";
import { CustomPackRow } from "../Helpers/Interface.js";

export default class OpenPack extends Command {
    constructor() {
        super(
            'open-pack',
            'Open one of your packs..',
            [
                { name: 'pack', description: 'Which pack?', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: '100% Random', value: 'random' },
                    { name: 'Bronze', value: 'bronze' },
                    { name: 'Silver', value: 'silver' },
                    { name: 'Gold', value: 'gold' },
                    { name: 'Gold Super', value: 'goldsuper' },
                    { name: 'TOTW', value: 'totw' },
                    { name: '80+', value: '80plus' },
                    { name: '95+ Special', value: 'special95' },
                    ...Object.keys(GamePacks).filter(k => k.endsWith('_special')).map(k => ({ name: getPackName(k), value: k })),
                    { name: 'Custom Pack', value: 'custom' }
                ]},
                { name: 'amount', description: 'How many packs? | Default: 1 | Max: 10', type: ApplicationCommandOptionType.Integer, required: false },
                { name: 'id', description: 'Custom Pack ID? | Only needed if you own multiple', type: ApplicationCommandOptionType.String, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { pack: string, amount?: number, id?: string }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), database = (dBase as any)['db']; if (!funcs.isLinked(int)) return;

            const amount = Math.min(Math.max(args.amount ?? 1, 1), 10);

            let packName = "", rolls: GamePackRoll[] = [], nationId: number | null = null, position: string | null = null, refund!: () => void;

            if (args.pack === 'custom') {
                if (amount > 1) return await int.reply(funcs.createEmbed("One At A Time", "Custom Packs are one-off items..\nYou can only open `1` per command", true));

                let target: CustomPackRow | undefined;
                if (args.id) {
                    const custom = dBase.customPacks.get(args.id.trim());
                    if (!custom || custom.userId !== int.user.id) return await int.reply(funcs.createEmbed("Custom Pack Not Found", "That Custom Pack doesn't exist..\nOr it isn't yours", true));
                    target = custom;
                }
                else {
                    const owned = dBase.customPacks.getAll(int.user.id);
                    if (!owned.length) return await int.reply(funcs.createEmbed("No Custom Packs", "You don't own any Custom Packs..\nCreate one with `/create-pack`", true));
                    if (owned.length > 1) return await int.reply(funcs.createEmbed("Pick A Pack", `You own more than one Custom Pack..\n${owned.map(p => `> \`${p.name}\` (ID: \`${p.id}\`)`).join("\n")}`, true));
                    target = owned[0];
                }

                dBase.customPacks.remove(target.id);
                packName = target.name, rolls = [{ min: target.minRating, max: target.maxRating, count: CustomPackSize }], nationId = target.nationId, position = target.position;
                refund = () => dBase.customPacks.create(target!);
            }
            else {
                const owned = dBase.packs.get(int.user.id, args.pack);
                if (owned <= 0) return await int.reply(funcs.createEmbed("No Packs", `You don't have a \`${getPackName(args.pack)}\` pack to open`, true));
                if (owned < amount) return await int.reply(funcs.createEmbed("Not Enough Packs", `You don't have enough \`${getPackName(args.pack)}\` packs\nOwned: \`${owned}\`/\`${amount}\``, true));

                dBase.packs.remove(int.user.id, args.pack, amount);
                packName = getPackName(args.pack), rolls = GamePacks[args.pack].rolls;
                refund = () => dBase.packs.add(int.user.id, args.pack, amount);
            }

            const pulledPages: string[][] = [];
            for (let i = 0; i < amount; i++) {
                const packCards: { text: string, rating: number }[] = [];

                for (const roll of rolls) {
                    for (const card of dBase.packCards.getRandom(roll.min ?? null, roll.max ?? null, roll.count, nationId, position, roll.exact ?? null, roll.colors ?? null, roll.specialOnly ?? false)) {
                        dBase.cards.add(int.user.id, card.id, 1);

                        const cardInfo = database.prepare("SELECT name, rating, color FROM madfut27cards WHERE id = ?").get(card.id) as any;
                        packCards.push({ text: `\`1x\` ${cardInfo.rating} ${cardInfo.name} (${(cardInfo.color || 'Unknown').toUpperCase()})`, rating: cardInfo.rating || 0 });
                    }
                }

                pulledPages.push(packCards.sort((a, b) => b.rating - a.rating).map(card => card.text));
            }

            if (!pulledPages.some(page => page.length)) {
                refund();
                return await int.reply(funcs.createEmbed("Pack Failed", "No cards matched that pack..\nThe pack was returned to your wallet", true));
            }

            if (amount === 1) {
                return await int.reply(funcs.createEmbed(`${packName} Opened!`, `You pulled:\n${pulledPages[0].join("\n")}\n\nAll cards were added straight into your wallet`));
            }

            const pages: any[] = [];
            for (let i = 0; i < pulledPages.length; i++) {
                pages.push(funcs.createEmbed(`${packName} x${amount} Opened! (Page: ${pages.length + 1}/${pulledPages.length})`, `__Pack #${i + 1}:__\n${pulledPages[i].length ? pulledPages[i].join("\n") : "No cards matched..\nThe pack still counts as opened"}\n\nAll cards were added straight into your wallet`, false));
            }

            let page = 0, timeout: NodeJS.Timeout;
            const cPage = (p: number) => {
                const pageData = { ...pages[p], components: [new ContainerBuilder(pages[p].components[0].toJSON())] };
                pageData.components[0].addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("back").setLabel("Back").setStyle(ButtonStyle.Secondary).setDisabled(p === 0), new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(p === pages.length - 1)));
                return pageData;
            };
            const endInteraction = async () => {
                await int.editReply(funcs.createEmbed("Pack Timeout", "This interaction has timed out\nYour cards are already safe in your wallet\nUse \`/open-pack\` to open more"));
                col.stop();
            };

            const col = (await int.reply(cPage(page)) as any).createMessageComponentCollector({ componentType: ComponentType.Button });
            timeout = setTimeout(endInteraction, 120_000);

            col.on("collect", async (i: any) => {
                if (i.user.id !== int.user.id) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));

                clearTimeout(timeout);
                timeout = setTimeout(endInteraction, 120_000);
                await i.update(cPage(page += i.customId === "next" ? 1 : -1));
            });
            col.on("end", () => clearTimeout(timeout));
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
