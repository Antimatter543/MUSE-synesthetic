# MUSE Deployment Runbook

Project: `project-b5adb824-a03c-48da-935`
Region: `us-central1`

## One-time setup (run after billing is enabled)

```bash
export PROJECT_ID=project-b5adb824-a03c-48da-935

# Enable required APIs
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  --project=$PROJECT_ID

# Store API key as a Secret Manager secret
echo -n "AIzaSyB58HFxM2HnRJF3dV9yK8ykVy5DrwDOpIw" | \
  gcloud secrets create google-api-key \
    --data-file=- \
    --project=$PROJECT_ID

# Create GCS bucket for gallery images
gsutil mb -p $PROJECT_ID -l us-central1 gs://muse-gallery-images-91690
gsutil iam ch allUsers:objectViewer gs://muse-gallery-images-91690

# Create Firestore database (native mode)
gcloud firestore databases create \
  --location=us-central1 \
  --project=$PROJECT_ID

# Grant Cloud Run SA access to secrets
PROJECT_NUMBER=873840430322
gcloud secrets add-iam-policy-binding google-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

## Deploy backend manually

```bash
cd /home/antiraedus/Projects/google_hackathon_project

# Build and push
docker build -t gcr.io/$PROJECT_ID/muse-backend:latest ./muse/backend
docker push gcr.io/$PROJECT_ID/muse-backend:latest

# Deploy to Cloud Run
gcloud run deploy muse-backend \
  --image=gcr.io/$PROJECT_ID/muse-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --timeout=3600 \
  --session-affinity \
  --min-instances=1 \
  --memory=2Gi \
  --cpu=2 \
  --set-secrets=GOOGLE_API_KEY=google-api-key:latest \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GCS_BUCKET_NAME=muse-gallery-images-91690,CORS_ORIGINS=* \
  --project=$PROJECT_ID

# Get the deployed URL
gcloud run services describe muse-backend \
  --region=us-central1 \
  --format='value(status.url)' \
  --project=$PROJECT_ID
```

## Deploy frontend

After getting the backend URL from above:

```bash
cd /home/antiraedus/Projects/google_hackathon_project/muse/frontend

VITE_BACKEND_URL=https://<your-cloud-run-url> npm run build

# Deploy built files to GCS static hosting or Firebase Hosting
# Option A: GCS static hosting
gsutil -m cp -r dist/* gs://muse-frontend-$PROJECT_ID/
gsutil web set -m index.html -e index.html gs://muse-frontend-$PROJECT_ID/

# Option B: Just serve from the same Cloud Run URL (backend serves frontend too)
# Update vite.config.ts proxy and rebuild
```

## Verify deployment

```bash
# Health check
curl https://<your-cloud-run-url>/health

# Gallery endpoint
curl https://<your-cloud-run-url>/api/gallery/test-session
```
