#!/bin/bash
echo "Deploying createWishlist function..."
gcloud functions deploy createWishlist \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=createWishlist \
  --trigger-http \
  --allow-unauthenticated
