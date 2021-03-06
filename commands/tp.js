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
    .setName("tp")
    .setDescription("issues a take profit of `price`, calculates the percentage in profit as well from average price")
    .addIntegerOption((option) =>
      option.setName("id").setDescription("Trade id -- reference the dashboard it'll be in the format -> #. aka 1. or 13.").setRequired(true)
    )
    .addStringOption((option) => option.setName("price").setDescription("Price sold contracts at").setRequired(true))
    .addIntegerOption((option) => option.setName("amount").setDescription("Amount of contracts sold, default is 1"))
    .addStringOption((option) => option.setName("sl").setDescription("A stop loss for members, optional")),
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

    const amount = checkForOptionalValue(optionalData, "amount");
    amount > 1 ? trade.takeProfit(priceObj.value, amount) : trade.takeProfit(priceObj.value);

    // update database
    db.updateById(userId, idObj.value, trade.info);

    if (!trade.status) {
      // order is closed
      tradeMessage.content
        .setColor("RED")
        .setTitle(trade.toString())
        .setDescription(trade.toProfitPercentString())
        .addField("Summary", `Total Profit: ${trade.profitPercent}`);
    } else {
      tradeMessage.content.setTitle(trade.toString()).setDescription(trade.toProfitPercentString());
    }

    if (db.getOpenOrdersByUserId(userId).length) {
      db.getOpenOrdersByUserId(userId).forEach((td, index) => {
        const currentTrade = new Trade(td);
        dashboardMessage.addField({ title: `${index + 1}. ${currentTrade.toString()}`, description: currentTrade.toTotalProfitPercent() });
      });
    } else {
      dashboardMessage.addDescription("None");
    }

    return interaction.reply({ embeds: [tradeMessage.content, dashboardMessage.content] });
  },
};
