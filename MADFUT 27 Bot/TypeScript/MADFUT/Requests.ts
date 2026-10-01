import axios from "axios";
import Configuration from "../Configuration.js";
import { Functions } from "../Functions.js";

export const tokenLock: Record<string, boolean> = {};
const config = new Configuration();
const func = new Functions();

export class Requests {
    private MADFUTData = {
        FireStoreURL: config.MADFUT.URLs.FireStore,
        SecureTokenURL: config.MADFUT.URLs.Secure,
        GetAccountURL: config.MADFUT.URLs.GetAccount,
        CommitURL: config.MADFUT.URLs.Commit,
        RTDB: config.MADFUT.URLs.RTDB,
        Headers: config.MADFUT.Headers,
        RToken: config.MADFUT.RTokens
    }
    public Info = {
        AccessToken: null as string | null,
        IDToken: null as string | null,
        Username: null as string | null,
        BotUID: null as string | null,
        Hdrs: this.MADFUTData.Headers,
        RTokenInUse: null as string | null
    }

    async getToken(): Promise<boolean> {
        const tokens = Array.isArray(this.MADFUTData.RToken) ? this.MADFUTData.RToken : [this.MADFUTData.RToken]; if (!tokens.length) return false;
        const aToken = tokens.filter(t => !tokenLock[t]);
        if (aToken.length === 0) {
            return false
        }

        const ranToken = aToken[Math.floor(Math.random() * aToken.length)].trim();; if (!ranToken) return false;
        try {
            tokenLock[ranToken] = true;

            const r = await axios.post(this.MADFUTData.SecureTokenURL, { grant_type: "refresh_token", refresh_token: ranToken }, { headers: this.MADFUTData.Headers }); if (!r.data.access_token || !r.data.id_token) return false;
            this.Info.IDToken = r.data.id_token
            this.Info.AccessToken = r.data.access_token
            this.Info.Hdrs = { ...this.MADFUTData.Headers, Authorization: `Bearer ${r.data.access_token}` };
            this.Info.BotUID = r.data.user_id;

            const userData: any = await axios.get(`${this.MADFUTData.FireStoreURL}/users/${this.Info.BotUID}`, { headers: { Authorization: `Bearer ${this.Info.IDToken}` } });
            this.Info.Username = userData.data.fields.username.stringValue;

            console.log(`Trading Called | Using: ${this.Info.Username} (ID: ${this.Info.BotUID}) | ${ranToken}`)
            this.Info.RTokenInUse = ranToken;
            return true;
        }
        catch (e) {
            console.error(e)
            tokenLock[ranToken] = false;
            return this.getToken();
        }
    }

    async inviteUser(user: string): Promise<any> {
        await axios.delete(`${this.MADFUTData.FireStoreURL}/onlineQueue/${this.Info.BotUID}`, { headers: { Authorization: `Bearer ${this.Info.IDToken}` } })
        try {
            const payload = {
                writes: [{
                    update: {
                        name: `projects/trivela-madfut/databases/(default)/documents/onlineQueue/${this.Info.BotUID}`,
                        fields: {
                            requestId: { stringValue: func.rString(10) },
                            username: { stringValue: this.Info.Username },
                            compatibilityId: { stringValue: "a" },
                            invitedUsername: { stringValue: user },
                            mode: { stringValue: "trading" },
                            badgeName: { stringValue: "nation_badge_45" },
                            year: { stringValue: "27" },
                            node: { stringValue: "" },
                        },
                    },
                },
                {
                    transform: {
                        document: `projects/trivela-madfut/databases/(default)/documents/onlineQueue/${this.Info.BotUID}`,
                        fieldTransforms: [{ fieldPath: "timestamp", setToServerValue: "REQUEST_TIME" }],
                    },
                }],
            }
            const r = await axios.post(this.MADFUTData.CommitURL, payload, { headers: { Authorization: `Bearer ${this.Info.IDToken}`, "Content-Type": "application/json" } })
            if (r.status === 200) {
                console.log(`Invited ${user}`);
                return true;
            }
        }
        catch (e: any) {
            console.log(`Invite Err: ${e}`)
            if ([401, 403].includes(e.response?.status)) {
                return await this.inviteUser(user);
            }
            else {
                console.log(e.message)
                return false
            }
        }
    }

    async listenQueue(idToken: string, uid: string, callback: any, ms = 500, timeout: number = 60000) {
        let oldDoc: any = {};
        const startTime = Date.now();

        await func.sleep(2000)
        while (true) {
            try {
                const r = await axios.get(`${this.MADFUTData.FireStoreURL}/onlineQueue/${uid}`, { headers: { Authorization: `Bearer ${idToken}` } });
                if (!r.data.fields || Object.keys(r.data.fields).length === 0) {
                    return { MSG: "InvalidUsername" };
                }
                if (Date.now() - startTime > timeout) {
                    const oUID = r.data.fields.invitedUid.stringValue
                    await axios.delete(`${this.MADFUTData.FireStoreURL}/onlineInvites/${oUID}/invites/${this.Info.BotUID}`, { headers: { Authorization: `Bearer ${idToken}` } });
                    return { MSG: "TimeOut" };
                }
                const doc = Object.fromEntries(Object.entries(r.data.fields || {}).map(([k, v]: [string, any]) => [k, Object.values(v)[0]]));
                const changed = Object.keys(doc).length !== Object.keys(oldDoc).length || Object.keys(doc).some(k => doc[k] !== oldDoc[k]);
                if (changed) {
                    oldDoc = { ...doc };
                    const r = await callback(doc);
                    if (doc.roomId) return r;
                }
            }
            catch (e) {}
            await new Promise(r => setTimeout(r, ms));
        }
    }

    async listenForInvite(idToken: string, uid: string, callback: any, ms = 500, timeout: number = 60000) {
        const startTime = Date.now();
        while (true) {
            try {
                const r = await axios.get(`${this.MADFUTData.FireStoreURL}/onlineInvites/${uid}/invites`, { headers: { Authorization: `Bearer ${idToken}` } });
                const docs = r.data?.documents || [];
                if (docs.length > 0) {
                    const doc = docs[0], f = doc.fields;
                    const inviterUid = doc.name.split("/invites/")[1];
                    const result = await callback({ inviterUsername: f.username?.stringValue, inviterUid });
                    
                    if (result?.skipDelete !== true) {
                        const p = doc.name.split('/documents/');
                        await axios.delete(`${this.MADFUTData.FireStoreURL}/${p[p.length - 1]}`, { headers: { Authorization: `Bearer ${idToken}` }});
                    }
                    return result;
                }
                if (Date.now() - startTime > timeout) return { MSG: "TimeOut" };
            } 
            catch (e) {}
            await new Promise(r => setTimeout(r, ms));
        }
    }

    async acceptInvite(invitedUid: string): Promise<any> {
        const idToken = this.Info.IDToken, botUID = this.Info.BotUID, botName = this.Info.Username;
        if (!idToken || !botUID || !botName) throw new Error("Not Logged In");

        try {
            const payload = {
                writes: [{
                    update: {
                        name: `projects/trivela-madfut/databases/(default)/documents/onlineInvites/${invitedUid}/invites/${botUID}`,
                        fields: {
                            acceptedRequestId: { stringValue: func.rString(10) },
                            acceptedUsername: { stringValue: botName },
                            acceptedBadgeName: { stringValue: "nation_badge_45" },
                            acceptedTimestamp: { timestampValue: new Date().toISOString() }
                        },
                    },
                    updateMask: {
                        fieldPaths: ["acceptedRequestId", "acceptedUsername", "acceptedBadgeName", "acceptedTimestamp"]
                    }
                }],
            }
            const r = await axios.post(this.MADFUTData.CommitURL, payload, { 
                headers: { 
                    ...this.MADFUTData.Headers,
                    Authorization: `Bearer ${idToken}`, 
                    "Content-Type": "application/json" 
                } 
            })
            if (r.status === 200) {
                console.log(`Accepted Invite from ${invitedUid}`);
                return true;
            }
        }
        catch (e: any) {
            console.log(`Accept Err: ${e}`)
            if (e.response) {
                console.log('Error Data:', JSON.stringify(e.response.data, null, 2));
            }
            return false
        }
    }

    async getConfigVersion(): Promise<number> {
        const { data } = await axios.get(`${this.MADFUTData.RTDB}/c7.json`);
        return parseInt(data);
    }

    async getConfig(version?: number): Promise<any> {
        if (!version) version = await this.getConfigVersion();
        const { data } = await axios.get(`${this.MADFUTData.FireStoreURL}/configs/${version}`);
        return data;
    }

    async getDocument(collection: string, id: string | number, token: string | null = null): Promise<any> {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const { data } = await axios.get(`${this.MADFUTData.FireStoreURL}/${collection}/${id}`, { headers });
        return data;
    }

    releaseToken() {
        if (this.Info.RTokenInUse) {
            tokenLock[this.Info.RTokenInUse] = false;
            console.log(`RToken Unlocked: ${this.Info.RTokenInUse}`);
            this.Info.RTokenInUse = null;
        }
    }
    getTokenStatus() {
        return tokenLock;
    }
}