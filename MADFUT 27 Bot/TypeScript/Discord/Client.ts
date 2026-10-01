import { Collection, Client, ClientOptions } from "discord.js";
import Command from "./Helpers/Layout/CMDs.js";
import Event from "./Helpers/Layout/Events.js";
import MADFUTDB from "../Database.js";
import { Functions } from "../Functions.js";

export default class DiscordClient extends Client {
    public readonly commands = new Collection<string, Command>();
    public readonly events = new Collection<string, Event>();
    public functions: Functions;
    public database: MADFUTDB;

    constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.functions = new Functions();
        this.database = new MADFUTDB();
    }
}