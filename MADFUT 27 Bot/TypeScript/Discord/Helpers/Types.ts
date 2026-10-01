import { CommandStructure, SubCommand, SubCommandGroup } from "./Interface.js";

export type CommandTypes = CommandStructure | SubCommandGroup | SubCommand;
export type RewardActions = {
    [key: string]: (uid: string, total: number) => void;
}
export type QueuedUser = {
    name: string;
    uid?: string;
}