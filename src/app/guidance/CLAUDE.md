# Zoom telehealth app

A port of the hackathon-2026 "Sessions for GuidanceResources" prototype, mounted at `/guidance/app`. It's its own app inside the portfolio: its own shell (`guidance-app.ts`), its own design system (ComPsych UI components and tokens), and SCSS. Match its idiom here, not the portfolio's: OnPush, signals, files without the `.component` suffix.

`guidance-intro.component.*` is the exception: it's the portfolio's demo page for the app, styled like the other demos.

- Say **member** and **provider**, never "patient" or "therapist": in code, UI copy, comments and docs.
- Two different check-ins; keep the names apart. The **new member check-in** is the PHQ-9 and GAD-7, done once per member (`/check-in`). The **pre-session check-in** is the focus form (topics and a note), one per session: done when booking and editable any time after.
- Only providers upload documents. What they upload is the member's **care plan**, which the member is expected to complete.
- All mock data lives in `api/mock/`, and only `ApiService` (`api/api.service.ts`) imports it. Everything else gets data from `ApiService`, as Observables, like HTTP responses. Lists that can grow without limit are paged on the server.
- Never use `providedIn: 'root'`. App-wide services are provided on the route in `guidance.routes.ts`; per-page ones in the page's `providers`.
- Link with the constants in `paths.ts`, never absolute paths: the app lives under the portfolio's `/guidance/app`.
- Images and sample documents (like the mock uploads) live in `public/telehealth/`. Never name a `public/` folder after a route: Express's static server would treat `/guidance` as that folder and redirect it to `/guidance/`.
- Global styles go in `guidance.scss`, scoped to `.guidance` and `.cdk-overlay-container` (dialogs render in the CDK overlay, outside the shell).
- Zoom tokens come from the Spring service's `GET /zoom-token?session=&role=&userKey=` (`call/zoom-tokens.ts`). The SDK secret never reaches the browser. Room names must look like `cs-<hex>`; the server rejects anything else.
