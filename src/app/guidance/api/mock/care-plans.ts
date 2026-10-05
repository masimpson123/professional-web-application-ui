import { CarePlanItem, SessionDoc } from '../models';
import { day } from './dates';
import { AISHA, DANIEL, ELENA, GRACE, JORDAN, MARCUS, NOAH, PRIYA, SAM } from './people';
import { RESOURCES } from './resources';

/** A document Maya uploaded for Jordan in session 3, so it's also shared in that session. */
export const WIND_DOWN_PLAN: SessionDoc = {
  id: 'upload-wind-down-plan',
  title: 'Wind-down plan.pdf',
  kind: 'file',
  detail: 'PDF, 1 KB',
  url: 'telehealth/wind-down-plan.pdf',
};

/**
 * A library resource as a care plan item, in the shape adding it from the library
 * gives (`plan-<resource id>`), so the library knows it's already in the plan.
 */
function fromLibrary(resourceId: string, dueInDays: number, done = false): CarePlanItem {
  const resource = RESOURCES.find((r) => r.id === resourceId);
  if (!resource) throw new Error(`demo data: no library resource ${resourceId}`);
  const { id, kind, title, detail } = resource;
  return { id: `plan-${id}`, kind, title, detail, due: day(dueInDays), done };
}

// ---- Care plans, by member -------------------------------------------------------------
// Every item is a ComPsych library resource (see resources.ts) or, once added in
// the app, a document the provider uploaded. Items are due by the member's next
// session, and each plan fits what their sessions are about.

export const CARE_PLANS: Record<string, CarePlanItem[]> = {
  [JORDAN.id]: [
    fromLibrary('worry-loops', 7),
    fromLibrary('box-breathing', 0, true),
    fromLibrary('daily-routine', 7),
    {
      ...WIND_DOWN_PLAN,
      kind: 'file',
      id: `plan-${WIND_DOWN_PLAN.id}`,
      due: day(7),
      done: false,
    },
  ],
  // Setting boundaries at work, and going back after leave.
  [PRIYA.id]: [
    fromLibrary('saying-no', 7, true),
    fromLibrary('return-to-work', 7),
    fromLibrary('balancing-priorities', 7),
  ],
  // Panic on crowded trains.
  [MARCUS.id]: [
    fromLibrary('understanding-panic', 7, true),
    fromLibrary('box-breathing', 7, true),
    fromLibrary('grounding', 7),
  ],
  // Co-parenting, and telling the kids about the move.
  [ELENA.id]: [
    fromLibrary('co-parenting', 7, true),
    fromLibrary('kids-and-moving', 7),
    fromLibrary('mindful-minute', 7),
  ],
  // Just starting; session 2 is on building a daily routine.
  [SAM.id]: [
    fromLibrary('huddles', 3),
    fromLibrary('daily-routine', 3),
  ],
  // Sleeping after night shifts.
  [AISHA.id]: [
    fromLibrary('sleep-hygiene', 0, true),
    fromLibrary('worry-loops', 0),
    fromLibrary('mindful-minute', 0, true),
  ],
  // Grief, with the holidays coming.
  [DANIEL.id]: [
    fromLibrary('grief-holidays', 1, true),
    fromLibrary('huddles', 1),
    fromLibrary('caregiver-stress', 1),
  ],
  // Perfectionism, and exam season.
  [GRACE.id]: [
    fromLibrary('perfectionism', 1, true),
    fromLibrary('time-management', 1, true),
    fromLibrary('box-breathing', 1),
    fromLibrary('building-confidence', 1),
  ],
  // Anger at home.
  [NOAH.id]: [
    fromLibrary('anger-at-home', 2),
    fromLibrary('mastering-communication', 2),
  ],
};
