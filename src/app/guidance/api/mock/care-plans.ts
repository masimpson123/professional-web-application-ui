import { CarePlanItem, SessionDoc } from '../models';
import { day } from './dates';
import { JORDAN, PRIYA } from './people';

/** A document Maya uploaded for Jordan in session 3, so it's also shared in that session. */
export const WIND_DOWN_PLAN: SessionDoc = {
  id: 'upload-wind-down-plan',
  title: 'Wind-down plan.pdf',
  kind: 'file',
  detail: 'PDF, 1 KB',
  url: 'telehealth/wind-down-plan.pdf',
};

// ---- Care plans, by member -------------------------------------------------------------
// Every item is a ComPsych library resource (see resources.ts) or, once added in
// the app, a document the provider uploaded.

export const CARE_PLANS: Record<string, CarePlanItem[]> = {
  [JORDAN.id]: [
    {
      id: 'plan-worry-loops',
      title: 'Why worry loops at night, and how to interrupt them',
      kind: 'article',
      detail: '7 min read',
      due: day(7),
      done: false,
    },
    {
      id: 'plan-box-breathing',
      title: 'Box breathing: a four-minute reset',
      kind: 'article',
      detail: '4 min read',
      due: day(0),
      done: true,
    },
    {
      id: 'plan-daily-routine',
      title: 'Build a daily routine',
      kind: 'worksheet',
      detail: 'About 10 minutes',
      due: day(7),
      done: false,
    },
    {
      ...WIND_DOWN_PLAN,
      kind: 'file',
      id: `plan-${WIND_DOWN_PLAN.id}`,
      due: day(7),
      done: false,
    },
  ],
  [PRIYA.id]: [
    {
      id: 'plan-priya-boundaries',
      title: 'Saying no without over-explaining',
      kind: 'article',
      detail: '5 min read',
      due: day(7),
      done: false,
    },
  ],
};
