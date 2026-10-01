import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import Command from '../Helpers/Layout/CMDs.js';
import DiscordClient from '../Client.js';
import MADFUTDB from '../../Database.js';
import { Functions } from '../../Functions.js';

export default class Exchange extends Command {
    constructor() {
        super(
            'exchange',
            'A mini shop to swap coins and bot trades.. | Offers rotate every 6 hours',
            []
        );
    }

    async run(c: DiscordClient, int: CommandInteraction) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB();
            const period = Math.floor(Date.now() / 21_600_000);
            let state = (period * 2654435761) % 4294967296;
            const rand = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
            const pick = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

            const amount = pick(5, 20), buyRate = pick(520, 660) * 1000, sellRate = pick(40, 110) * 1000;
            const soldOut = rand() < 0.35;
            const price = amount * buyRate, resetsAt = Math.floor(((period + 1) * 21_600_000) / 1000);

            const body = [
                `New offers: <t:${resetsAt}:R>`,
                '',
                '**Trades for Sale:**',
                ...(soldOut ? ["`SOLD OUT` | This shop bought every trade..\nCheck back next rotation!"] : [`\`${amount}x\` Bot Trades | Cost: \`${price.toLocaleString()}\` Coins`]),
                '',
                '**Trades Wanted:**',
                `\`${sellRate.toLocaleString()}\` Coins per Bot Trade`,
                '',
                '-# Prices change every `6` hours..'
            ].join('\n');
            const row = (disabled: boolean = false) => new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('ex_buy').setLabel(soldOut ? 'Sold Out' : `Buy ${amount}x Trades`).setStyle(ButtonStyle.Success).setDisabled(disabled || soldOut),
                new ButtonBuilder().setCustomId('ex_sell_5').setLabel('Sell 5').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('ex_sell_10').setLabel('Sell 10').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('ex_sell_25').setLabel('Sell 25').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
                new ButtonBuilder().setCustomId('ex_sell_all').setLabel('Sell All').setStyle(ButtonStyle.Danger).setDisabled(disabled)
            );

            await int.reply(funcs.createEmbed('Exchange Shop', body, false, cont => cont.addActionRowComponents(() => row())));
            const message = await int.fetchReply();
            const col = (message as any).createMessageComponentCollector({ componentType: ComponentType.Button, time: Math.max((period + 1) * 21_600_000 - Date.now(), 60_000) });

            col.on('collect', async (i: any) => {
                if (dBase.security.isBanned(String(i.user.id))) return await i.reply(funcs.createEmbed('Bot Banned', 'You have been banned from using the bot..', true));
                const uid = String(i.user.id);

                if (i.customId === 'ex_buy') {
                    if (soldOut) return await i.reply(funcs.createEmbed('Sold Out', "This rotation's trades are all gone..\nWait for the next rotation!", true));
                    if (dBase.coins.get(uid) < price) return await i.reply(funcs.createEmbed('Not Enough Coins', `You can't afford this offer..\nCoin Total: \`${dBase.coins.get(uid).toLocaleString()}\`/\`${price.toLocaleString()}\``, true));

                    dBase.coins.remove(uid, price);
                    dBase.trades.add(uid, amount);
                    return await i.reply(funcs.createEmbed('Purchase Complete', `You bought \` ${amount}x\` Bot Trades for \`${price.toLocaleString()}\` coins`, true));
                }

                const qty = i.customId === 'ex_sell_all' ? dBase.trades.get(uid) : parseInt(i.customId.split('_')[2]);
                if (!qty || qty <= 0) return await i.reply(funcs.createEmbed('Nothing To Sell', "You don't have any bot trades to exchange", true));
                if (dBase.trades.get(uid) < qty) return await i.reply(funcs.createEmbed('Not Enough Trades', `You tried to sell \`${qty}\` bot trades..\nTrade Total: \`${dBase.trades.get(uid)}\`/\`${qty}\``, true));

                dBase.trades.remove(uid, qty);
                dBase.coins.add(uid, qty * sellRate);
                return await i.reply(funcs.createEmbed('Exchange Complete', `You exchanged \`${qty}\` Bot Trades for \`${(qty * sellRate).toLocaleString()}\` coins`, true));
            });

            col.on('end', async () => {
                await (message as any).edit(funcs.createEmbed('Exchange Shop', `${body}\n\n-# This rotation has ended..`, false, cont => cont.addActionRowComponents(() => row(true)))).catch(() => null);
            });
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
