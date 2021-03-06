import { SlashCommandBuilder } from "@discordjs/builders";
import { ErrorMessage } from "../src/model/Message/ErrorMessage.js";
import { errors } from "../src/errors/codes.js";
import { Interaction } from "discord.js";
import { LucyEmbed } from "../src/model/Message/LucyEmbed.js";
import { Trade } from "../src/model/Trade/Trade.js";
import { db } from "../src/model/data/data.js";
import { checkForOptionalValue } from "../utils/utils.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("avg")
    .setDescription("issues an average up/down, displays average based on buying 1 or other amount")
    .addIntegerOption((option) =>
      option.setName("id").setDescription("Trade id -- reference the dashboard it'll be in the format -> #. aka 1. or 13.").setRequired(true)
    )
    .addStringOption((option) => option.setName("price").setDescription("Price sold contracts at").setRequired(true))
    .addIntegerOption((option) => option.setName("amount").setDescription("Amount of contracts sold, default is 1")),
  async execute(interaction = new Interaction()) {
    // get the user id of member that issued tp command
    const { id: userId } = interaction.member.user;
    const [idObj, priceObj, optionalData] = interaction.options.data;
    const tradeMessage = new LucyEmbed({ color: "#00a6d9" });
    const dashboardMessage = new LucyEmbed({ color: "#00a6d9" });
    dashboardMessage.content.setAuthor(`${interaction.member.user.username}'s current open trades`);

    // TODO: figure out if member has analyst role

    // get the trade data and turn it into a Trade
    const tradeData = db.getTradesByUserId(userId, idObj.value);

    const trade = new Trade(tradeData);

    // act on Trade data -- average
    const amount = checkForOptionalValue(optionalData, "amount");
    amount > 1 ? trade.buy(priceObj.value, amount) : trade.buy(priceObj.value);

    // update db
    db.updateById(userId, idObj.value, trade.info);

    // update messages
    tradeMessage.content.setTitle(trade.toString()).setDescription(trade.toAverageString(priceObj.value));
    db.getOpenOrdersByUserId(userId).forEach((td, index) => {
      const currentTrade = new Trade(td);
      dashboardMessage.addField({ title: `${index + 1}. ${currentTrade.toString()}`, description: currentTrade.toTotalProfitPercent() });
    });
    return interaction.reply({ embeds: [tradeMessage.content, dashboardMessage.content] });
  },
};
