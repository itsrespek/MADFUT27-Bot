import DiscordClient from '../../../Discord/Client.js';

export default abstract class Event {
    constructor(private readonly name: string) {}
    
    public getName(): string {
        return this.name;
    }
        
    public abstract run(client: DiscordClient, ...args: any[]): Promise<void> | void;
}