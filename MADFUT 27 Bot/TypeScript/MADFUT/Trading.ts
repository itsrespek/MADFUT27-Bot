import WebSocket from "ws";
import Configuration from "../Configuration.js";
import { Functions } from "../Functions.js";
import MADFUTDB from "../Database.js";

const config = new Configuration()
const funcs = new Functions()
const dBase = new MADFUTDB()

export class Trading {
    private MADFUTData = {
        Headers: config.MADFUT.Headers
    }
    private Info = {
        IDToken: null as string | null,
        BotUID: null as string | null
    }
    constructor(idToken: string) {
        try {
            const payload = JSON.parse(Buffer.from(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
            this.Info.BotUID = payload.user_id ?? payload.sub ?? null;
        }
        catch {
            throw new Error("Invalid ID Token");
        }
        if (!this.Info.BotUID || !idToken) throw new Error("Invalid ID Token");
        this.Info.IDToken = idToken;
    }

    async getWS(): Promise<WebSocket> {
        if (!this.Info.IDToken || !this.Info.BotUID) throw new Error("Not Logged In")

        return new Promise<WebSocket>((resolve) => {
            const ws = new WebSocket(`wss://trivela-madfut-online.europe-west1.firebasedatabase.app/.ws?ns=trivela-madfut-online&v=5`, { headers: { "X-Firebase-AppCheck": "", ...this.MADFUTData.Headers } });
            ws.on("open", () => {
                ws.send(JSON.stringify({ t: "d", d: { a: "auth", b: { cred: this.Info.IDToken } }}));
                resolve(ws);
            });
        });
    }

    async send(ws: WebSocket, action: string, data: Record<string, any>): Promise<void> {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify({
                t: "d",
                d: {
                    a: action,
                    b: data
                }
            });

            ws.send(payload, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async antiExploit(ws: WebSocket, data: any, amHosting: boolean, roomId: string, discordId: string): Promise<boolean> {
        console.log(`Anti Bot: ${JSON.stringify(data, null, 4)}`);
        
        try {
            if (data.a && typeof data.a === "object" && !Array.isArray(data.a)) data.a = Object.values(data.a);
            if (data.b && typeof data.b === "object" && !Array.isArray(data.b)) data.b = Object.values(data.b);
            if ((data.a !== undefined && !Array.isArray(data.a)) || (Array.isArray(data.a) && data.a.length > 3) || (data.b !== undefined && !Array.isArray(data.b)) || (Array.isArray(data.b) && data.b.length > 3)) {

                dBase.security.ban(discordId, "Exploit Attempt: Invalid Array");
                console.log(`Discord ID: ${discordId} | Exploit Attempt | Bot Banned`);

                await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
                console.log("AntiBot | 1st Failed");
                return false;
            }
            if (data.b !== undefined) {
                const keys = Object.keys(data.b);
                if (keys.length > 3) {

                    dBase.security.ban(discordId, "Exploit Attempt: Too Many Keys");
                    console.log(`Discord ID: ${discordId} | Exploit Attempt | Bot Banned`);

                    await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
                    console.log("AntiBot | 2nd Failed");
                    return false;
                }
                for (const key of keys) {
                    if (typeof key !== "string" || key.length === 0 || key.length > 50) {

                        dBase.security.ban(discordId, "Exploit Attempt: Invalid Key Format");
                        console.log(`Discord ID: ${discordId} | Exploit Attempt | Bot Banned`);

                        await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
                        console.log("AntiBot | 3rd Failed");
                        return false;
                    }
                }
            }
            for (const k of Object.keys(data)) {
                if (!["e", "a", "b", "x"].includes(k)) {

                    dBase.security.ban(discordId, "Exploit Attempt: Invalid Key Data");
                    console.log(`Discord ID: ${discordId} | Exploit Attempt | Bot Banned`);

                    await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
                    console.log("AntiBot | 4th Failed");
                    return false;
                }
            }
            if (data.a !== undefined) {
                const seenA = new Set();
                for (const item of data.a) {
                    if (typeof item !== "string" || item.length > 50 || seenA.has(item)) {

                        dBase.security.ban(discordId, "Exploit Attempt: Invalid Key Data");
                        console.log(`Discord ID: ${discordId} | Exploit Attempt | Bot Banned`);

                        await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
                        console.log("AntiBot | 5th Failed");
                        return false;
                    }
                    seenA.add(item);
                }
            }
            if (data.b !== undefined) {
                const seenB = new Set();
                for (const item of data.b) {
                    if (typeof item !== "string" || item.length > 50 || seenB.has(item)) {
                        
                        dBase.security.ban(discordId, "Exploit Attempt: Invalid Array Items | B");
                        console.log(`Discord ID: ${discordId} | Exploit Attempt | Bot Banned`);

                        await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
                        console.log("AntiBot | 6th Failed")
                        return false;
                    }
                    seenB.add(item);
                }
            }
            return true;
        } 
        catch (e) {
            console.log(e)
            await this.send(ws, "p", { p: `r/${roomId}/${amHosting ? "H" : "G"}`, d: null });
            return false;
        }
    }

    async trade(data: any, ws: WebSocket, discordId: string, cards: string[] | boolean, withdraw: boolean, deposit: boolean) {
        let intTime: ReturnType<typeof setTimeout>;
        let tDone = false;
        return new Promise((resolve, reject) => {
            try {
                const amHosting = data.amHosting, tradeId = data.tradeId, suffix = amHosting ? ["G", "g", "H", "h"] : ["H", "h", "G", "g"];
                let wishlist: any = [], w: any[] = [], lSlot = new Set<number>(), cSlot: number | null = null, actTime = performance.now(), lastCardPlace = 0;

                for (const s of suffix) this.send(ws, "q", { p: `r/${tradeId}/${s}`, h: "" });
                this.send(ws, "p", { p: `r/${tradeId}/${suffix[3]}`, d: { c: 'specialbadgepackduoslegend', d: '', e: [1, 13], f: '', g: '100', h: '', i: '', j: '', k: '100000' }});
                this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "b" } });
                this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "b" } });

                ws.on("message", async (raw: WebSocket.RawData) => {
                    if (tDone) return;
                    let message: any;
                    try {
                        message = JSON.parse(raw.toString())?.d;
                    }
                    catch (parseError) {
                        console.error(parseError);
                        return;
                    }

                    if (message?.b?.p === `r/${tradeId}/${amHosting ? "G" : "H"}` && message.b?.d) {
                        clearTimeout(intTime);
                        intTime = setTimeout(() => {
                            if (!tDone) {
                                tDone = true;
                                this.send(ws, "p", { p: `r/${tradeId}/${amHosting ? "H" : "G"}`, d: null });
                                resolve({
                                    MSG: "No Interaction"
                                });
                            }
                        }, 15000);
                    }

                    if (message?.b?.p === `r/${tradeId}/${amHosting ? "g" : "h"}` && message.b?.d) {
                        console.log(`Trade | User Profile:`, message.b.d);
                        console.log(`Trade | Test Logs:`, message.b.p)
                        console.log(`Trade | Test Logs:`, message.b, message.p)

                        wishlist = message?.b.d.d ? Object.values(message.b.d.d).slice(0, 3) : [];
                        console.log(`Trade | User Wishlist: ${wishlist.join(", ")}`);
                        console.log(`Full Join Data:`, JSON.stringify(message.b.d, null, 2));
                    }

                    if (message?.b?.p === `r/${tradeId}/${amHosting ? "G" : "H"}` && !message.b?.d && !tDone) {
                        tDone = true;
                        await this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: null });
                        resolve({ 
                            MSG: "UserLeft" 
                        });
                        return;
                    }

                    else if (message?.b?.p === `r/${tradeId}/${amHosting ? "G" : "H"}` && message.b?.d) {
                        const act = message.b.d.x
                        console.log(`Trade | User Action: ${act} | Data:`, message.b.d);

                        switch(act) {
                            case 'b': {
                                await funcs.sleep(500)
                                if (tDone) return;
                                this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "n", v: `2${Math.floor(Math.random() * 9) + 1}` } });
                                if (w.length === 0 && cards !== false) {
                                    w = Array.isArray(cards) ? cards : wishlist.length > 0 ? wishlist : dBase.cardInfo.getTop3()
                                    if (!Array.isArray(cards) && w.length < 3) {
                                        const d = dBase.cardInfo.getTop3(), a = d.filter(card => !w.includes(card));
                                        for (let i = 0; i < a.length && w.length < 3; i++) {
                                            w.push(a[i]);
                                        }
                                    }
                                    for (let i = 0; i < w.length; i++) {
                                        this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "e", v: `${w[i]},${i}` } });
                                    }
                                }
                                break;
                            }
                            case 'c': {
                                const slot = parseInt(message.b.d.v);
                                if (!isNaN(slot) && slot >= 0 && slot <= 2) {
                                    cSlot = slot;
                                    console.log(`User Started Loading | ${slot}`);
                                }
                                break;
                            }
                            case 'e': {
                                if (cSlot !== null) {
                                    if (lastCardPlace > 0 && performance.now() - lastCardPlace < 450) {
                                        console.log(`Anti Bot | User Placed Cards Too Quick`);

                                        dBase.security.ban(discordId, `Mod/Exploit Use | Placed Cards Quick`);
                                        console.log(`Discord ID: ${discordId} | Placed Cards Quick | Bot Banned`);

                                        tDone = true;
                                        await this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: null });
                                        resolve({
                                            MSG: "Cheater"
                                        });
                                    }
                                    lastCardPlace = performance.now()
                                    lSlot.add(cSlot);
                                    console.log(`User Loaded Card | ${cSlot}`);
                                    if (withdraw) {
                                        await funcs.sleep(100)
                                        if (tDone) return;
                                        this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "g", a: cSlot, b: true } });
                                    }
                                    cSlot = null;
                                }
                                break;
                            }
                            case 'd': {
                                console.log(`User Cancelled Loading | ${cSlot}`);
                                if (cSlot !== null) {
                                    lSlot.delete(cSlot);
                                }
                                cSlot = null;
                                break;
                            }
                            case 'f': {
                                const slot = parseInt(message.b.d.v);
                                if (!isNaN(slot) && slot >= 0 && slot <= 2) {
                                    lSlot.delete(slot);
                                    console.log(`User Removed Card | ${slot}`);
                                }
                                break;
                            }
                        }

                        switch(act) {
                            case 'h': case 'k': case 'j': {
                                if (performance.now() - actTime < 300) {
                                    console.log(`Anti Bot | Action Spam Detected (${act})`);

                                    dBase.security.ban(discordId, `Spam Attempt: ${act.toUpperCase()}`);
                                    console.log(`Discord ID: ${discordId} | Spam Attempt | Bot Banned`);

                                    tDone = true;
                                    await this.send(ws, "p", { p: `r/${tradeId}/${amHosting ? "H" : "G"}`, d: null });
                                    resolve({
                                        MSG: "Spam"
                                    });
                                    return;
                                }
                                actTime = performance.now()

                                if (act === 'k' && withdraw && lSlot.size > 0) {
                                    this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "n", v: `6${Math.floor(Math.random() * 9) + 1}` } });                            
                                    this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "k" } });
                                }
                                else if (deposit && lSlot.size === 0) {
                                    this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "n", v: `6${Math.floor(Math.random() * 9) + 1}` } });      
                                    await this.send(ws, "p", { p: `r/${tradeId}/${amHosting ? "H" : "G"}`, d: null });
                                    tDone = true;
                                    resolve({
                                        MSG: "WastingDepositTime"
                                    });
                                    return;
                                }
                                else {
                                    this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: act } });
                                }
                                break;
                            }

                            case 'g': {
                                if (performance.now() - actTime < 180) {
                                    console.log(`Anti Bot | Thumbs Spam Detected`);

                                    dBase.security.ban(discordId, `Spam Attempt | Thumb Emojis`);
                                    console.log(`Discord ID: ${discordId} | Spam Attempt | Bot Banned`);

                                    tDone = true;
                                    await this.send(ws, "p", { p: `r/${tradeId}/${amHosting ? "H" : "G"}`, d: null });
                                    resolve({
                                        MSG: "Spam"
                                    });
                                    return;
                                }
                                actTime = performance.now();
                                
                                this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: act, a: message.b.d.a, b: message.b.d.b } });
                                break;
                            }

                            case 'n': case 'm': {
                                if (performance.now() - actTime < 200) {
                                    console.log(`Anti Bot | Emoji Spam Detected`);

                                    dBase.security.ban(discordId, `Spam Attempt | Emoji//Message Spam`);
                                    console.log(`Discord ID: ${discordId} | Spam Attempt | Bot Banned`);

                                    tDone = true;
                                    await this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: null });
                                    resolve({
                                        MSG: "Spam"
                                    });
                                    return;
                                }
                                actTime = performance.now();

                                this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: act, v: message.b.d.v } });
                                break;
                            }

                            case 'l': {
                                const gaveCount = message.b.d?.a ? Object.values(message.b.d.a).length : 0;
                                if (gaveCount > 0) {
                                    if (lSlot.size < gaveCount) {
                                        console.log(`AntiBot: User Gave: x${message.b.d.a.length} | ${lSlot.size} -- Mod?`);

                                        dBase.security.ban(discordId, `Mod Attempt | Card & Slot Mismatch`);
                                        console.log(`Discord ID: ${discordId} | Mod Attempt | Bot Banned`);

                                        tDone = true;
                                        await this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: null });
                                        resolve({
                                            MSG: "Cheater",
                                        });
                                        return;
                                    }
                                }

                                const rawGive = message.b.d?.a ?? [], rawGet = message.b.d?.b ?? [];
                                const r = await this.antiExploit(ws, JSON.parse(JSON.stringify(message.b.d)), amHosting, tradeId, discordId);
                                console.log(`AntiBot | ${message.b.p.toString()} | ${r ? 'true' : 'false'}`);
                                
                                if (!r) {
                                    tDone = true;
                                    await this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: null });
                                    resolve({
                                        MSG: "Cheater"
                                    });
                                    return;
                                }

                                tDone = true;
                                await this.send(ws, "p", {p: `r/${tradeId}/${suffix[2]}`, d: { x: "l", b: rawGive, a: rawGet }});
                                this.send(ws, "p", { p: `r/${tradeId}/${suffix[2]}`, d: { x: "n", v: `9${Math.floor(Math.random() * 9) + 1}` } });
                                const givenCards = rawGet ? Object.values(rawGet) : [], receivedCards = rawGive ? Object.values(rawGive) : [];

                                console.log(givenCards)
                                
                                resolve({
                                    MSG: "Trade Worked",
                                    Received: { 
                                        Cards: receivedCards
                                    },
                                    Given: { 
                                        Cards: givenCards
                                    }
                                });
                                break;
                            }
                        }
                    }
                });
                ws.on('error', (error) => {
                    if (!tDone) {
                        tDone = true;
                        reject({
                            MSG: "Trade Error",
                            Error: error.message
                        });
                    }
                });
            }
            catch(e: any) {
                console.error('Trade error:', e?.response?.status || e?.message || e);
                tDone = true;
                reject({
                    MSG: "Trade Error",
                    Error: `${e?.message}`
                });
            }
        }).finally(() => {
            clearTimeout(intTime);
            try {
                ws.close();
            }
            catch { }
        });
    }
}