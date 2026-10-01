import { CustomPackRow } from "./Interface.js";

export interface GamePackRoll {
    min?: number;
    max?: number;
    exact?: number;
    colors?: string[];
    specialOnly?: boolean;
    count: number;
}

export interface GamePack {
    name: string;
    rolls: GamePackRoll[];
}

export const CustomPackSize = 9;

export const GamePacks: Record<string, GamePack> = {
    random: { name: "100% Random", rolls: [{ min: 40, max: 84, count: 8 }, { min: 85, max: 99, count: 1 }] },
    bronze: { name: "Bronze", rolls: [{ colors: ["bronze"], count: 9 }] },
    silver: { name: "Silver", rolls: [{ colors: ["silver", "bronze"], count: 9 }] },
    gold: { name: "Gold", rolls: [{ colors: ["gold", "silver", "bronze"], count: 9 }] },
    goldsuper: { name: "Gold Super", rolls: [{ colors: ["gold"], min: 82, max: 99, count: 6 }, { colors: ["gold"], min: 75, max: 81, count: 3 }] },
    totw: { name: "TOTW", rolls: [{ colors: ["totw"], count: 2 }, { min: 40, max: 84, count: 6 }, { min: 85, max: 99, count: 1 }] },
    "80plus": { name: "80+", rolls: [{ min: 80, max: 87, count: 8 }, { min: 88, max: 99, count: 1 }] },
    special95: { name: "95+ Special", rolls: [{ min: 95, max: 99, specialOnly: true, count: 1 }, { min: 80, max: 94, count: 8 }] }
};

for (let rating = 85; rating <= 96; rating++) {
    GamePacks[`${rating}_special`] = { name: `${rating} Special`, rolls: [{ exact: rating, specialOnly: true, count: 1 }, { max: rating - 1, count: 8 }] };
}

export function getPackName(packId: string) {
    return GamePacks[packId]?.name ?? `Unknown Pack (${packId})`;
}

export type { CustomPackRow };
