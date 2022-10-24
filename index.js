const {
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GatewayIntentBits,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const guild = require("./guild.json");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const token = "MTAzNDA5NjE1MzkyMDI3ODU5OA.GO2aLV.QF_1WKUw_KFV3ujYnQR7NmmB4TbEZsdQvSQoVc"; //Enter your bot's token here
const prefix = "."; //This will change how interacting with the bot works. Changing this to ! will make the bot respond to !ticketsystem instead of .ticketsystem

function getCurrentServerTime() {
  let time = new Date().toLocaleString();
  return time;
}

client.on("messageCreate", async (message) => {
  //If the command was recieved by a Discord Bot, ignore it
  if (message.author.bot) return;
  //If the message does not start with the prefix, ignore it
  if (message.content.indexOf(prefix) !== 0) return;
  //If the message is a command, parse it
  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  //CommandHandler
  console.log("CommandHandler: " + command);
  switch (command) {
    //START
    case "ticketsystem":
      if (message.member.permissions.has("ADMINISTRATOR")) {
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("Avail here")
          .setDescription(
            "Click the button to place your order. Thank you!"
          )
          .setFooter({
            text: "Nuggets' Services",
          });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("support_button")
            .setLabel("Open ticket")
            .setStyle(ButtonStyle.Primary)
        );
        message.channel.send({
          embeds: [embed],
          components: [row],
        });
        message.reply("Setup Complete!");
        break;
      } else {
        message.reply({ content: "API: Unauthorized action", ephemeral: true });
        break;
      }
    case "resolve":
      if (message.member.permissions.has("ADMINISTRATOR")) {
        const embed = new EmbedBuilder()
          .setTitle("Confirm close?")
          .setDescription(
            "Are you sure you'd like to close this ticket?"
          )
          .setColor("#870505");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_button")
            .setLabel("Click Here To Close The Ticket")
            .setStyle(ButtonStyle.Danger)
        );
        message.channel.send({ embeds: [embed], components: [row] });
        break;
      } else {
        message.reply({ content: "API: Unauthorized action", ephemeral: true });
      }
  }
});

client.on("interactionCreate", async (interaction) => {
  let ticket_channel_id;
  if (!interaction.isButton()) return;
  switch (interaction.customId) {
    case "support_button":
      let channelExists = interaction.guild.channels.cache.find(
        (channel) =>
          channel.name == "ticket-" + interaction.user.username.toLowerCase()
      );
      if (channelExists) {
        interaction.reply({
          content:
            "<@" +
            interaction.member.id +
            "> You already have a ticket open! Press here to view the channel -> " +
            "<#" +
            channelExists.id +
            ">",
          ephemeral: true,
        });
        return;
      }
      await interaction.guild.channels
        .create({
          name: `ticket-` + interaction.user.username.toLowerCase(),
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel],
            },
          ],
        })
        .then((channel) => {
          ticket_channel_id = channel.id;
          channel.setParent(guild.class_support, { lockPermissions: false });
          const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("You've opened a ticket!")
            .setDescription(
              "Please hold, someone will be with you soon."
            )
          channel.send("<@947305875423526912> - <@" + interaction.user.id + ">");
          channel.send({ content: "", embeds: [embed] });
        });
      interaction.reply({
        content:
          "Your ticket has been created! Press here to view the channel -> " +
          "<#" +
          ticket_channel_id +
          ">",
        ephemeral: true,
      });
      break;

    case "close_button":
      if (!interaction.channel.name.startsWith("ticket-")) {
        interaction.reply({
          content: "API: Unauthorized action",
          ephemeral: true,
        });
        return;
      }

      interaction.reply("Closing ticket in 5 seconds...");
      interaction.channel.messages.fetch({ limit: 100 }).then((messages) => {
        //create an empty array
        let messageArray = [];
        messages.forEach((message) => {
          messageArray.push(message.author.username + ": " + message.content);
        });
        messageArray.push(
          "\n\n**" +
            getCurrentServerTime() +
            " | " +
            interaction.user.username +
            " - " +
            interaction.user.id +
            "**"
        );
        messageArray = messageArray.join("\n");
        messageArray = messageArray.split("\n").reverse().join("\n");
        fs.writeFile("ticket.txt", messageArray, (err) => {
          if (err) throw err;
        });
        client.channels.cache
          .get(guild.saved_tickets)
          .send(
            interaction.user.username +
              " - " +
              interaction.user.id +
              " | " +
              getCurrentServerTime()
          );
        client.channels.cache
          .get(guild.saved_tickets)
          .send({ files: ["ticket.txt"] });
        setTimeout(function () {
          interaction.channel.delete();
        }, 5000);
      });
      break;
  }
});

client.on("ready", () => {
  console.log("started");
});

client.login(token);
