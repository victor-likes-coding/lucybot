import { Client, Collection, Intents } from "discord.js";
import { read } from "../utils/read.js";
class Lucy {
  client = new Client(options);
  eventFiles = read("./events");
  commandFiles = read("./commands");
  constructor() {
    this.client.commands = new Collection();
  }

  get commands() {
    /**
     * Returns a simplified array of objects of the command list instead of the discordjs Collections data type.
     */
    return Array.from(this.client.commands.values()).map(({ data }) =>
      data.toJSON()
    );
  }
}


export const lucy = new Lucy();
