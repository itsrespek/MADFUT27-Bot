import { CommandInteraction, ContainerBuilder, GuildMemberRoleManager, MessageFlags, TextDisplayBuilder } from "discord.js";
import MADFUTDB from "./Database.js";
import { GamePacks } from "./Discord/Helpers/Packs.js";
import { CustomPackRow, TokenInfo } from "./Discord/Helpers/Interface.js";

const db = new MADFUTDB();

export class Functions {
    static tradelocks = new Map<string, number>();

    get lock() {
        return {
            has: (userId: string) => Functions.tradelocks.has(userId),
            add: (userId: string) => Functions.tradelocks.set(userId, Date.now()),
            remove: (userId: string) => Functions.tradelocks.delete(userId)
        };
    }

    sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    sendErr(err: string, ephemeral: boolean = true) {
        return this.createEmbed("Error", `Error: \`${err}\``, ephemeral);
    }
    isDeveloper(i: CommandInteraction) { 
        return ["232227470546305025"].includes(i.user.id);
    }
    missingRole(i: CommandInteraction) { 
        i.reply({ content: "> Missing Perms..", ephemeral: true }); 
    }
    wrongChannel(i: CommandInteraction, id: string) { 
        i.reply({ content: `> Go to: <#${id}>`, ephemeral: true }); 
    }
    slowDown(i: CommandInteraction) { 
        i.reply({ content: "Too Quick..", ephemeral: true }); 
    }

    hasRole(i: CommandInteraction, roleId: string, extraRoles: string[]) {
        if (!i.guild || !i.member) return false;
        const roles = i.member.roles as GuildMemberRoleManager;
        return (roleId && roles.cache.has(roleId)) || extraRoles.some(r => r && roles.cache.has(r));
    }
    createEmbed(t: string, c: string, ephemeral: boolean = false, build?: (cont: ContainerBuilder) => void) {
        const cont = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${t}`))
            .addSeparatorComponents(s => s.setSpacing(2))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`>>> ${c}`))
            .addSeparatorComponents(s => s.setSpacing(2));

        if (build) build(cont);
        
        const e: any = { components: [cont], flags: [MessageFlags.IsComponentsV2] };
        if (ephemeral) e.flags.push(MessageFlags.Ephemeral);
        return e;
    }
    isLinked(i: CommandInteraction) {
        const username = new MADFUTDB().username.getFromUID(i.user.id);
        if (!username) {
            i.reply(this.createEmbed("Not Linked", "You are NOT linked\nRun: `/link` to link first.", true));
            return false;
        }
        return username;
    }

    chunkArray<T>(arr: T[], size: number) {
        const chunks: T[][] = [];
        for (let i = 0; i < Math.min(arr.length, 100); i += size) chunks.push(arr.slice(i, i + size));
        return chunks;
    }
    rString(length: number = 10): string {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
    parseCards(cards: string): { quantity: number; card_id: string }[] {
        const r: { quantity: number; card_id: string }[] = [];
        for (const part of cards.split(/[,.]/)) {
            if (!part.trim()) continue;
            if (part.includes('-')) {
                continue;
            }

            const match = part.trim().match(/(?:(\d+)[x_=:\s*])?(id\d+)/);
            if (match) {
                const quantity = match[1] ? parseInt(match[1], 10) : 1, card_id = match[2];
                r.push({ quantity, card_id });
            }
        }
        return r;
    }
    parsePacks(packs: string): { quantity: number; pack_id: string }[] {
        const r: { quantity: number; pack_id: string }[] = [];
        for (const part of packs.split(/[,.]/)) {
            const entry = part.trim(); if (!entry) continue;

            const lower = entry.toLowerCase(), prefixed = entry.match(/^(\d+)\s*[xX_=:\s]\s*([A-Za-z0-9_]+)$/);
            if (prefixed && GamePacks[prefixed[2].toLowerCase()]) { r.push({ quantity: parseInt(prefixed[1], 10), pack_id: prefixed[2].toLowerCase() }); continue; }
            if (GamePacks[lower]) { r.push({ quantity: 1, pack_id: lower }); continue; }
            if (/^[A-Za-z0-9]+$/.test(entry)) { r.push({ quantity: 1, pack_id: entry }); continue; }
        }
        return r;
    }
    analyzeToken(token: string): TokenInfo {
        const parts = token.split(".");
        if (parts.length !== 3 || !parts[0] || !parts[1]) return { valid: false, detail: "Not a JWT.. No expiry data can be read from this" };
        try {
            const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"));
            if (typeof payload.exp !== "number") return { valid: true, detail: "Decoded as a JWT but it has no `exp` claim.. Expiry unknown" };
            return { valid: true, iat: typeof payload.iat === "number" ? payload.iat : undefined, exp: payload.exp, detail: "Valid JWT" };
        }
        catch {
            return { valid: false, detail: "Not a readable JWT.. No expiry data found" };
        }
    }
    expiryLines(info: TokenInfo): string {
        if (!info.valid || !info.exp) return `Expiry: ${info.detail}`;
        const now = Math.floor(Date.now() / 1000), left = info.exp - now;
        const d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60);
        const state = left <= 0 ? "**EXPIRED**" : `\`${d}d ${h}h ${m}m\` remaining`;
        const iat = info.iat ? `Issued: <t:${info.iat}:F>\n` : "";
        return `${info.detail}\n${iat}Expires: <t:${info.exp}:F> (<t:${info.exp}:R>)\nStatus: ${state}`;
    }
    resolvePacks(dBase: MADFUTDB, packs: string) {
        const standards: { pack_id: string; quantity: number }[] = [], customs: CustomPackRow[] = [], invalid: string[] = [];
        for (const pack of this.parsePacks(packs)) {
            if (GamePacks[pack.pack_id]) { standards.push({ pack_id: pack.pack_id, quantity: pack.quantity }); continue; }

            const custom = dBase.customPacks.get(pack.pack_id);
            if (custom && pack.quantity === 1) customs.push(custom);
            else invalid.push(pack.pack_id);
        }
        return { standards, customs, invalid };
    }
    MyObjectSchema = {
        name: 'Player',
        primaryKey: 'id',
        properties: {
            id: 'string',
            name: 'string',
            baseId: 'int',
            rating: 'int',
            position: 'string',
            altPositions: 'string',
            color: 'string',
            clubId: 'int',
            leagueId: 'int',
            nationId: 'int',
            url: 'bool',
            man: 'bool',
            tradable: 'bool',
            inTokens: 'bool',
            inPicks: 'bool',
            premiumChem: 'bool',
            totwNumber: 'int',
            packable: 'int',
            date: 'int',
            PAC: 'int',
            SHO: 'int',
            PAS: 'int',
            DRI: 'int',
            DEF: 'int',
            PHY: 'int',
            attack: 'int',
            control: 'int',
            defense: 'int',
            itemId: 'int'
        }
    };
    convertPlayerDataToDBFormat(playerData: any) {
        return {
            id: playerData.ID || '',
            name: playerData.Name || '',
            baseId: parseInt(playerData.BaseID) || 0,
            rating: playerData.Rating || 0,
            position: playerData.Position || '',
            altPositions: playerData.AltPositions || null,
            color: playerData.Card || null,
            clubId: parseInt(playerData.IDs?.ClubId) || null,
            leagueId: parseInt(playerData.IDs?.LeagueId) || null,
            nationId: parseInt(playerData.IDs?.NationId) || null,
            url: Boolean(playerData.CardURL),
            man: Boolean(playerData.Man),
            tradable: Boolean(playerData.InGame?.Tradable),
            inTokens: Boolean(playerData.InGame?.Tokens),
            inPicks: Boolean(playerData.InGame?.Picks),
            premiumChem: Boolean(playerData.InGame?.PremiumChem),
            totwNumber: parseInt(playerData.InGame?.TOTWNumber) || null,
            packable: parseInt(playerData.InGame?.Packable) || null,
            date: playerData.Date || null,
            PAC: playerData.Stats?.["Speed/Pace"] || 0,
            SHO: playerData.Stats?.Shooting || 0,
            PAS: playerData.Stats?.Passing || 0,
            DRI: playerData.Stats?.Dribbling || 0,
            DEF: playerData.Stats?.Defending || 0,
            PHY: playerData.Stats?.Physicality || 0,
            attack: playerData.Stats?.Attack || 0,
            control: playerData.Stats?.Control || 0,
            defense: playerData.Stats?.Defense || 0,
            itemId: parseInt(playerData.ItemId) || null
        };
    }
}

export interface GiveawayWinning {
    label: string;
    coins?: number;
    trades?: number;
    packduos?: number;
    ctokens?: number;
    picks?: number;
    cards?: { card_id: string; quantity: number }[];
    packs?: { pack_id: string; quantity: number }[];
    cPacks?: CustomPackRow[];
}

function applyWinning(userId: string, winning: GiveawayWinning) {
    if (winning.coins && winning.coins > 0) db.coins.add(userId, winning.coins);
    if (winning.trades && winning.trades > 0) db.trades.add(userId, winning.trades);
    if (winning.packduos && winning.packduos > 0) db.packduos.add(userId, winning.packduos);
    if (winning.ctokens && winning.ctokens > 0) db.packTokens.add(userId, winning.ctokens);
    if (winning.picks && winning.picks > 0) db.picks.add(userId, winning.picks);
    for (const card of winning.cards ?? []) db.cards.add(userId, card.card_id, card.quantity);
    for (const pack of winning.packs ?? []) db.packs.add(userId, pack.pack_id, pack.quantity);
    for (const custom of winning.cPacks ?? []) db.customPacks.create({ ...custom, userId });
}

export function addGiveawayWinning(userId: string, winning: GiveawayWinning) {
    db.giveawayWinnings.add(userId, winning);
}

export function payGiveawayWinning(userId: string, winning: GiveawayWinning) {
    applyWinning(userId, winning);
}

export function claimGiveaways(userId: string) {
    const winnings = db.giveawayWinnings.getAll(userId); if (!winnings.length) return null;

    const lines: string[] = [];
    for (const winning of winnings) {
        applyWinning(userId, winning);
        lines.push(winning.label);
        db.giveawayWinnings.remove(winning.id);
    }

    return `Claimed your giveaway win(s):\n${lines.join("\n")}`;
}