import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder } from "discord.js";
import Command from "../../Helpers/Layout/CMDs.js";
import DiscordClient from "../../Client.js";
import MADFUTDB from "../../../Database.js";
import { Functions } from "../../../Functions.js";

export default class Query extends Command {
    constructor() {
        super(
            "query",
            "[DEV]: Query the database..",
            [
                { name: 'query', description: 'What SQL? | Example: SELECT * FROM madfut27tables', type: ApplicationCommandOptionType.String, required: true },
                { name: 'params', description: 'Optional bind values as a JSON array | Example: ["Unai", 99, null]', type: ApplicationCommandOptionType.String, required: false },
                { name: 'private', description: 'Only show the results to you', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        );
    }

    async run(c: DiscordClient, int: CommandInteraction, args: { query: string, params?: string, private?: boolean }) {
        try {
            const dBase = new MADFUTDB(), funcs = new Functions(), database = (dBase as any)['db'], priv = !!args.private;
            const sql = args.query.trim();

            let bind: any[] = [];
            if (args.params?.trim()) {
                try {
                    const parsed = JSON.parse(args.params.trim());
                    if (!Array.isArray(parsed)) throw new Error();
                    bind = parsed;
                }
                catch {
                    return await int.reply(funcs.createEmbed("Invalid Params", "Params must be a valid JSON array\nExample: `[\"Unai\", 99, null]`", true));
                }
            }

            const start = Date.now();
            let stmt: any;
            try { stmt = database.prepare(sql); }
            catch (err: any) {
                if (!/more than one statement/i.test(err?.message || "")) throw err;

                database.exec(sql);
                const changes = database.prepare("SELECT changes() AS c").get()?.c ?? 0;
                return await int.reply(funcs.createEmbed("Query Complete", `Query: \`${sql}\`\nChanges: \`${changes}\` | Took: \`${Date.now() - start}ms\``, true));
            }

            let head: string, rows: Record<string, any>[] = [];

            if (stmt.reader) {
                rows = stmt.all(...bind).slice(0, 100);
                head = `Query: \`${sql}\`\nRows: \`${rows.length}\`${bind.length ? ` | Params: \`${JSON.stringify(bind)}\`` : ""} | Took: \`${Date.now() - start}ms\``;
                if (!rows.length) return await int.reply(funcs.createEmbed("Query Complete", `${head}\n---\nNo rows returned`, true));
            }
            else {
                const info = stmt.run(...bind);
                head = `Query: \`${sql}\`\nChanges: \`${info.changes}\` | Last Insert ID: \`${info.lastInsertRowid}\` | Took: \`${Date.now() - start}ms\``;
                return await int.reply(funcs.createEmbed("Query Complete", head, true));
            }

            const entries: string[] = [];
            for (let i = 0; i < rows.length; i++) entries.push(`#${i + 1}: ${JSON.stringify(rows[i])}`);

            const groups: string[][] = [];
            let current: string[] = [], size = 0;
            for (const entry of entries) {
                if (size + entry.length > 1600 && current.length) { groups.push(current); current = []; size = 0; }

                current.push(entry); size += entry.length;
            }
            if (current.length) groups.push(current);

            const pages: any[] = [];
            for (const group of groups) {
                pages.push(funcs.createEmbed(`Query Results (Page: ${pages.length + 1}/${groups.length})`, `${head}\n---\n${group.join("\n")}`, priv));
            }

            if (pages.length === 1) return await int.reply(pages[0]);

            let page = 0, timeout: NodeJS.Timeout;
            const cPage = (p: number) => {
                const pageData = { ...pages[p], components: [new ContainerBuilder(pages[p].components[0].toJSON())] };
                pageData.components[0].addActionRowComponents(() => new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("back").setLabel("Back").setStyle(ButtonStyle.Secondary).setDisabled(p === 0), new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(p === pages.length - 1)));
                return pageData;
            };
            const endInteraction = async () => {
                await int.editReply(funcs.createEmbed("Query Timeout", "This interaction has timed out\nRun `/query` again"));
                col.stop();
            };

            const col = (await int.reply(cPage(page)) as any).createMessageComponentCollector({ componentType: ComponentType.Button });
            timeout = setTimeout(endInteraction, 120_000);

            col.on("collect", async (i: any) => {
                if (i.user.id !== int.user.id) return await i.reply(funcs.createEmbed("Error", "This isn't your interaction!", true));

                clearTimeout(timeout);
                timeout = setTimeout(endInteraction, 120_000);
                await i.update(cPage(page += i.customId === "next" ? 1 : -1));
            });
            col.on("end", () => clearTimeout(timeout));
        }
        catch (e: any) {
            console.log(e);
            const err = new Functions().createEmbed("Error", e instanceof Error ? e.message : String(e), true);
            if (int.replied || int.deferred) await int.followUp(err);
            else await int.reply(err);
        }
    }
}
