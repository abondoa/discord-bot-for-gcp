// Require the necessary discord.js classes
const {
  Client,
  GatewayIntentBits,
  REST,
  SlashCommandBuilder,
  Routes,
} = require("discord.js");
const { clientId, token } = require("./config.json");
const compute = require("@google-cloud/compute");
const gcpConfig = require("./GCP_config.json");

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageTyping],
});
const instancesClient = new compute.InstancesClient();

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
const instanceQuery = {
  project: gcpConfig.project_id,
  zone: "europe-west1-b",
  instance: "instance-1",
};

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then((data) =>
    console.log(`Successfully registered ${data.length} application commands.`)
  )
  .catch(console.error);

client.on("interactionCreate", async (interaction) => {
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
    await stop(interaction);
  }
});

async function server(reply) {
  const [instance] = await instancesClient.get(instanceQuery);

  console.log(
    `Instance ${instanceQuery.instance} data:\n${JSON.stringify(
      instance,
      null,
      4
    )}`
  );
  reply(
    `Server is currently: ${instance.status}, on IP ${instance?.networkInterfaces[0]?.accessConfigs[0]?.natIP}`
  );
}

async function start(interaction) {
  const instancesClient = new compute.InstancesClient();

  const [response] = await instancesClient.start(instanceQuery);
  let operation = response.latestResponse;
  const operationsClient = new compute.ZoneOperationsClient();
  await interaction.deferReply();

  // Wait for the operation to complete.
  while (operation.status !== "DONE") {
    [operation] = await operationsClient.wait({
      operation: operation.name,
      project: instanceQuery.project,
      zone: operation.zone.split("/").pop(),
    });
  }

  console.log("Instance started.");
  await server(interaction.editReply.bind(interaction));
}

async function stop(interaction) {
  const instancesClient = new compute.InstancesClient();

  const [response] = await instancesClient.stop(instanceQuery);
  let operation = response.latestResponse;
  const operationsClient = new compute.ZoneOperationsClient();
  await interaction.deferReply();

  // Wait for the operation to complete.
  while (operation.status !== "DONE") {
    [operation] = await operationsClient.wait({
      operation: operation.name,
      project: instanceQuery.project,
      zone: operation.zone.split("/").pop(),
    });
  }

  console.log("Instance stopped.");
  await server(interaction.editReply.bind(interaction));
}

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
});

// Login to Discord with your client's token
client.login(token);
