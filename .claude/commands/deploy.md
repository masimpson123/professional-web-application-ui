Deploy the Angular app to Google Cloud Run.

Steps:
1. Get today's date in mmddyy format for the image tag.
2. Commit all staged and unstaged changes using the /commit skill before proceeding.
3. Run a production build with `npm run build` and confirm it succeeds.
3. Run the following commands in sequence, substituting the correct date tag:

```bash
docker build --platform linux/amd64 -t client2026 .
docker tag client2026 us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
docker push us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
gcloud run services update msio --region us-central1 --platform managed --image us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
```

5. Confirm the Cloud Run service update succeeded and report the deployed image tag to the user.
