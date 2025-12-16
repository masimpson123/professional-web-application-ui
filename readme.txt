https://msio-205823180568.us-central1.run.app
https://endpoint-one-2-205823180568.us-central1.run.app
https://endpoint-one-2-205823180568.us-central1.run.app/weather

Gemini
https://ai.google.dev/gemini-api/docs
https://aistudio.google.com/apikey

cd /Users/livingroom/Desktop/client-2026
ng serve
ng g component

console.cloud.google.com
masimpson123@gmail.com
msio-u7qjhl7iia-uc.a.run.app

# BUILD IMAGE
cd /Users/livingroom/Desktop/client-2026
open docker desktop or run the docker daemon some other way
docker build --platform linux/amd64 -t client2026 .

# RUN IMAGE
ensure host port and container port are both 8080

# UPLOAD TO GCP
docker tag client2026 us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
docker push us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>

! GitHub has excellent SSH documentation
! brew upgrade google-cloud-sdk
! https://medium.com/@larry_nguyen/how-to-deploy-angular-application-on-google-cloud-run-c6d472e07bd5

Revoking firebase id tokens (ie not refresh tokens), requires a manual solution.

gcloud -v
gcloud components update
gcloud auth list
gcloud auth login
gcloud auth print-access-token
gcloud auth revoke
gcloud config set account 'masimpson123@gmail.com'
gcloud config set project 'endpoint-one'

major.minor.patch
^ latest minor
~ latest patch
19.x should install the latest version 19 package and be compatible with all version 19 packages
