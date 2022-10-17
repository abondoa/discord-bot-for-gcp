# Discord bot for GCP

This is a discord bot that allows you to interact with a single VM instance on GCP. 

To run it you need to have a GCP account and setup a Service account with permissions to the VM.
This is done from IAM -> Service Accounts menu in GCP console. See https://cloud.google.com/iam/docs/creating-managing-service-account-keys for more information. The credentials need to be in the form of a JSON file named GCP_config.json placed in the docker container.

```
{
  "type": "service_account",
  "project_id": "PROJECT_ID",
  "private_key_id": "KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nPRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "SERVICE_ACCOUNT_EMAIL",
  "client_id": "CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/SERVICE_ACCOUNT_EMAIL"
}
```

Additionally, you need to setup a discord bot following the guide from https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot.
The client ID and the token need to be stored in a file named config.json and placed in the docker container. 

```
{
    "token":"<Token goes here>",
    "clientId": "<Client ID goes here>"
}
```
