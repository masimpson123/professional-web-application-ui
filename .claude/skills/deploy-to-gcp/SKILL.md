---
name: deploy-to-gcp
description: Build the app from the local working tree and deploy it to the msio Cloud Run service on GCP.
disable-model-invocation: true
---

Deploy the Angular app to Google Cloud Run exactly as it exists on this machine right now, including uncommitted changes. Do not commit, stash, or otherwise change git state at any point.

Stop at the first failing step, show the error output, and do not continue.

## 1. Sign in to Google Cloud

1. Check for an active account and a valid token:

   ```bash
   gcloud auth list --filter=status:ACTIVE --format="value(account)"
   gcloud auth print-access-token > /dev/null
   ```

2. If there is no active account, or the token check fails, ask the user to sign in by typing this in the prompt, then wait for them to confirm it finished:

   ```
   ! gcloud auth login
   ```

   `gcloud auth login` opens a browser, so the user has to run it themselves. Re-run the checks in step 1 afterward.

3. If there is an active account, use AskUserQuestion to ask: "Deploy as <account>?" with the options "Continue as <account>" and "Sign in with a different account". If they choose to sign in, follow step 2.

4. Make sure Docker can push to Artifact Registry with those credentials. This is idempotent:

   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
   ```

## 2. Check the local machine

1. Confirm the Docker daemon is running with `docker info > /dev/null`. If it isn't, ask the user to start Docker Desktop.
2. Run `git status --short` and tell the user which uncommitted changes will be included in this deploy. This is informational only. Do not commit anything.
3. Run `npm run build` and confirm it succeeds. This catches build errors before the slower Docker build.

## 3. Build, push, and deploy

Get today's date in `mmddyy` format for the image tag (`date +%m%d%y`), then run these in sequence, substituting the tag:

```bash
docker build --platform linux/amd64 -t client2026 .
docker tag client2026 us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
docker push us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
gcloud run services update msio --project endpoint-one --region us-central1 --platform managed --image us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
```

## 4. Report

Confirm the Cloud Run update succeeded, then tell the user:

- the account used
- the deployed image tag
- the service URL, from `gcloud run services describe msio --project endpoint-one --region us-central1 --format="value(status.url)"`
