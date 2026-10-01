import { Client, TextChannel, MessageFlags, MediaGalleryItemBuilder, MediaGalleryBuilder } from "discord.js";
import Configuration from "../../../../Configuration.js";
import { readCacheNumber, writeCacheNumber } from "./Functions.js";
import { Requests } from "../../../../MADFUT/Requests.js";
import { ContainerBuilder, TextDisplayBuilder } from "discord.js";

const config = new Configuration();
const req = new Requests();
const cFile = "votes.json";

export default async function VoteUpdater(client: Client) {
    const channel = client.channels.cache.get(config.Discord.Channels.News) as TextChannel; if (!channel) return;
    const v = await req.getConfigVersion(); if (!v) return;
    const cfg = await req.getConfig(v); if (!cfg) return;
    const p = parseInt(cfg.fields?.votes?.integerValue || "0"); if (!p) return;
    const lastPointer = readCacheNumber(cFile); if (p <= lastPointer) return;
    const voteData = await req.getDocument("votes", p); if (!voteData) return;
    const vote = voteData.fields; if (!vote) return;

    const name = vote.name?.stringValue || "Community Vote:", l = vote.nameLeft?.stringValue || "Option A", m = vote.nameMiddle?.stringValue || "Option B", r = vote.nameRight?.stringValue || "Option C", imageUrl = vote.url?.stringValue || "";

    const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${name}`))
        .addSeparatorComponents(s => s.setSpacing(2))

    if (vote.showResults?.booleanValue) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${l}  |  ${m}  |  ${r}\nVotes: ${vote.a?.integerValue || 0} - ${vote.b?.integerValue || 0} - ${vote.c?.integerValue || 0}`));
    }

    if (imageUrl) {
        const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl));
        container.addMediaGalleryComponents(gallery);
    }

    await channel.send({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    writeCacheNumber(cFile, p);
}