import { ApplicationCommandOptionType } from "discord.js";

export interface Option extends InteractionCommandArgs {}
export interface BotError {
    code?: string;
    message?: string;
}

interface Choices { 
    name: string; 
    value: string | number 
}

export interface InteractionCommandArgs { 
  name: string;
  description: string;
  type: ApplicationCommandOptionType;
  required: boolean;
  choices?: Choices[];
  autocomplete?: boolean;
}

export interface CommandStructure { 
  name: string;
  description: string;
  options: Array<SubCommand | SubCommandGroup | Option>
}

export interface SubCommandGroup { 
  name: string;
  description: string;
  type: ApplicationCommandOptionType.SubcommandGroup;
  options: SubCommand[];
}

export interface SubCommand { 
  name: string;
  description: string;
  type: ApplicationCommandOptionType.Subcommand;
  options: Option[];
}

export interface DiscordChannels {
  CMDs: string;
  Casino: string;
  Giveaways: string;
  Market: string;
  News: string;
  Leaderboard: string;
  MainChat: string;
  SystemBoosts: string;
}

export interface LevelRoles {
  Bronze: string;        // 1
  Silver: string;        // 3
  Gold: string;          // 5
  TOTW: string;          // 10
  FUT_Champ: string;     // 15
  UCL: string;           // 20
  Future_Stars: string;  // 25
  TOTY_Nominee: string;  // 30
  Moments: string;       // 35
  Icon: string;          // 40
  TOTY: string;          // 50
  TOTS: string;          // 60
}

export interface PingRoles {
  Giveaways: string;
  MADFUTNews: string;
  Market: string;
}

export interface DiscordRoles {
  AdminID: string;
  StaffID: string;
  DoubleBooster: string;
  PingRoles: PingRoles;
  Levels: LevelRoles;
}

export interface DiscordConfig {
  Token: string;
  Status: string;
  GuildId: string;
  Channels: DiscordChannels;
  Roles: DiscordRoles;
}

export interface MADFUTURLs {
  Secure: string;
  GetAccount: string;
  FireStore: string;
  Commit: string;
  RTDB: string;
}

export interface MADFUTConfig {
  AppCheck: string;
  URLs: MADFUTURLs;
  Headers: Record<string, string>;
  RTokens: string[];
}

export interface BotConfig {
  Discord: DiscordConfig;
  MADFUT: MADFUTConfig;
}

export interface MADFUTUser {
    userId: string;
    username: string | null;
    coins: number;
    trades: number;
    dailyCooldown: number;
}

export interface MADFUTCard {
    id: string;
    name: string;
    rating: number;
    card: string;
    position: string;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physicality: number;
}

export interface PlayerData {
    ID: string;
    BaseID: string;
    ItemId: string;
    Name: string;
    Rating: number;
    Card: string;
    Position: string;
    AltPositions: string;
    Stats: PlayerStats;
    IDs: {
        ClubId: string;
        LeagueId: string;
        NationId: string;
    };
    CardURL: string;
    Man: string;
    InGame: {
        Packable: string;
        Picks: string;
        Tokens: string;
        Tradable: string;
        TOTWNumber: string;
        PremiumChem: string;
    };
    Date: number;
}

export interface PlayerStats {
    "Speed/Pace": number;
    Shooting: number;
    Passing: number;
    Dribbling: number;
    Defending: number;
    Physicality: number;
    Control: number;
    Defense: number;
}

export interface WalletCard {
    CardID: string;
    Total: number;
}

export interface UserPack {
    PackID: string;
    Total: number;
}

export interface CustomPackRow {
    id: string;
    userId: string;
    name: string;
    minRating: number;
    maxRating: number;
    nationId: number | null;
    position: string | null;
}

export interface autoPlayerResp {
    documents: Array<{
        fields?: {
            players?: {
                arrayValue?: {
                    values?: Array<{ mapValue: { fields: Record<string, any> } }>;
                };
            };
        };
    }>;
}

export interface autoPlayer {
    id: string;
    [key: string]: any;
}

export interface TokenInfo {
    valid: boolean;
    iat?: number;
    exp?: number;
    detail: string;
}

export interface TradeOffer {
    coins: number;
    trades: number;
    packduos: number;
    ctokens: number;
    picks: number;
    cards: { card_id: string; quantity: number }[];
    packs: { pack_id: string; quantity: number }[];
    cPacks: CustomPackRow[];
}

export interface BotGiveawayProgress {
    done: number;
    failed: number;
}

export interface ActiveBotGiveaway {
    hostId: string;
    channelId: string;
    messageId: string;
    tradesPerUser: number;
    startsAt: number;
    endsAt: number;
    phase: 'joining' | 'live' | 'ended';
    forceStopped: boolean;
    entrants: Set<string>;
    skipped: number;
    progress: Map<string, BotGiveawayProgress>;
    startTimer?: NodeJS.Timeout;
    onForce?: () => void;
}

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    coins: number;
    trades: number;
    messages: number;
}