import { Attachment, ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import axios from "axios";
import { Functions } from "../../../Functions.js";
import MADFUTDB from "../../../Database.js";
import Realm from "realm";
import fs from "fs";
import { PlayerData } from "../../Helpers/Interface.js";

export default class Dump extends Command {
    constructor() {
        super(
            "dump",
            "[DEV]: Update the MADFUT IDs..",
            [
                { name: 'file', description: 'Realm Database File', type: ApplicationCommandOptionType.Attachment, required: true }
            ]
        );
    }

    async run(c: DiscordClient, int: ChatInputCommandInteraction) {
        try {
            const funcs = new Functions(), dBase = new MADFUTDB(), file = int.options.getAttachment("file") as Attachment, fName = `temp_${Date.now()}.realm`;

            await int.reply(funcs.createEmbed("Update Dump", "Reading the database..\nNote: This may take a few seconds.."));
            const r = await axios.get(file.url, { responseType: 'arraybuffer' });
            if (r.status !== 200) return await int.followUp(funcs.sendErr("Invalid File: Couldn't download the Realm database.."));

            fs.writeFileSync(fName, r.data);
            const realm = await Realm.open({
                path: fName,
                schema: [funcs.MyObjectSchema],
                schemaVersion: 2,
                onMigration: (oldRealm, newRealm) => {
                    if (oldRealm.schemaVersion < 2) {
                        const oldD = oldRealm.objects("Player");
                        const newD = newRealm.objects("Player");
                        for (let i = 0; i < oldD.length; i++) {
                            const oldValue = oldD[i].specialChem;
                            const boolValue = typeof oldValue === "boolean" ? oldValue : oldValue === "true" ? true : false;
                            newD[i].premiumChem = boolValue;
                        }
                    }
                },
            });
            const players: PlayerData[] = realm.objects('Player').map((obj: any) => {
                return {
                    ID: obj.id || '',
                    BaseID: obj.baseId?.toString() || '',
                    ItemId: obj.itemId?.toString() || '',
                    Name: obj.name || '',
                    Rating: obj.rating || 0,
                    Card: obj.color || '', 
                    Position: obj.position || '',
                    AltPositions: obj.altPositions || '',
                    Stats: {
                        "Speed/Pace": obj.PAC || 0,
                        Shooting: obj.SHO || 0,
                        Passing: obj.PAS || 0,
                        Dribbling: obj.DRI || 0,
                        Defending: obj.DEF || 0,
                        Physicality: obj.PHY || 0,
                        Control: obj.control || 0,
                        Defense: obj.defense || 0
                    },
                    IDs: {
                        ClubId: obj.clubId?.toString() || '',
                        LeagueId: obj.leagueId?.toString() || '',
                        NationId: obj.nationId?.toString() || ''
                    },
                    CardURL: obj.url?.toString() || '',
                    Man: obj.man?.toString() || '',
                    InGame: {
                        Packable: obj.packable?.toString() || '',
                        Picks: obj.inPicks?.toString() || '',
                        Tokens: obj.inTokens?.toString() || '',
                        Tradable: obj.tradable?.toString() || '',
                        TOTWNumber: obj.totwNumber?.toString() || '',
                        PremiumChem: obj.premiumChem?.toString() || '',
                    },
                    Date: obj.date || 0
                };
            });
            
            realm.close();
            fs.unlinkSync(fName);
            const convertedPlayers = players.map(player => funcs.convertPlayerDataToDBFormat(player));
            if (convertedPlayers.filter(player => !player.id || !player.name).length > 0) console.warn(`Found ${convertedPlayers.filter(player => !player.id || !player.name).length} invalid players (missing id or name)`);

            const updatedCount = dBase.updateMADFUTPlayers(convertedPlayers.filter(player => player.id && player.name));
            await int.followUp(funcs.createEmbed("MADFUT 27: Dump Updated", `Total Players Found: \`${players.length}\`\nValid Players: \`${convertedPlayers.filter(player => player.id && player.name).length}\`\nInvalid Players: \`${convertedPlayers.filter(player => !player.id || !player.name).length}\`\nAdded/Updated: \`${updatedCount}\``));
        }
        catch (e) {
            console.error(e);
            await int.followUp(new Functions().sendErr(e instanceof Error ? e.message : String(e)));
        }
    }
}