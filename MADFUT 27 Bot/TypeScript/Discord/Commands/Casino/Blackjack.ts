import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';

const SUITS = ['♠️', '♥️', '♦️', '♣️'];

function drawCard() {
    const v = Math.floor(Math.random() * 13) + 1;
    return { rank: v === 1 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v), value: Math.min(v, 10), suit: SUITS[Math.floor(Math.random() * 4)] };
}

function handTotal(cards: { rank: string; value: number }[]) {
    let sum = cards.reduce((acc, card) => acc + card.value, 0), aces = cards.filter(card => card.rank === 'A').length;
    while (sum > 21 && aces > 0) { sum -= 10; aces--; }
    return sum;
}

export default class Blackjack extends Command {
    constructor() {
        super(
            'blackjack',
            'Play blackjack against the house.. | Win x2, Natural x2.5',
            [
                { name: 'currency', description: 'What do you bet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Coins', value: 'coins' }, { name: 'Bot Trades', value: 'trades' }] },
                { name: 'amount', description: 'How much do you bet?', type: ApplicationCommandOptionType.Integer, required: true }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { currency: 'coins' | 'trades', amount: number }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(); if (!funcs.isLinked(int)) return;
            const uid = String(int.user.id), wallet = args.currency === 'coins' ? dBase.coins : dBase.trades;

            if (!Number.isInteger(args.amount) || args.amount <= 0) return await int.reply(funcs.createEmbed("Invalid Bet", "You MUST bet an amount above `0`", true));
            const bal = wallet.get(uid);
            if (bal < args.amount) return await int.reply(funcs.createEmbed("Not Enough", `You can only bet what you have..\n${args.currency === 'coins' ? 'Coins' : 'Bot Trades'} Total: \`${bal.toLocaleString()}\`/\`${args.amount.toLocaleString()}\``, true));

            wallet.remove(uid, args.amount);

            let stake = args.amount, done = false;
            const currencyName = args.currency === 'coins' ? 'Coins' : 'Bot Trades';
            const playerCards = [drawCard(), drawCard()], dealerCards = [drawCard(), drawCard()];
            const row = () => new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('double').setLabel('Double').setStyle(ButtonStyle.Secondary)
            );
            const hands = (revealDealer: boolean) => `Your Hand: ${playerCards.map(card => `${card.rank}${card.suit}`).join(' ')} (\`${handTotal(playerCards)}\`)\nDealer: ${dealerCards.map((card, i) => !revealDealer && i === 1 ? '??' : `${card.rank}${card.suit}`).join(' ')}${revealDealer ? ` (\`${handTotal(dealerCards)}\`)` : ""}\nBet: \`${stake.toLocaleString()}\` ${currencyName}`;
            const outcomeMult = () => handTotal(dealerCards) > 21 || handTotal(playerCards) > handTotal(dealerCards) ? 2 : handTotal(playerCards) === handTotal(dealerCards) ? 1 : 0;

            const dealerPlay = () => { while (handTotal(dealerCards) < 17) dealerCards.push(drawCard()); };
            const settle = async (mult: number, stage: string) => {
                if (done) return;
                done = true;

                const winnings = Math.floor(stake * mult);
                if (winnings > 0) wallet.add(uid, winnings);

                await int.editReply(funcs.createEmbed(stage, `${hands(true)}\n\n${winnings > 0 ? `Payout: \`${winnings.toLocaleString()} ${currencyName}\`` : 'The house wins..'}`));
                col.stop();
            };

            await int.reply(funcs.createEmbed("Blackjack", `${hands(false)}\n\nHit or Stand?`, false, cont => cont.addActionRowComponents(row)));
            const col = (await int.fetchReply() as any).createMessageComponentCollector({ componentType: ComponentType.Button });
            const timeout = setTimeout(async () => { await dealerPlay(); await settle(outcomeMult(), "Timed Out"); }, 120_000);
            col.on('end', () => clearTimeout(timeout));

            if (handTotal(playerCards) === 21) {
                await dealerPlay();
                return await settle(handTotal(dealerCards) === 21 ? 1 : 2.5, handTotal(dealerCards) === 21 ? "Push" : "Blackjack!");
            }

            col.on('collect', async (i: any) => {
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (i.user.id !== uid) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));

                if (i.customId === 'hit') {
                    playerCards.push(drawCard());

                    if (handTotal(playerCards) > 21) { await i.deferUpdate(); await dealerPlay(); return await settle(0, "Bust!"); }
                    return await i.update(funcs.createEmbed("Blackjack", `${hands(false)}\n\nHit or Stand?`, false, cont => cont.addActionRowComponents(row)));
                }

                if (i.customId === 'double') {
                    if (playerCards.length !== 2) return await i.reply(funcs.createEmbed("Can't Double", "You can ONLY double on your first move", true));
                    if (wallet.get(uid) < stake) return await i.reply(funcs.createEmbed("Not Enough", `You can only double what you have..\n${currencyName} Total: \`${wallet.get(uid).toLocaleString()}\`/\`${stake.toLocaleString()}\``, true));

                    wallet.remove(uid, stake);
                    stake *= 2;
                    playerCards.push(drawCard());

                    await i.deferUpdate();
                    if (handTotal(playerCards) > 21) return await settle(0, "Bust!");

                    await dealerPlay();
                    return await settle(outcomeMult(), "Doubled!");
                }

                if (i.customId === 'stand') {
                    await i.deferUpdate();
                    await dealerPlay();
                    return await settle(outcomeMult(), handTotal(dealerCards) > 21 ? "Dealer Busted!" : "You Stood");
                }
            });
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
