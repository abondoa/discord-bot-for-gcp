import { CommandInteraction, Interaction } from "discord.js";

import compute from "@google-cloud/compute";
const gcpConfig = require("./GCP_config.json");
const instanceQuery = {
  project: gcpConfig.project_id,
  zone: "europe-west1-b",
  instance: "instance-1",
};
const instancesClient = new compute.InstancesClient();

export async function server(reply: (msg: string) => any) {
  const [instance] = await instancesClient.get(instanceQuery);

  console.log(
    `Instance ${instanceQuery.instance} data:\n${JSON.stringify(
      instance,
      null,
      4
    )}`
  );
  reply(
    `Server is currently: ${instance.status}, on IP ${instance?.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP}`
  );
}

export async function start(interaction: CommandInteraction) {
  await interaction.deferReply();
  const [response] = await instancesClient.start(instanceQuery);
  let operation: any = response.latestResponse;
  const operationsClient = new compute.ZoneOperationsClient();

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

export async function stopServer(interaction: CommandInteraction) {
  await interaction.deferReply();
  const [response] = await instancesClient.stop(instanceQuery);
  let operation: any = response.latestResponse;
  const operationsClient = new compute.ZoneOperationsClient();

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
