// Production backends. Used by `npm run build` (what gets deployed) and `npm run start:prod`.
export const environment = {
  /** service-2025 (Spring Boot): AI, auth, search, WebSockets, and Zoom tokens. */
  springApiUrl: 'https://endpoint-one-2-205823180568.us-central1.run.app/',
  /** index.js (Express + TensorFlow.js): machine learning. */
  expressApiUrl: 'https://msio-u7qjhl7iia-uc.a.run.app/',
};
