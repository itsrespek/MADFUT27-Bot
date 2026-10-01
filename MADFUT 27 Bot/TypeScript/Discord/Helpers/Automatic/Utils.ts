import { Client } from "discord.js";
import PlayerUpdater from "./MADFUT/Players.js";
import Leaderboard from "./Leaderboard.js";
import MessageListener from "./Messages.js";
import PacksUpdater from "./MADFUT/Packs.js";
import InviteListener from "./Invites.js";
import LevelListener from "./Level.js";
import BoostListener from "./Boost.js";
import SBCUpdater from "./MADFUT/SBCs.js";
import MainMenuReward from "./MADFUT/Menu.js";
import MarketTokenUpdater from "./MADFUT/Market.js";
import VoteUpdater from "./MADFUT/Votes.js";
import FatalUpdater from "./MADFUT/Fatal.js";
import AnnouncementUpdater from "./MADFUT/Announcements.js";
import EvolutionsUpdater from "./MADFUT/Evolutions.js";
import AutoGiveaways from "./Giveaways.js";
import AutoMarket from "./Market.js";

export class Automation {
    private client: Client
    constructor(client: Client) {
        this.client = client
    }

    get auto() {
        return {
            players: () => PlayerUpdater(this.client),
            leaderboard: () => Leaderboard(this.client),
            messages: () => MessageListener(this.client),
            packs: () => PacksUpdater(this.client),
            sbcs: () => SBCUpdater(this.client),
            invites: () => InviteListener(this.client),
            level: () => LevelListener(this.client),
            boosts: () => BoostListener(this.client),
            giveaways: () => AutoGiveaways(this.client),
            market: () => AutoMarket(this.client),
            menu: () => MainMenuReward(this.client),
            marketToken: () => MarketTokenUpdater(this.client),
            votes: () => VoteUpdater(this.client),
            fatal: () => FatalUpdater(this.client),
            announcements: () => AnnouncementUpdater(this.client),
            evo: () => EvolutionsUpdater(this.client)
        }
    }

    async runAuto() {
        console.log("Running Auto")
        await this.auto.players();
        await this.auto.leaderboard()
        await this.auto.messages()
        await this.auto.packs()
        await this.auto.invites()
        await this.auto.level()
        await this.auto.boosts()
        await this.auto.giveaways()
        await this.auto.market()
        await this.auto.menu()
        await this.auto.marketToken()
        await this.auto.votes();
        await this.auto.fatal();
        await this.auto.announcements();
        await this.auto.evo();

        setInterval(async () => {
            await this.auto.players();
            await this.auto.packs();
            await this.auto.sbcs();
            await this.auto.menu();
            await this.auto.votes();
            await this.auto.marketToken();
            await this.auto.fatal();
            await this.auto.announcements();
            await this.auto.evo();
        }, 10 * 1000);

        setInterval(async () => {
            await this.auto.leaderboard();
        }, 5 * 60 * 1000);
    }
}