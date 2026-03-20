# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200
npm run build      # Production build
npm test           # Unit tests via Karma/Jasmine
npm run lint       # ESLint
npm run watch      # Build with watch mode
```

The Express backend runs separately via `node index.js` on port 8080.

### Docker Deployment (Google Cloud Run)

```bash
docker build --platform linux/amd64 -t client2026 .
docker tag client2026 us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
docker push us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
gcloud run services update msio --region us-central1 --platform managed --image us-central1-docker.pkg.dev/endpoint-one/endpoint-one/client2026:<mmddyy>
```

## Architecture

This is a professional portfolio SPA (Angular 21) with an Express/TensorFlow.js backend, deployed to Google Cloud Run.

### Frontend (`src/app/`)

Standalone Angular components with lazy-loaded routes. Key feature routes:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | root | Landing page |
| `/cube` | cube | Interactive 3D Three.js visualization |
| `/data-stream` | data-stream | Concurrent data stream demo |
| `/ai` | ai | Google Gemini chatbot that recommends projects based on user input |
| `/resume` | resume | Resume display |
| `/form` | form | Multi-step form with validation |
| `/machine-learning` | machine-learning | TensorFlow univariate/multivariate linear regression |

The AI component dynamically loads other components via `NgComponentOutlet` based on keywords in AI responses. The machine-learning component dynamically loads `scatter-plot-xyz` for 3D scatter plot visualization.

### Backend (`index.js` + `tensorflow/`)

Express server serving the Angular build as static files and exposing ML endpoints:

- `POST /tensorflow-train-univariate-model`
- `POST /tensorflow-get-univariate-linear-regression-predictions`
- `GET /tensorflow-get-univariate-model-configuration/:file`
- `GET /tensorflow-get-multivariate-data`
- `POST /tensorflow-train-multivariate-model`
- `POST /tensorflow-get-multivariate-linear-regression-predictions`

ML logic lives in `tensorflow/tensorflow.js`. Trained models are saved to `tensorflow/model-data/`. Water bottle sales data (price, temperature, units sold) is in `tensorflow/water-bottle-data.js`.

### API URLs

- Production backend: `https://msio-u7qjhl7iia-uc.a.run.app/`
- AI endpoint: `https://endpoint-one-2-205823180568.us-central1.run.app/ai`
- Local backend: `http://localhost:8080/`

The Angular app switches between these based on `window.location.hostname`.

### Key Technologies

- **Angular 21** with standalone components and Angular Signals
- **Three.js** for 3D cube visualization
- **TensorFlow.js** (browser + Node) for ML training and inference
- **Plotly.js** for charting
- **Firebase** for authentication
- **RxJS** for reactive data streams
- **TypeScript 5.9** in strict mode
