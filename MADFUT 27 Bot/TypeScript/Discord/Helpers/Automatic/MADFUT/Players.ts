import { Client, TextChannel } from "discord.js";
import { autoPlayerResp, PlayerData } from "../../Interface.js";
import axios from "axios";
import Configuration from "../../../../Configuration.js";
import MADFUTDB from "../../../../Database.js";
import { Functions } from "../../../../Functions.js";

const config = new Configuration();
const db = new MADFUTDB();
const func = new Functions()

export default async function PlayerUpdater(client: Client) {
    const { data }: { data: autoPlayerResp } = await axios.get(`${config.MADFUT.URLs.FireStore}/updates`)
    const oPlayer = db.cardInfo.getAll(), original = oPlayer.length, uPlayers: PlayerData[] = [], uPlayerColour: Record<string, number> = {};

    for (const doc of data.documents) {
        const val = doc.fields?.players?.arrayValue?.values; if (!Array.isArray(val)) continue;
        
        for (const docPlayer of val) {
            const playerId = docPlayer.mapValue.fields.id?.stringValue;
            if (playerId && !oPlayer.some(p => p.id === playerId)) {
                const f = docPlayer.mapValue.fields;
                const nPlayer: PlayerData = {
                    ID: playerId,
                    BaseID: f.baseId?.integerValue?.toString() || "0",
                    ItemId: f.itemId?.integerValue?.toString() || "0",
                    Name: f.name?.stringValue || 'Unknown Player',
                    Rating: f.rating?.integerValue || 0,
                    Card: f.color?.stringValue || 'Unknown',
                    Position: f.position?.stringValue || 'Unknown',
                    AltPositions: f.altPositions?.stringValue || '',
                    Stats: {
                        "Speed/Pace": f.pace?.integerValue || 0,
                        Shooting: f.shooting?.integerValue || 0,
                        Passing: f.passing?.integerValue || 0,
                        Dribbling: f.dribbling?.integerValue || 0,
                        Defending: f.defending?.integerValue || 0,
                        Physicality: f.physicality?.integerValue || 0,
                        Control: f.control?.integerValue || 0,
                        Defense: f.defense?.integerValue || 0
                    },
                    IDs: {
                        ClubId: f.clubId?.integerValue?.toString() || "0",
                        LeagueId: f.leagueId?.integerValue?.toString() || "0",
                        NationId: f.nationId?.integerValue?.toString() || "0"
                    },
                    CardURL: f.url?.stringValue || '',
                    Man: f.man?.booleanValue ? "1" : "0",
                    InGame: {
                        Packable: f.packable?.booleanValue ? "1" : "0",
                        Picks: f.inPicks?.booleanValue ? "1" : "0",
                        Tokens: f.inTokens?.booleanValue ? "1" : "0",
                        Tradable: f.tradable?.booleanValue ? "1" : "0",
                        TOTWNumber: f.totwNumber?.integerValue?.toString() || "0",
                        PremiumChem: f.premiumChem?.booleanValue ? "1" : "0"
                    },
                    Date: f.date?.integerValue || 0
                };
                uPlayers.push(nPlayer);
                uPlayerColour[f.color?.stringValue] = (uPlayerColour[f.color?.stringValue] || 0) + 1;
            }
        }
    }
    if (uPlayers.length > 0) {
        const dbPlayers = uPlayers.map(player => func.convertPlayerDataToDBFormat(player));
        db.updateMADFUTPlayers(dbPlayers.filter(player => player.id && player.name));

        const cType = Object.entries(uPlayerColour).map(([color, count]) => { return `\`${count}\` ${color.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}).join('\n');
        const mChannel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel;

        if (mChannel) {
            await mChannel.send(func.createEmbed(`<@&${config.Discord.Roles.PingRoles.MADFUTNews}>: New Cards`, `Added: ${uPlayers.length} Players\nTotal Cards: ${original + uPlayers.length}\n\n${cType.toUpperCase()}`));
        }
    }
}