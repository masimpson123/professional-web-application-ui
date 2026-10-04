# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200, calling local backends
npm run start:prod # Dev server at localhost:4200, calling production backends
npm run build      # Production build (what gets deployed)
npm run lint       # ESLint
npm run watch      # Development build in watch mode, calling local backends
node index.js --local-development  # Express backend on port 8080, accepting requests from npm start
```

The Spring backend lives in `../service-2025` and runs locally on port 8081. There are no unit tests.

### Docker Deployment (Google Cloud Run)

Run `/deploy-to-gcp` to sign in, build, and deploy the local working tree. The steps it runs:

```bash
docker build --platform linux/amd64 -t client2026 .
docker tag client2026 us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
docker push us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
gcloud run services update msio --region us-central1 --platform managed --image us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
```

The image builds the Angular app and runs `index.js`, which serves both the app and the machine learning endpoints.

## Architecture

A professional portfolio SPA (Angular 21) deployed to Google Cloud Run as the `msio` service. It calls two backends: the Express/TensorFlow.js server in this repo, and the Spring Boot service in `../service-2025` (Cloud Run service `endpoint-one-2`).

### Frontend (`src/app/`)

Standalone Angular components with lazy-loaded routes:

| Route | Component | Description |
|-------|-----------|-------------|
| `/root` (and any unknown path) | root | Landing page with an architecture diagram of the demos |
| `/ai` | ai | Gemini assistant that answers questions and embeds the most relevant demo |
| `/machine-learning` | machine-learning | TensorFlow univariate and multivariate linear regression |
| `/data-stream` | data-stream | Search that streams results from several data stores as they arrive |
| `/websocket` | websocket | STOMP pub/sub rooms |
| `/auth` | auth | Firebase sign-in, protected API calls, and custom claims |
| `/video` | video | Shared Zoom Video SDK session for everyone on the page |
| `/cube` | cube | Interactive three.js cube with face picking |
| `/form` | form | Multi-step reactive form and a Signal Form |
| `/resume` | resume | Opens the résumé PDF in a new tab and returns to `/root` |

Shared pieces:

- `demos.ts` is the single source of truth for each demo's title, summary, stack, and route. The nav, the home page diagram, and every demo header read from it.
- `demo-header/` renders the title, summary, and stack table at the top of each demo.
- `src/styles.css` holds the design tokens (colors, type scale, radii) and shared patterns (`.stage`, `.steps`, `.row`, `.field`, `.status`).

The AI component dynamically loads other components via `NgComponentOutlet` based on the keyword at the end of the AI response. The machine-learning component dynamically loads `scatter-plot-xyz` for the 3D scatter plot. The video component loads the Zoom SDK only when someone joins.

### Express backend (`index.js` + `tensorflow/`)

Serves the Angular build as static files and exposes the ML endpoints:

- `POST /tensorflow-train-univariate-model`
- `POST /tensorflow-get-univariate-linear-regression-predictions`
- `GET /tensorflow-get-univariate-model-configuration/:file`
- `GET /tensorflow-get-multivariate-data`
- `POST /tensorflow-train-multivariate-model`
- `POST /tensorflow-get-multivariate-linear-regression-predictions`

ML logic lives in `tensorflow/tensorflow.js`. Trained models are saved to `tensorflow/model-data/` (gitignored). Water bottle sales data (price, temperature, units sold) is in `tensorflow/water-bottle-data.js`.

CORS allows `https://msio-u7qjhl7iia-uc.a.run.app`. Starting the server with `--local-development` also allows `http://localhost:4200`.

### API URLs

Backend URLs live in `src/environments/`. Never hardcode them in components.

| File | Used by | Spring service (`springApiUrl`) | Express service (`expressApiUrl`) |
|---|---|---|---|
| `environment.ts` | `npm run build` (deploys), `npm run start:prod` | `https://endpoint-one-2-205823180568.us-central1.run.app/` | `https://msio-u7qjhl7iia-uc.a.run.app/` |
| `environment.development.ts` | `npm start`, `npm run watch` | `http://localhost:8081/` | `http://localhost:8080/` |

The WebSocket broker URL is derived from `springApiUrl`.

### Key Technologies

- **Angular 21** with standalone components and Angular Signals
- **Three.js** for the 3D cube
- **TensorFlow.js** (browser + Node) for ML training and inference, with **tfjs-vis** for 2D charts
- **Plotly.js** for the 3D scatter plot
- **Firebase Auth** for authentication
- **STOMP.js** for WebSocket pub/sub
- **Zoom Video SDK** for the video session
- **RxJS** for reactive data streams
- **TypeScript 5.9** in strict mode
