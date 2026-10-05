# CLAUDE.md

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

Run `/deploy-to-gcp` to sign in, build, and deploy the local working tree.

The image builds the Angular app and runs `index.js`, which serves both the app and the machine learning endpoints.

## Architecture

A professional portfolio SPA (Angular 21) deployed to Google Cloud Run as the `msio` service. It calls two backends: the Express/TensorFlow.js server in this repo, and the Spring Boot service in `../service-2025` (Cloud Run service `endpoint-one-2`).

### Frontend (`src/app/`)

- `demos.ts` is the single source of truth for each demo's title, summary, stack, and route. The nav, the home page diagram, and every demo header read from it.
- `demo-header/` renders the title, summary, and stack table at the top of each demo.
- `src/styles.css` holds the design tokens (colors, type scale, radii) and shared patterns (`.stage`, `.steps`, `.row`, `.field`, `.status`). Its element styles sit in `@scope` blocks that stop at `.guidance` and `.cdk-overlay-container`, so they never reach the Zoom telehealth app.

The AI component dynamically loads other components via `NgComponentOutlet` based on the keyword at the end of the AI response. The machine-learning component dynamically loads `scatter-plot-xyz` for the 3D scatter plot. The Zoom telehealth app (`guidance/`) is a separate app mounted under `/guidance/app`, with its own shell, services, and ComPsych design system; see `src/app/guidance/CLAUDE.md`. Its route has `data: { fullScreen: true }`, which makes `AppComponent` hide the shell bar and rail. Its services are provided on its route, not in root, and it loads the Zoom SDK only when a room is joined.

### Express backend (`index.js` + `tensorflow/`)

CORS allows `https://msio-u7qjhl7iia-uc.a.run.app`. Starting the server with `--local-development` also allows `http://localhost:4200`.

### API URLs

Backend URLs live in `src/environments/`. Never hardcode them in components.
