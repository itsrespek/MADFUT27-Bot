import { ActiveBotGiveaway } from "./Interface.js";

let current: ActiveBotGiveaway | null = null;

export function getCurrentBotGiveaway(): ActiveBotGiveaway | null {
    return current;
}

export function setCurrentBotGiveaway(giveaway: ActiveBotGiveaway): void {
    current = giveaway;
}

export function clearBotGiveaway(): void {
    current = null;
}