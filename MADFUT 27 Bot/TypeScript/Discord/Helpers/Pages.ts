import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { Functions } from '../../Functions.js';

const PAGE_SIZE = 9;
const TIMEOUT = 120_000;

export async function sendPaged(int: CommandInteraction, funcs: Functions, title: string, lines: string[], emptyNote: string = "No Cards Given") {
    const entries = lines.length ? lines : [emptyNote];
    const pages: string[][] = [];
    for (let i = 0; i < entries.length; i += PAGE_SIZE) pages.push(entries.slice(i, i + PAGE_SIZE));

    if (pages.length === 1) return await int.followUp(funcs.createEmbed(title, pages[0].join('\n'), false));

    let page = 0;
    const cPage = () => funcs.createEmbed(`${title} (Page: ${page + 1}/${pages.length})`, pages[page].join('\n'), false, cont => cont.addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(page === pages.length - 1)
    )));

    const message = await int.followUp(cPage());
    let timeout: NodeJS.Timeout;
    const endInteraction = async () => {
        await message.edit(funcs.createEmbed(`${title} (Expired)`, "This interaction has timed out", false)).catch(() => null);
        col.stop();
    };

    const col = message.createMessageComponentCollector({ componentType: ComponentType.Button });
    timeout = setTimeout(endInteraction, TIMEOUT);

    col.on('collect', async (i: any) => {
        if (i.user.id !== int.user.id) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));

        clearTimeout(timeout);
        timeout = setTimeout(endInteraction, TIMEOUT);
        page += i.customId === 'next' ? 1 : -1;
        await i.update(cPage());
    });
    col.on('end', () => clearTimeout(timeout));
}
