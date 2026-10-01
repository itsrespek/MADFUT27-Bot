import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { CustomPackRow, UserPack } from "./Discord/Helpers/Interface.js";

class MADFUTDB {
    private db: DatabaseType;
    constructor() {
        this.db = new Database("database.sqlite");
        this.db.pragma("journal_mode = WAL");
        this.init();
    }

    private init() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS madfut27tables (
                userId TEXT UNIQUE PRIMARY KEY, 
                username TEXT UNIQUE, 
                coins INTEGER NOT NULL DEFAULT 0, 
                trades INTEGER NOT NULL DEFAULT 0, 
                packduos INTEGER NOT NULL DEFAULT 0, 
                dailyCooldown INTEGER NOT NULL DEFAULT 0, 
                staffRewards INTEGER NOT NULL DEFAULT 0,
                claimed5Bots INTEGER NOT NULL DEFAULT 0, 
                messages INTEGER NOT NULL DEFAULT 0, 
                custompacktokens INTEGER NOT NULL DEFAULT 0,
                playerpicks INTEGER NOT NULL DEFAULT 0,
                pendingInvites INTEGER NOT NULL DEFAULT 0,
                lastMessageMilestone INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS madfut27rewardroles (
                userId TEXT PRIMARY KEY, 
                bronze BOOLEAN DEFAULT FALSE, 
                silver BOOLEAN DEFAULT FALSE, 
                gold BOOLEAN DEFAULT FALSE, 
                totw BOOLEAN DEFAULT FALSE, 
                fut_champ BOOLEAN DEFAULT FALSE, 
                ucl BOOLEAN DEFAULT FALSE, 
                future_stars BOOLEAN DEFAULT FALSE, 
                toty_nominee BOOLEAN DEFAULT FALSE, 
                moments BOOLEAN DEFAULT FALSE, 
                icon BOOLEAN DEFAULT FALSE, 
                toty BOOLEAN DEFAULT FALSE, 
                tots BOOLEAN DEFAULT FALSE
            );
            CREATE TABLE IF NOT EXISTS madfut27cards (
                id TEXT PRIMARY KEY, 
                name TEXT NOT NULL, 
                baseId INTEGER NOT NULL,
                rating INTEGER NOT NULL, 
                position TEXT NOT NULL, 
                altPositions TEXT, 
                color TEXT, 
                clubId INTEGER, 
                leagueId INTEGER, 
                nationId INTEGER, 
                url INTEGER DEFAULT 0, 
                man INTEGER DEFAULT 0, 
                tradable INTEGER DEFAULT 0, 
                inTokens INTEGER DEFAULT 0, 
                inPicks INTEGER DEFAULT 0, 
                premiumChem INTEGER DEFAULT 0, 
                totwNumber INTEGER, 
                packable INTEGER, 
                date INTEGER, 
                PAC INTEGER, 
                SHO INTEGER, 
                PAS INTEGER, 
                DRI INTEGER, 
                DEF INTEGER, 
                PHY INTEGER, 
                attack INTEGER, 
                control INTEGER, 
                defense INTEGER, 
                itemId INTEGER
            );
            CREATE TABLE IF NOT EXISTS madfut27walletcards (
                userId TEXT NOT NULL, 
                card_id TEXT NOT NULL, 
                total INTEGER NOT NULL DEFAULT 0,

                PRIMARY KEY (userId, card_id), 
                FOREIGN KEY (card_id) REFERENCES madfut27cards(id)
            );
            CREATE TABLE IF NOT EXISTS madfut27userpacks (
                userId TEXT NOT NULL, 
                pack_id TEXT NOT NULL, 
                total INTEGER NOT NULL DEFAULT 0,

                PRIMARY KEY (userId, pack_id)
            );
            CREATE TABLE IF NOT EXISTS madfut27custompacks (
                id TEXT PRIMARY KEY, 
                userId TEXT NOT NULL, 
                name TEXT NOT NULL, 
                minRating INTEGER NOT NULL, 
                maxRating INTEGER NOT NULL, 
                nationId INTEGER, 
                position TEXT, 
                created INTEGER
            );
            CREATE TABLE IF NOT EXISTS security (
                userId TEXT UNIQUE NOT NULL, 
                whitelisted TEXT, 
                blacklisted TEXT
            );
            CREATE TABLE IF NOT EXISTS madfut27pendinggiveaways (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                userId TEXT NOT NULL, 
                label TEXT NOT NULL, 
                coins INTEGER NOT NULL DEFAULT 0, 
                trades INTEGER NOT NULL DEFAULT 0, 
                packduos INTEGER NOT NULL DEFAULT 0, 
                ctokens INTEGER NOT NULL DEFAULT 0, 
                picks INTEGER NOT NULL DEFAULT 0, 
                cards TEXT, 
                packs TEXT, 
                cPacks TEXT
            );
        `);
        try {
            this.db.prepare("SELECT lastMessageMilestone FROM madfut27tables LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN lastMessageMilestone INTEGER NOT NULL DEFAULT 0");
        }
        try {
            this.db.prepare("SELECT pendingInvites FROM madfut27tables LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN pendingInvites INTEGER NOT NULL DEFAULT 0");
        }
        try {
            this.db.prepare("SELECT packduos FROM madfut27tables LIMIT 1").get();
            this.db.prepare("SELECT messages FROM madfut27tables LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN packduos INTEGER NOT NULL DEFAULT 0");
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN messages INTEGER NOT NULL DEFAULT 0");
        }
        try {
            this.db.prepare("SELECT custompacktokens FROM madfut27tables LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN custompacktokens INTEGER NOT NULL DEFAULT 0");
        }
        try {
            this.db.prepare("SELECT playerpicks FROM madfut27tables LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN playerpicks INTEGER NOT NULL DEFAULT 0");
        }
        try {
            this.db.prepare("SELECT glasscooldown FROM madfut27tables LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27tables ADD COLUMN glasscooldown INTEGER NOT NULL DEFAULT 0");
        }
        try {
            this.db.prepare("SELECT ctokens FROM madfut27pendinggiveaways LIMIT 1").get();
            this.db.prepare("SELECT packs FROM madfut27pendinggiveaways LIMIT 1").get();
            this.db.prepare("SELECT cPacks FROM madfut27pendinggiveaways LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27pendinggiveaways ADD COLUMN ctokens INTEGER NOT NULL DEFAULT 0");
            this.db.exec("ALTER TABLE madfut27pendinggiveaways ADD COLUMN packs TEXT");
            this.db.exec("ALTER TABLE madfut27pendinggiveaways ADD COLUMN cPacks TEXT");
        }
        try {
            this.db.prepare("SELECT picks FROM madfut27pendinggiveaways LIMIT 1").get();
        }
        catch {
            this.db.exec("ALTER TABLE madfut27pendinggiveaways ADD COLUMN picks INTEGER NOT NULL DEFAULT 0");
        }
    }


    updateMADFUTPlayers(players: any[]) {
        const stmt = this.db.prepare(`INSERT INTO madfut27cards (id, name, baseId, rating, position, altPositions, color, clubId, leagueId, nationId, url, man, tradable, inTokens, inPicks, premiumChem, totwNumber, packable, date, PAC, SHO, PAS, DRI, DEF, PHY, attack, control, defense, itemId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, baseId = excluded.baseId, rating = excluded.rating, position = excluded.position, altPositions = excluded.altPositions, color = excluded.color, clubId = excluded.clubId, leagueId = excluded.leagueId, nationId = excluded.nationId, url = excluded.url, man = excluded.man, tradable = excluded.tradable, inTokens = excluded.inTokens, inPicks = excluded.inPicks, premiumChem = excluded.premiumChem, totwNumber = excluded.totwNumber, packable = excluded.packable, date = excluded.date, PAC = excluded.PAC, SHO = excluded.SHO, PAS = excluded.PAS, DRI = excluded.DRI, DEF = excluded.DEF, PHY = excluded.PHY, attack = excluded.attack, control = excluded.control, defense = excluded.defense, itemId = excluded.itemId`);
        const tr = this.db.transaction((players: any[]) => {
            for (const player of players) {
                stmt.run(
                    player.id, player.name || 'Unknown Player', player.baseId || 0, player.rating || 0, player.position || 'Unknown',
                    player.altPositions || null, player.color || null, player.clubId || null, player.leagueId || null, player.nationId || null, player.url ? 1 : 0, player.man ? 1 : 0, player.tradable ? 1 : 0, player.inTokens ? 1 : 0,
                    player.inPicks ? 1 : 0, player.premiumChem ? 1 : 0, player.totwNumber || null, player.packable || null, player.date || null,
                    player.PAC || 0, player.SHO || 0, player.PAS || 0, player.DRI || 0, player.DEF || 0,
                    player.PHY || 0, player.attack || 0, player.control || 0, player.defense || 0, player.itemId || null);
            }
        });
        tr(players);
        return players.length;
    }

    get username() {
        return {
            set: (userId: string, username: string | null) => this.db.prepare(`INSERT INTO madfut27tables (userId, username) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET username = excluded.username`).run(userId, username),
            getFromUID: (userId: string) => this.db.prepare("SELECT username FROM madfut27tables WHERE userId = ?").pluck().get(userId) as string | null ?? null,
            getUIDFromUsername: (username: string) => this.db.prepare("SELECT userId FROM madfut27tables WHERE username = ?").pluck().get(username) as string | null ?? null
        };
    }

    get security() {
        return {
            ban: (userId: string, reason: string = "None") => {
                return this.db.prepare(`INSERT INTO security (userId, blacklisted, whitelisted) VALUES (?, ?, NULL) ON CONFLICT(userId) DO UPDATE SET blacklisted = excluded.blacklisted, whitelisted = NULL`).run(userId, reason);
            },
            unban: (userId: string) => {
                return this.db.prepare(`INSERT INTO security (userId, whitelisted, blacklisted) VALUES (?, 'Unbanned', NULL) ON CONFLICT(userId) DO UPDATE SET whitelisted = 'Unbanned', blacklisted = NULL`).run(userId);
            },
            isBanned: (userId: string) => {
                const r = this.db.prepare("SELECT blacklisted FROM security WHERE userId = ?").pluck().get(userId);
                return r !== null && r !== undefined;
            },
            getAllBanned: () => {
                return this.db.prepare("SELECT userId, blacklisted FROM security WHERE blacklisted IS NOT NULL").all() as { userId: string; blacklisted: string; }[];
            },
            getBanReason: (userId: string) => {
                const r = this.db.prepare("SELECT blacklisted FROM security WHERE userId = ?").pluck().get(userId) as string | null;
                return r || "None";
            },
        }
    }

    get rewards() {
        return {
            get: (userId: string) => this.db.prepare("SELECT claimed5Bots FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            set: (userId: string, value: number) => this.db.prepare("UPDATE madfut27tables SET claimed5Bots = ? WHERE userId = ?").run(value, userId),
            add: (userId: string, sum: number = 1) => this.db.prepare("UPDATE madfut27tables SET claimed5Bots = claimed5Bots + ? WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET claimed5Bots = 0 WHERE userId = ?").run(userId)
        };
    }

    get giveawayWinnings() {
        return {
            add: (userId: string, winning: { label: string; coins?: number; trades?: number; packduos?: number; ctokens?: number; picks?: number; cards?: { card_id: string; quantity: number }[]; packs?: { pack_id: string; quantity: number }[]; cPacks?: CustomPackRow[] }) => this.db.prepare("INSERT INTO madfut27pendinggiveaways (userId, label, coins, trades, packduos, ctokens, picks, cards, packs, cPacks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(userId, winning.label, winning.coins ?? 0, winning.trades ?? 0, winning.packduos ?? 0, winning.ctokens ?? 0, winning.picks ?? 0, winning.cards?.length ? winning.cards.map(c => `${c.card_id}:${c.quantity}`).join(",") : null, winning.packs?.length ? winning.packs.map(p => `${p.pack_id}:${p.quantity}`).join(",") : null, winning.cPacks?.length ? JSON.stringify(winning.cPacks) : null),
            getAll: (userId: string) => {
                const rows = this.db.prepare("SELECT id, label, coins, trades, packduos, ctokens, picks, cards, packs, cPacks FROM madfut27pendinggiveaways WHERE userId = ?").all(userId) as { id: number; label: string; coins: number; trades: number; packduos: number; ctokens: number; picks: number; cards: string | null; packs: string | null; cPacks: string | null }[];
                return rows.map(r => ({ ...r, cards: r.cards ? r.cards.split(",").filter(Boolean).map(c => { const [card_id, quantity] = c.split(":"); return { card_id, quantity: parseInt(quantity) || 0 }; }) : [], packs: r.packs ? r.packs.split(",").filter(Boolean).map(p => { const [pack_id, quantity] = p.split(":"); return { pack_id, quantity: parseInt(quantity) || 0 }; }) : [], cPacks: r.cPacks ? JSON.parse(r.cPacks) as CustomPackRow[] : [] }));
            },
            remove: (id: number) => this.db.prepare("DELETE FROM madfut27pendinggiveaways WHERE id = ?").run(id)
        };
    }

    get staff() {
        return {
            get: (userId: string) => this.db.prepare("SELECT staffRewards FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            set: (userId: string, value: number) => this.db.prepare("UPDATE madfut27tables SET staffRewards = ? WHERE userId = ?").run(value, userId),
            add: (userId: string, sum: number = 1) => this.db.prepare("UPDATE madfut27tables SET staffRewards = staffRewards + ? WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET staffRewards = 0 WHERE userId = ?").run(userId)
        };
    }

    get rewardRoles() {
        return {
            get: (userId: string) => {
                const result = this.db.prepare("SELECT * FROM madfut27rewardroles WHERE userId = ?").get(userId) as any;
                if (result) return { userId: result.userId, bronze: Boolean(result.bronze), silver: Boolean(result.silver), gold: Boolean(result.gold), totw: Boolean(result.totw), fut_champ: Boolean(result.fut_champ), ucl: Boolean(result.ucl), future_stars: Boolean(result.future_stars), toty_nominee: Boolean(result.toty_nominee), moments: Boolean(result.moments), icon: Boolean(result.icon), toty: Boolean(result.toty), tots: Boolean(result.tots) } as { [key: string]: any };
                return { userId: userId, bronze: false, silver: false, gold: false, totw: false, fut_champ: false, ucl: false, future_stars: false, toty_nominee: false, moments: false, icon: false, toty: false, tots: false };
            },
            set: (userId: string, data: any) => {
                const stmt = this.db.prepare(`INSERT OR REPLACE INTO madfut27rewardroles (userId, bronze, silver, gold, totw, fut_champ, ucl, future_stars, toty_nominee, moments, icon, toty, tots) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                stmt.run(userId, data.bronze ? 1 : 0, data.silver ? 1 : 0, data.gold ? 1 : 0, data.totw ? 1 : 0, data.fut_champ ? 1 : 0, data.ucl ? 1 : 0, data.future_stars ? 1 : 0, data.toty_nominee ? 1 : 0, data.moments ? 1 : 0, data.icon ? 1 : 0, data.toty ? 1 : 0, data.tots ? 1 : 0);
            },
            remove: (userId: string, level: string) => {
                this.rewardRoles.set(userId, { ...this.rewardRoles.get(userId), [level]: false });
            },
            resetAll: (userId: string) => {
                this.db.prepare("DELETE FROM madfut27rewardroles WHERE userId = ?").run(userId);
            },
        };
    }

    get messages() {
        return {
            get: (userId: string) => this.db.prepare("SELECT messages FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number = 1) => this.db.prepare("INSERT INTO madfut27tables (userId, messages) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET messages = messages + excluded.messages").run(userId, sum),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET messages = 0 WHERE userId = ?").run(userId),
            getLastMilestone: (userId: string) => this.db.prepare("SELECT lastMessageMilestone FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            setLastMilestone: (userId: string, milestone: number) => this.db.prepare("UPDATE madfut27tables SET lastMessageMilestone = ? WHERE userId = ?").run(milestone, userId)
        };
    }

    get invites() {
        return {
            get: (userId: string) => this.db.prepare("SELECT pendingInvites FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number = 1) => this.db.prepare("INSERT INTO madfut27tables (userId, pendingInvites) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET pendingInvites = pendingInvites + excluded.pendingInvites").run(userId, sum),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET pendingInvites = 0 WHERE userId = ?").run(userId)
        };
    }

    get leaderboard() {
        return {
            getAll: () => this.db.prepare("SELECT userId, coins, trades, messages FROM madfut27tables WHERE username IS NOT NULL AND username != ''").all() as { userId: string; coins: number; trades: number; messages: number }[]
        };
    }

    get cardInfo() {
        return {
            getNameFromID: (cardId: string) => this.db.prepare("SELECT name FROM madfut27cards WHERE id = ?").pluck().get(cardId) as string | null ?? null,
            getIDFromName: (name: string) => this.db.prepare("SELECT id FROM madfut27cards WHERE name = ?").pluck().get(name) as string | null ?? null,
            getAll: () => this.db.prepare("SELECT id, name FROM madfut27cards").all() as { id: string; name: string }[],
            getTop3: () => {
                const topCards = this.db.prepare(`SELECT id FROM madfut27cards  WHERE rating > 0 ORDER BY rating DESC LIMIT 3`).all() as { id: string }[];
                return topCards.map(card => card.id);
            }
        };
    }

    get coins() {
        return {
            get: (userId: string) => this.db.prepare("SELECT coins FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET coins = coins + ? WHERE userId = ?").run(sum, userId),
            remove: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET coins = MAX(coins - ?, 0) WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET coins = 0 WHERE userId = ?").run(userId)
        };
    }

    get trades() {
        return {
            get: (userId: string) => this.db.prepare("SELECT trades FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET trades = trades + ? WHERE userId = ?").run(sum, userId),
            remove: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET trades = MAX(trades - ?, 0) WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET trades = 0 WHERE userId = ?").run(userId)
        };
    }

    get packduos() {
        return {
            get: (userId: string) => this.db.prepare("SELECT packduos FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET packduos = packduos + ? WHERE userId = ?").run(sum, userId),
            remove: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET packduos = MAX(packduos - ?, 0) WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET packduos = 0 WHERE userId = ?").run(userId)
        };
    }

    get cooldown() {
        return {
            get: (userId: string) => this.db.prepare("SELECT dailyCooldown FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, time: number) => this.db.prepare("UPDATE madfut27tables SET dailyCooldown = dailyCooldown + ? WHERE userId = ?").run(time, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET dailyCooldown = 0 WHERE userId = ?").run(userId)
        };
    }

    get glass() {
        return {
            get: (userId: string) => this.db.prepare("SELECT glasscooldown FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, time: number) => this.db.prepare("UPDATE madfut27tables SET glasscooldown = glasscooldown + ? WHERE userId = ?").run(time, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET glasscooldown = 0 WHERE userId = ?").run(userId)
        };
    }

    get cards() {
        return {
            getAll: (userId: string) => {
                const results = this.db.prepare("SELECT card_id, total FROM madfut27walletcards WHERE userId = ?").all(userId) as { card_id: string; total: number }[];
                return results.map(r => ({ CardID: r.card_id, Total: r.total }));
            },
            get: (userId: string, cardId: string) => this.db.prepare("SELECT total FROM madfut27walletcards WHERE userId = ? AND card_id = ?").pluck().get(userId, cardId) as number ?? 0,
            add: (userId: string, cardId: string, sum: number = 1) => this.db.prepare(`INSERT INTO madfut27walletcards (userId, card_id, total) VALUES (?, ?, ?) ON CONFLICT(userId, card_id) DO UPDATE SET total = total + excluded.total`).run(userId, cardId, sum),
            remove: (userId: string, cardId: string, sum: number = 1) => {
                this.db.prepare("UPDATE madfut27walletcards SET total = MAX(total - ?, 0) WHERE userId = ? AND card_id = ?").run(sum, userId, cardId);
                this.db.prepare("DELETE FROM madfut27walletcards WHERE userId = ? AND card_id = ? AND total = 0").run(userId, cardId);
            },
            reset: (userId: string) => this.db.prepare("DELETE FROM madfut27walletcards WHERE userId = ?").run(userId)
        };
    }

    get packs() {
        return {
            getAll: (userId: string) => {
                const results = this.db.prepare("SELECT pack_id, total FROM madfut27userpacks WHERE userId = ?").all(userId) as { pack_id: string; total: number }[];
                return results.map(r => ({ PackID: r.pack_id, Total: r.total })) as UserPack[];
            },
            get: (userId: string, packId: string) => this.db.prepare("SELECT total FROM madfut27userpacks WHERE userId = ? AND pack_id = ?").pluck().get(userId, packId) as number ?? 0,
            add: (userId: string, packId: string, sum: number = 1) => this.db.prepare(`INSERT INTO madfut27userpacks (userId, pack_id, total) VALUES (?, ?, ?) ON CONFLICT(userId, pack_id) DO UPDATE SET total = total + excluded.total`).run(userId, packId, sum),
            remove: (userId: string, packId: string, sum: number = 1) => {
                this.db.prepare("UPDATE madfut27userpacks SET total = MAX(total - ?, 0) WHERE userId = ? AND pack_id = ?").run(sum, userId, packId);
                this.db.prepare("DELETE FROM madfut27userpacks WHERE userId = ? AND pack_id = ? AND total = 0").run(userId, packId);
            },
            reset: (userId: string) => this.db.prepare("DELETE FROM madfut27userpacks WHERE userId = ?").run(userId)
        };
    }

    get customPacks() {
        return {
            create: (pack: CustomPackRow) => this.db.prepare(`INSERT OR REPLACE INTO madfut27custompacks (id, userId, name, minRating, maxRating, nationId, position, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(pack.id, pack.userId, pack.name, pack.minRating, pack.maxRating, pack.nationId, pack.position, Date.now()),
            get: (packId: string) => this.db.prepare("SELECT * FROM madfut27custompacks WHERE id = ?").get(packId) as CustomPackRow | undefined,
            getAll: (userId: string) => this.db.prepare("SELECT * FROM madfut27custompacks WHERE userId = ? ORDER BY created DESC").all(userId) as CustomPackRow[],
            transfer: (packId: string, userId: string) => this.db.prepare("UPDATE madfut27custompacks SET userId = ? WHERE id = ?").run(userId, packId),
            remove: (packId: string) => this.db.prepare("DELETE FROM madfut27custompacks WHERE id = ?").run(packId),
            resetAll: (userId: string) => this.db.prepare("DELETE FROM madfut27custompacks WHERE userId = ?").run(userId)
        };
    }

    get packTokens() {
        return {
            get: (userId: string) => this.db.prepare("SELECT custompacktokens FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET custompacktokens = custompacktokens + ? WHERE userId = ?").run(sum, userId),
            remove: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET custompacktokens = MAX(custompacktokens - ?, 0) WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET custompacktokens = 0 WHERE userId = ?").run(userId)
        };
    }

    get picks() {
        return {
            get: (userId: string) => this.db.prepare("SELECT playerpicks FROM madfut27tables WHERE userId = ?").pluck().get(userId) as number ?? 0,
            add: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET playerpicks = playerpicks + ? WHERE userId = ?").run(sum, userId),
            remove: (userId: string, sum: number) => this.db.prepare("UPDATE madfut27tables SET playerpicks = MAX(playerpicks - ?, 0) WHERE userId = ?").run(sum, userId),
            reset: (userId: string) => this.db.prepare("UPDATE madfut27tables SET playerpicks = 0 WHERE userId = ?").run(userId)
        };
    }

    get packCards() {
        return {
            getRandom: (minRating: number | null, maxRating: number | null, limit: number, nationId?: number | null, position?: string | null, exactRating?: number | null, colors?: string[] | null, specialOnly?: boolean) => {
                let query = "SELECT id FROM madfut27cards WHERE tradable = 1";
                const params: any[] = [];
                if (exactRating != null && exactRating > 0) { query += " AND rating = ?"; params.push(exactRating); }
                else {
                    if (minRating != null && minRating > 0) { query += " AND rating >= ?"; params.push(minRating); }
                    if (maxRating != null && maxRating > 0) { query += " AND rating <= ?"; params.push(maxRating); }
                }
                if (nationId) { query += " AND nationId = ?"; params.push(nationId); }
                if (position) { query += " AND position = ?"; params.push(position); }
                if (colors && colors.length > 0) { query += ` AND (${colors.map(() => "LOWER(color) LIKE ?").join(" OR ")})`; params.push(...colors.map(color => `${color.toLowerCase()}%`)); }
                if (specialOnly) { query += " AND LOWER(color) NOT LIKE 'gold%' AND LOWER(color) NOT LIKE 'silver%' AND LOWER(color) NOT LIKE 'bronze%'"; }
                query += " ORDER BY RANDOM() LIMIT ?";
                return this.db.prepare(query).all(...params, limit) as { id: string }[];
            }
        };
    }
}

export default MADFUTDB;