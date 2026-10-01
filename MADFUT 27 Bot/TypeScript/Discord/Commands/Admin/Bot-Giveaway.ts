import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import Command from '../../Helpers/Layout/CMDs.js';
import DiscordClient from '../../Client.js';
import MADFUTDB from '../../../Database.js';
import { Functions } from '../../../Functions.js';
import Configuration from '../../../Configuration.js';
import { Trading } from '../../../MADFUT/Trading.js';
import { Requests } from '../../../MADFUT/Requests.js';
import { ActiveBotGiveaway } from '../../Helpers/Interface.js';
import { getCurrentBotGiveaway, setCurrentBotGiveaway, clearBotGiveaway } from '../../Helpers/BotGiveaways.js';

const config = new Configuration();

export default class BotGiveaway extends Command {
    constructor() {
        super(
            'bot-giveaway',
            '[ADMIN]: Host a bot giveaway.. everyone who joins gets traded',
            [
                { name: 'start', description: 'How long until it starts?', type: ApplicationCommandOptionType.Integer, required: true, choices: [
                    { name: '30s', value: 30 },
                    { name: '45s', value: 45 },
                    { name: '1 Minute', value: 60 },
                    { name: '1 Minute, 30s', value: 90 },
                    { name: '2 Minutes', value: 120 },
                    { name: '3 Minutes', value: 180 },
                    { name: '5 Minutes', value: 300 },
                    { name: '10 Minutes', value: 600 }
                ]},
                { name: 'duration', description: 'How long does it run for?', type: ApplicationCommandOptionType.Integer, required: true, choices: [
                    { name: '30s', value: 30 },
                    { name: '45s', value: 45 },
                    { name: '1 Minute', value: 60 },
                    { name: '1 Minute, 30s', value: 90 },
                    { name: '2 Minutes', value: 120 },
                    { name: '3 Minutes', value: 180 },
                    { name: '5 Minutes', value: 300 }
                ]},
                { name: 'trades', description: 'How Many Trades Does EACH User Get?', type: ApplicationCommandOptionType.Integer, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { start: number, duration: number, trades?: number }) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), req = new Requests();
            if (getCurrentBotGiveaway()) return await int.reply(funcs.createEmbed("Already Running", "There's already a Bot Giveaway active\nUse `/force-end-bgw` to stop it first", true));

            const tradesPerUser = args.trades ?? Infinity; if (!(tradesPerUser > 0)) return await int.reply(funcs.createEmbed("Invalid Trades", "`trades` MUST be above `0`", true));

            const hostId = int.user.id, startsAt = Math.floor(Date.now() / 1000) + args.start, endsAt = startsAt + args.duration;
            const giveawayPing = config.Discord.Roles.PingRoles.Giveaways ? ` <@&${config.Discord.Roles.PingRoles.Giveaways}>` : "";
            const state: ActiveBotGiveaway = { hostId, channelId: int.channelId, messageId: '', tradesPerUser, startsAt, endsAt, phase: 'joining', forceStopped: false, entrants: new Set<string>(), skipped: 0, progress: new Map() };

            const row = (joined: number, joinOpen: boolean) => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('bgw_join').setLabel('Join').setStyle(ButtonStyle.Success).setDisabled(!joinOpen), new ButtonBuilder().setCustomId('bgw_count').setLabel(`Joined: ${joined}`).setStyle(ButtonStyle.Secondary).setDisabled(true));
            const joinEmbed = () => funcs.createEmbed("Bot Giveaway!", `Trading: \`${tradesPerUser.toLocaleString()}\` bot trades traded to EVERYONE who joins\nStarts: <t:${startsAt}:R>\nEnds: <t:${endsAt}:R>\nHost: <@${hostId}>\n\nClick join below..\nYou MUST be linked (\`/link\`)..`, false, cont => cont.addActionRowComponents(() => row(state.entrants.size, true)));

            await int.reply(joinEmbed());
            const message = await int.fetchReply();
            state.messageId = message.id;
            setCurrentBotGiveaway(state);

            let eligible: string[] = [], finished = false, lastEdit = 0, tradesDone = 0, usersTraded = 0;

            const planned = eligible.length * tradesPerUser;
            const statLine = () => `Joined: \`${state.entrants.size}\`\nTrades Done: \`${Number.isFinite(planned) ? `${tradesDone.toLocaleString()}/${planned.toLocaleString()}` : tradesDone.toLocaleString()}\` | Users Traded: \`${usersTraded}\``;
            const liveEmbed = () => funcs.createEmbed("Bot Giveaway LIVE!", `The bot giveaway has now started..\nCheck MADFUT for your invites!\n\n${statLine()}\nEnds: <t:${endsAt}:R>`, false, cont => cont.addActionRowComponents(() => row(state.entrants.size, false)));

            const finalize = async () => {
                if (finished) return;
                finished = true;

                if (state.startTimer) clearTimeout(state.startTimer);
                state.phase = 'ended';

                clearBotGiveaway();
                try { collector.stop('finalized'); } catch { }

                const forced = state.forceStopped ? `\nForce stopped by <@${hostId}>` : "";
                await message.edit(funcs.createEmbed("Bot Giveaway Ended", `${statLine()}${forced}`, false, cont => cont.addActionRowComponents(() => row(state.entrants.size, false)))).catch(() => null);
            };

            state.onForce = () => { if (state.phase === 'joining') finalize(); };

            const doTrade = async (userId: string, username: string): Promise<boolean> => {
                try {
                    await req.getToken();
                    if (!req.Info.AccessToken || !req.Info.BotUID) return false;

                    const WsConnection = await new Trading(req.Info.IDToken!).getWS();
                    await req.inviteUser(username);

                    const tradeResult = await req.listenQueue(req.Info.AccessToken!, req.Info.BotUID!, async (data: any) => {
                        if (data && data.roomId) return await new Trading(req.Info.IDToken!).trade({ amHosting: data.isHost, tradeId: data.roomId }, WsConnection, userId, true, true, false);
                    }, 500, 30000);
                    WsConnection.close();
                    req.releaseToken();

                    return typeof tradeResult === 'object' && tradeResult.MSG === "Trade Worked";
                }
                catch {
                    req.releaseToken();
                    return false;
                }
            };

            const pushEdit = async () => {
                if (Date.now() - lastEdit < 4000) return;
                lastEdit = Date.now();
                await message.edit(liveEmbed()).catch(() => null);
            };

            const beginLive = async () => {
                if (!state.entrants.size) {
                    finished = true;

                    if (state.startTimer) clearTimeout(state.startTimer);
                    state.phase = 'ended';

                    clearBotGiveaway();
                    await message.edit(funcs.createEmbed("No One Joined", `Nobody entered the giveaway..\nIt never started\nHost: <@${hostId}>`)).catch(() => null);
                    return;
                }

                state.phase = 'live';
                eligible = [...state.entrants].filter(id => !!dBase.username.getFromUID(id) && !dBase.security.isBanned(id));
                state.skipped = state.entrants.size - eligible.length;
                for (const id of eligible) state.progress.set(id, { done: 0, failed: 0 });

                const channel = await c.channels.fetch(state.channelId).catch(() => null) as any;
                if (channel?.send) await channel.send(funcs.createEmbed(`Bot Giveaway: ${giveawayPing}!`, `The bot giveaway has started with \`${eligible.length}\` people..\nCheck MADFUT for your invites!`)).catch(() => null);

                await message.edit(liveEmbed()).catch(() => null);

                while (Date.now() < endsAt * 1000 && !state.forceStopped) {
                    const next = eligible.find(id => { const p = state.progress.get(id)!; return p.done < tradesPerUser && p.failed < 3; });
                    if (!next) break;

                    const username = dBase.username.getFromUID(next)!;
                    const ok = await doTrade(next, username);
                    const p = state.progress.get(next)!;
                    if (ok) { p.done++; tradesDone++; if (p.done === 1) usersTraded++; }
                    else p.failed++;

                    console.log(`Bot Giveaway | ${username}: ${ok ? `${p.done}/${tradesPerUser}` : `Failed (${p.failed})`}`);
                    await pushEdit();
                }

                await finalize();
            };

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: args.start * 1000 });

            collector.on('collect', async (i: any) => {
                if (i.customId !== 'bgw_join' || state.phase !== 'joining') return;
                if (dBase.security.isBanned(i.user.id)) return await i.reply(funcs.createEmbed("Bot Banned", "You have been banned from using the bot..", true));
                if (!dBase.username.getFromUID(i.user.id)) return await i.reply(funcs.createEmbed("Not Linked", "You are NOT linked\nRun: `/link` to link first.\nThen you can join the giveaway!", true));
                if (state.entrants.has(i.user.id)) return await i.reply(funcs.createEmbed("Already Joined", "You've already joined this giveaway!", true));

                state.entrants.add(i.user.id);
                await i.update(joinEmbed());
            });

            collector.on('end', async () => {
                if (finished || state.phase !== 'joining') return;
                await beginLive();
            });

            state.startTimer = setTimeout(() => collector.stop('started'), args.start * 1000);
        }
        catch (e) {
            console.log(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}
