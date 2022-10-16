import { CommandInteraction, Interaction } from "discord.js";

import compute from "@google-cloud/compute";
import monitoring from "@google-cloud/monitoring";
const gcpConfig = require("./GCP_config.json");
const instanceQuery = {
  project: gcpConfig.project_id,
  zone: "europe-west1-b",
  instance: "instance-1",
};
const instancesClient = new compute.InstancesClient();
const monitoringClient = new monitoring.MetricServiceClient();

export async function server(reply: (msg: string) => any) {
  const [instance] = await instancesClient.get(instanceQuery);
  const ip = instance?.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP

  console.log(
    `Instance ${instanceQuery.instance} data:\n${JSON.stringify(
      instance,
      null,
      4
    )}`
  );
  reply(
    `Server is currently: ${instance.status}${ip ? `, on IP ${ip}` : ""}`
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

async function readTimeSeriesData() {
  const filter = 'metric.type="compute.googleapis.com/instance/cpu/utilization"';

  const request = {
    name: monitoringClient.projectPath(instanceQuery.project),
    filter: filter,
    interval: {
      startTime: {
        // Limit results to the last 20 minutes
        seconds: Date.now() / 1000 - 60 * 20,
      },
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
  };

  // Writes time series data
  const [timeSeries] = await monitoringClient.listTimeSeries(request);
  timeSeries.forEach(data => {
    console.log(`${data.metric?.labels?.instance_name}:`);
    data.points?.forEach(point => {
      console.log(JSON.stringify(point.value));
    });
  });
}

readTimeSeriesData();
