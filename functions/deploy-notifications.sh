#!/bin/bash
echo "Deploying sendPushNotificationV2 function..."
gcloud functions deploy sendPushNotificationV2 \
  --gen2 \
  --runtime=nodejs20 \
  --region=europe-west1 \
  --source=. \
  --entry-point=sendPushNotificationV2 \
  --trigger-event=providers/cloud.firestore/eventTypes/document.create \
  --trigger-resource="projects/wishu-c16d5/databases/(default)/documents/notifications/{notificationId}"
