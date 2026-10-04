import { CarePlanItem } from '../models';
import { day } from './dates';
import { AISHA, JORDAN, PRIYA } from './people';

// ---- Care plans, by member -------------------------------------------------------------

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
      id: 'plan-thought-record',
      title: 'Thought record: catching the first thought',
      kind: 'worksheet',
      detail: 'About 10 minutes',
      due: day(7),
      done: false,
      progress: { completed: 3, total: 6, unit: 'prompts' },
    },
    {
      id: 'plan-sleep-log',
      title: 'Weekly sleep log',
      kind: 'worksheet',
      detail: 'A minute each morning',
      due: day(14),
      done: false,
      progress: { completed: 2, total: 7, unit: 'nights' },
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
  [AISHA.id]: [
    {
      id: 'plan-aisha-sleep-log',
      title: 'Shift-work sleep log',
      kind: 'worksheet',
      detail: 'A minute after each shift',
      due: day(0),
      done: false,
      progress: { completed: 4, total: 5, unit: 'shifts' },
    },
  ],
};
