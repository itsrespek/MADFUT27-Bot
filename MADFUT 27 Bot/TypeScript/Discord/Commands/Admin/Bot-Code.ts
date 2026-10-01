import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";

import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import { Functions } from "../../../Functions.js";
import { Trading } from "../../../MADFUT/Trading.js";
import { Requests } from "../../../MADFUT/Requests.js";
import { QueuedUser } from "../../Helpers/Types.js";

export default class BotCode extends Command {
    constructor() {
        super("botcode", "[ADMIN]: MADFUT Bot Code..", [
            {
                name: "duration",
                description: "How Long? (Minutes)",
                type: ApplicationCommandOptionType.Integer,
                required: true,
            },
            {
                name: "type",
                description: "Normal, Invite Bot OR Accept Invite",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: "Normal", value: "normal" },
                    { name: "Invite Bot", value: "invitebot" },
                    { name: "Accept Invite", value: "acceptinv" },
                ],
            },
            {
                name: "wishlist",
                description: "Wishlist | Yes Or No?",
                type: ApplicationCommandOptionType.Boolean,
                required: false,
            },
        ]);
    }

    async run(
        c: DiscordClient,
        int: CommandInteraction,
        args: {
            duration: number;
            wishlist?: boolean;
            type: string;
        },
    ) {
        try {
            const funcs = new Functions();
            const req = new Requests();

            const wishlist = args.wishlist ?? true;
            const type = args.type;

            await req.getToken();

            const botUsername = req.Info.Username!.toLocaleLowerCase();
            const endTime = Date.now() + args.duration * 60000;
            const discordTimestamp = `<t:${Math.floor(endTime / 1000)}:R>`;
            const durationText = args.duration === 1 ? "1 minute" : `${args.duration} minutes`;
            const modeName = type === "invitebot" ? "Invite Bot" : type === "acceptinv" ? "Accept Invite" : "Normal";

            await int.reply(funcs.createEmbed("Bot Code Started", `Invite Username: \`${botUsername}\`\nLength: \`${durationText}\` (${discordTimestamp})\nWishlist: \`${wishlist}\`\nMode: \`${modeName}\``, false ));

            let tradesDone = 0;
            let isRunning = true;
            let activeTrades = 0;

            const userQueue: QueuedUser[] = [];
            const bannedUsers: string[] = [];
            const noInteractionUsers: string[] = [];
            const leftUsers: string[] = [];

            const uniqueUsers = new Set<string>();
            const queuedUsers = new Set<string>();

            const inviteListener = (async () => {
                while (isRunning && Date.now() < endTime) {
                    try {
                        await req.listenForInvite(req.Info.IDToken!, req.Info.BotUID!,
                            async (data: any) => {
                                if (!data?.inviterUsername) return { MSG: "InvalidInvite" };

                                const username = String(data.inviterUsername).trim().toLowerCase();
                                uniqueUsers.add(username);

                                if (type === "acceptinv") {
                                    if (!data.inviterUid) {
                                        console.log("Accept Invite: invite received but no inviter UID was found:", data);
                                        return { MSG: "InvalidInvite" };
                                    }
                                    userQueue.push({ name: username, uid: String(data.inviterUid).trim() });
                                    return { MSG: "GotUser", skipDelete: true };
                                }

                                if (type === "invitebot") {
                                    userQueue.push({ name: username });
                                    return { MSG: "GotUser" };
                                }

                                if (!queuedUsers.has(username)) {
                                    queuedUsers.add(username);
                                    userQueue.push({ name: username });
                                }
                                return { MSG: "GotUser" };
                            },
                            500,
                            30000,
                        );
                    } 
                    catch {
                        if (isRunning && Date.now() < endTime) await funcs.sleep(500);
                    }
                }
            })();

            const tradeProcessor = (async () => {
                while (isRunning || userQueue.length > 0) {
                    if (userQueue.length === 0) {
                        if (!isRunning) break;
                        await funcs.sleep(100);
                        continue;
                    }

                    const nextUser = userQueue.shift()!;
                    if (type !== "invitebot" && type !== "acceptinv") queuedUsers.delete(nextUser.name);
                    if (!isRunning || Date.now() >= endTime) continue;

                    activeTrades++;
                    const r = new Requests();

                    try {
                        await r.getToken();
                        if (type === "normal" || type === "invitebot") await r.inviteUser(nextUser.name);
                        if (type === "acceptinv") {
                            if (!nextUser.uid) {
                                console.log(`Accept Invite: No UID available for ${nextUser.name}`);
                                continue;
                            }
                            await r.acceptInvite(nextUser.uid);
                            // Delete invite after acceptance attempt
                            /* try {
                                const idToken = r.Info.IDToken!, botUID = r.Info.BotUID!;
                                const firestoreBase = "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents";
                                await axios.delete(`${firestoreBase}/onlineInvites/${botUID}/invites/${nextUser.uid}`, { headers: { Authorization: `Bearer ${idToken}` } });
                            } catch (deleteErr) {
                                // Ignore delete errors
                            } */
                        }

                        const queueResult = await r.listenQueue(r.Info.IDToken!, r.Info.BotUID!,
                            async (doc: any) => {
                                if (!doc?.roomId) return { MSG: "No Interaction" };

                                const trading = new Trading(r.Info.IDToken!);
                                const ws = await trading.getWS();
                                return await trading.trade({ amHosting: doc.isHost, tradeId: doc.roomId }, ws, int.user.id, wishlist, true, false);
                            },
                            500,
                            30000,
                        );

                        if (queueResult?.MSG === "Trade Worked") tradesDone++;
                        else if (queueResult?.MSG === "Cheater" || queueResult?.MSG === "Spam") bannedUsers.push(nextUser.name);
                        else if (queueResult?.MSG === "No Interaction") noInteractionUsers.push(nextUser.name);
                        else if (queueResult?.MSG === "UserLeft") leftUsers.push(nextUser.name);
                        if (type === "normal" && isRunning && Date.now() < endTime && !["Cheater", "Spam"].includes(queueResult?.MSG)) {
                            if (!queuedUsers.has(nextUser.name)) {
                                queuedUsers.add(nextUser.name);
                                userQueue.push(nextUser);
                            }
                        }
                        if (queueResult?.MSG === "Trade Worked") {
                            await int.editReply(funcs.createEmbed("Bot Code Running", `Invite Username: \`${botUsername}\`\nEnds: ${discordTimestamp}\nTrades: \`${tradesDone}\` | Inviter's: \`${uniqueUsers.size}\`\nWishlist: \`${wishlist}\`\nMode: \`${modeName}\``, false,),);
                        }
                    } 
                    catch (e) {
                        console.log(e);
                    } 
                    finally {
                        r.releaseToken();
                        activeTrades--;
                    }
                }
            })();

            await funcs.sleep(Math.max(0, endTime - Date.now()));
            isRunning = false;

            // Wait a maximum of 5 seconds for any final invite poll to finish
            await Promise.race([inviteListener, funcs.sleep(5000)]);

            const tradeWaitStart = Date.now();
            // Wait for active trades, but cap it at 30 seconds
            while (activeTrades > 0 && Date.now() - tradeWaitStart < 30000) {
                await funcs.sleep(500);
            }

            // Give the processor a short window to finish its loop
            await Promise.race([tradeProcessor, funcs.sleep(5000)]);
            const section = (label: string, users: string[]) => users.length > 0 ? `\n\n${label}: \`${users.length}\`x (${users.join(", ")})\n` : "";

            const summary = section("Banned", bannedUsers) + section("No Interaction", noInteractionUsers) + section("Left Trade", leftUsers) || "No issues to report!";

            req.releaseToken();
            await int.followUp(funcs.createEmbed("Bot Code Completed", `Invite Username: \`${botUsername}\`\nTrades: \`${tradesDone}\` | Inviter's: \`${uniqueUsers.size}\`\nWishlist: \`${wishlist}\`\nMode: \`${modeName}\` ${summary}`, false),);
        } 
        catch (e: any) {
            console.log(e);
            const errorEmbed = new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true,);
            if (int.replied || int.deferred) {
                await int.followUp(errorEmbed);
            } 
            else {
                await int.reply(errorEmbed);
            }
        }
    }
}
