export type DemoId =
  | 'ai'
  | 'machine-learning'
  | 'data-stream'
  | 'websocket'
  | 'auth'
  | 'video'
  | 'cube'
  | 'form';

export type ServiceId = 'express' | 'spring' | 'gemini' | 'identity' | 'zoom';

export interface Demo {
  id: DemoId;
  route: string;
  title: string;
  group: 'Applied AI' | 'Systems' | 'Interface';
  summary: string;
  client: string;
  service?: string;
  platform?: string;
  origin?: string;
  calls: ServiceId[];
}

// Order matters: it drives the nav, the home page diagram rows, and the mobile index.
// The diagram's service nodes (root.component.ts) are positioned for this order:
// Spring callers must stay in consecutive rows, and Gemini, Identity Platform, and Zoom
// sit beside the AI, auth, and video rows.
export const DEMOS: Demo[] = [
  {
    id: 'machine-learning',
    route: '/machine-learning',
    title: 'Machine learning',
    group: 'Applied AI',
    summary: 'Train TensorFlow models on the server and plot their predictions in the browser. Start with one input, then predict water bottle sales from price and temperature together.',
    client: 'Angular, TensorFlow.js, Plotly',
    service: 'Express, Node.js, TensorFlow.js for Node',
    platform: 'Cloud Run, Docker',
    origin: 'Linear regression proof of concept at JPMorganChase',
    calls: ['express'],
  },
  {
    id: 'ai',
    route: '/ai',
    title: 'AI assistant',
    group: 'Applied AI',
    summary: 'Ask about Michael’s experience. A Gemini model reads his résumé, answers, and opens the demo that best fits your question.',
    client: 'Angular, NgComponentOutlet',
    service: 'Spring Boot, Gemini API',
    platform: 'Cloud Run, Docker',
    origin: 'Agentic AI proof of concept at JPMorganChase',
    calls: ['spring'],
  },
  {
    id: 'data-stream',
    route: '/data-stream',
    title: 'Streaming search',
    group: 'Systems',
    summary: 'Search several data stores at once. Each result appears as soon as its store answers, instead of waiting for the slowest one.',
    client: 'Angular, RxJS, Fetch API streams',
    service: 'Spring Boot, StreamingResponseBody, CompletableFuture',
    platform: 'Cloud Run, Docker',
    origin: 'Real-time search across large tables at JPMorganChase',
    calls: ['spring'],
  },
  {
    id: 'websocket',
    route: '/websocket',
    title: 'Pub/sub rooms',
    group: 'Systems',
    summary: 'Join a room and publish messages over STOMP. Everyone subscribed to the same room receives them.',
    client: 'Angular, STOMP.js, Signal Forms',
    service: 'Spring, Java, STOMP message broker',
    platform: 'Cloud Run, Docker',
    calls: ['spring'],
  },
  {
    id: 'auth',
    route: '/auth',
    title: 'Authentication',
    group: 'Systems',
    summary: 'Sign in with Firebase, call a protected API with your ID token, then request a custom claim that unlocks an advanced endpoint.',
    client: 'Angular, Firebase Auth',
    service: 'Spring, Java',
    platform: 'Identity Platform, Cloud Run, Docker',
    origin: 'End-user authentication system at JPMorganChase',
    calls: ['spring'],
  },
  {
    id: 'video',
    route: '/video',
    title: 'Video session',
    group: 'Systems',
    summary: 'Join one shared Zoom video call with everyone else on this page. The Spring service signs each visitor’s session token, so the Zoom secret never reaches the browser.',
    client: 'Angular, Zoom Video SDK',
    service: 'Spring Boot, JWT signing',
    platform: 'Zoom Video SDK, Cloud Run, Docker',
    calls: ['spring'],
  },
  {
    id: 'cube',
    route: '/cube',
    title: '3D visualization',
    group: 'Interface',
    summary: 'A three.js scene with raycast face picking. Point at a face to highlight it, and use the sliders to tilt and zoom.',
    client: 'Angular, three.js, WebGL',
    origin: 'Interactive 3D data center maps at Google',
    calls: [],
  },
  {
    id: 'form',
    route: '/form',
    title: 'Forms',
    group: 'Interface',
    summary: 'A multi-step reactive form with nested groups and a custom validator, next to an Angular Signal Form.',
    client: 'Angular Reactive Forms, Signal Forms',
    calls: [],
  },
];

export const DEMO_GROUPS = ['Applied AI', 'Systems', 'Interface'] as const;

export const demoById = (id: DemoId): Demo => DEMOS.find(demo => demo.id === id)!;

export const RESUME_URL = 'assets/simpsonResume2026.pdf';
