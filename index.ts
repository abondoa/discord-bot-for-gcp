import { Interaction } from "discord.js";

// Require the necessary discord.js classes
import {
  Client,
  GatewayIntentBits,
  REST,
  SlashCommandBuilder,
  Routes,
} from "discord.js";
import {start,stopServer,server} from './gcp';
const { clientId, token } = require("./config.json");

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageTyping],
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!"),
  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Replies with server info"),
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Starts the server"),
  new SlashCommandBuilder().setName("stop").setDescription("Stops the server"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then((data) =>
    console.log(`Successfully registered application commands.`)
  )
  .catch(console.error);

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  console.log(
    `Got interaction:\n${JSON.stringify(
      interaction,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      4
    )}`
  );

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (commandName === "server") {
    await server(interaction.reply.bind(interaction));
  } else if (commandName === "start") {
    await start(interaction);
  } else if (commandName === "stop") {
    await stopServer(interaction);
  }
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
});

// Login to Discord with your client's token
client.login(token);
