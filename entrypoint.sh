gcloud auth activate-service-account --key-file=/usr/src/bot/GCP_config.json \
  && export GOOGLE_APPLICATION_CREDENTIALS=/usr/src/bot/GCP_config.json \
  && node index.js
