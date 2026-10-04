import { Person, Session, SessionDoc, SessionRecap } from '../models';
import { HOUR, at, slot } from './dates';
import { AISHA, DANIEL, ELENA, GRACE, JORDAN, MARCUS, MAYA, NOAH, PRIYA, SAM } from './people';

// ---- Sessions -------------------------------------------------------------------

/** A session as stored, with what was shared in it and, once written, its recap. */
export interface SessionRecord extends Session {
  docs: SessionDoc[];
  recap?: SessionRecap;
}

export function booking(
  member: Person,
  number: number,
  start: string,
  focus: string,
  zoomRoom: string,
  { docs = [], recap }: { docs?: SessionDoc[]; recap?: SessionRecap } = {},
): SessionRecord {
  return {
    id: `${member.id}-${number}`,
    number,
    providerId: MAYA.id,
    memberId: member.id,
    start,
    lengthMinutes: 50,
    focus,
    zoomRoom,
    docs,
    recap,
  };
}

/** The current caseload: the sessions written out by hand. */
const CURRENT: SessionRecord[] = [
  // Jordan, weekly at this time. Session 4 is the one in progress.
  booking(JORDAN, 1, slot(-21), 'Getting started', 'cs-135985ece593', {
    docs: [
      { id: 's1-intake', title: 'Intake summary', kind: 'summary', detail: 'Note' },
      { id: 's1-consent', title: 'Consent and confidentiality', kind: 'form', detail: 'Signed' },
    ],
    recap: {
      overview:
        'We got to know each other and talked about what brought you in: stress from rotating shifts that has been spilling into your evenings and your sleep. We went over how our sessions work and what stays confidential, and you said that in a few months you’d like to be falling asleep without replaying the workday.',
      nextSteps: ['During the week, jot down when stress shows up and what was happening at the time.'],
    },
  }),
  booking(JORDAN, 2, slot(-14), 'Naming what drives the stress', 'cs-1e56fc82445d', {
    docs: [
      { id: 's2-values', title: 'Values card sort', kind: 'worksheet', detail: 'Completed' },
      { id: 's2-timeline', title: 'Work stress timeline', kind: 'worksheet', detail: 'Completed' },
    ],
    recap: {
      overview:
        'We mapped out where the stress comes from. The biggest pieces were last-minute shift changes and feeling you can’t turn down extra hours. The values card sort showed how much family time matters to you, which helps explain why the schedule weighs so heavily.',
      nextSteps: [
        'Finish the work stress timeline and bring it next time.',
        'Keep one evening this week free for family.',
      ],
    },
  }),
  booking(JORDAN, 3, slot(-7), 'Sleep and evening routines', 'cs-fa8ab5055fda', {
    docs: [
      { id: 's3-breathing', title: 'Box breathing: a four-minute reset', kind: 'article', detail: '4 min read' },
      { id: 's3-hygiene', title: 'Sleep hygiene checklist', kind: 'worksheet', detail: 'Completed' },
    ],
    recap: {
      overview:
        'We focused on evenings. You’ve been checking the shift app in bed and then lying awake running through the next day. We practised box breathing together and built a wind-down routine that starts half an hour before bed.',
      nextSteps: [
        'Try box breathing once you’re in bed.',
        'Leave your phone outside the bedroom on work nights.',
        'Fill in the sleep log each morning.',
      ],
    },
  }),
  booking(JORDAN, 4, slot(0), 'Worry at night', 'cs-15ae0429935b', {
    docs: [
      { id: 'today-agenda', title: 'Agenda for today', kind: 'summary', detail: 'Note' },
      { id: 'today-grounding', title: 'Grounding with 5-4-3-2-1', kind: 'article', detail: '3 min read' },
    ],
  }),
  booking(JORDAN, 5, slot(7), 'Reviewing the thought record', 'cs-8cffafcfd312'),
  booking(JORDAN, 6, slot(14), 'Planning for the holidays', 'cs-c2125b0f3ece'),

  // The rest of Maya's caseload: earlier today, later today, and the coming days.
  booking(PRIYA, 6, slot(-7, -3), 'Setting boundaries with a manager', 'cs-b4b1c883c8ae', {
    docs: [
      { id: 'p6-saying-no', title: 'Saying no without over-explaining', kind: 'article', detail: '5 min read' },
    ],
    recap: {
      overview:
        'We talked through a hard conversation with your manager about workload and practised a few ways to say no without over-explaining. You noticed how much guilt comes up whenever you set a limit, even a small one.',
      nextSteps: ['Set one small boundary at work and notice how it goes.'],
    },
  }),
  booking(PRIYA, 7, slot(0, -3), 'Returning to work after leave', 'cs-27523d57cd4e', {
    docs: [
      { id: 'p7-plan', title: 'Return-to-work plan', kind: 'worksheet', detail: 'About 15 minutes' },
    ],
    recap: {
      overview:
        'You go back to work in two weeks. We walked through what the first few days might look like, where you’d like support, and how to answer colleagues’ questions about your leave. We started a return-to-work plan you can take to HR.',
      nextSteps: ['Finish the return-to-work plan.', 'Ask HR whether a phased start is possible.'],
    },
  }),
  booking(PRIYA, 8, slot(7, -3), 'First week back', 'cs-42ec53077f55'),

  booking(MARCUS, 1, slot(-7, -2), 'Getting started', 'cs-e858486edf92', {
    docs: [{ id: 'm1-intake', title: 'Intake summary', kind: 'summary', detail: 'Note' }],
    recap: {
      overview:
        'We met for the first time and talked about the panic attacks that started this spring, mostly on crowded trains and in shops. We agreed to begin by understanding what happens in your body during panic.',
      nextSteps: ['Each time panic shows up, note where you were and how strong it felt, from 1 to 10.'],
    },
  }),
  booking(MARCUS, 2, slot(0, -2), 'Panic in crowded places', 'cs-2773372ba0fb', {
    recap: {
      overview:
        'We went through your panic log together: most episodes were on the morning train. We practised slow breathing and talked about how panic peaks and passes on its own, even when it feels like it won’t.',
      nextSteps: [
        'Practise slow breathing for five minutes a day while you’re calm.',
        'Keep logging panic episodes.',
      ],
    },
  }),

  booking(ELENA, 10, slot(-14, -1), 'Co-parenting conflict', 'cs-1aa77a35b49f', {
    recap: {
      overview:
        'We talked about the back-and-forth with your ex over the holiday schedule and worked out a few phrases that keep messages short and focused on the kids.',
      nextSteps: ['Use the short-message template for the next scheduling text.'],
    },
  }),
  // Just finished, so no recap has been written yet.
  booking(ELENA, 11, slot(0, -1), 'Talking to the kids about the move', 'cs-b89e38f5e20d'),

  booking(SAM, 1, slot(0, 1), 'Getting started', 'cs-bc012c5c73a0'),
  booking(SAM, 2, at(3, '15:00'), 'Building a daily routine', 'cs-b0d993607f5f'),

  booking(AISHA, 4, slot(-7, 2), 'Sleep after night shifts', 'cs-52062534512c', {
    docs: [
      { id: 'a4-log', title: 'Shift-work sleep log', kind: 'worksheet', detail: 'A minute after each shift' },
    ],
    recap: {
      overview:
        'We talked about how hard it is to sleep after a night shift, with daylight and noise at home. We put together a plan: blackout curtains, a short wind-down when you get in, and the same sleep window on every work day.',
      nextSteps: ['Fill in the shift-work sleep log after each shift.'],
    },
  }),
  booking(AISHA, 5, slot(0, 2), 'Winding down after a shift', 'cs-b50d8543d09a'),

  booking(DANIEL, 3, at(1, '09:00'), 'Grief and the holidays', 'cs-5ee01a6134b0'),
  booking(GRACE, 8, at(1, '13:30'), 'Perfectionism at school', 'cs-74e428a447bb'),
  booking(NOAH, 2, at(2, '10:00'), 'Anger at home', 'cs-e5088575d1e4'),
  booking(DANIEL, 4, at(8, '09:00'), 'Grief and the holidays, continued', 'cs-61e660d884e3'),
  booking(GRACE, 9, at(8, '13:30'), 'Exam season', 'cs-428c025ee5dc'),
];

// ---- History ------------------------------------------------------------------
// Years of finished sessions, generated, so lists have more past sessions than fit
// on one page. Seeded, so the history is the same on every load.

/** A small seeded random number generator (mulberry32): the same sequence every time. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(20261004);
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
const between = (low: number, high: number) => low + Math.floor(random() * (high - low + 1));
const roomName = () => `cs-${Array.from({ length: 12 }, () => between(0, 15).toString(16)).join('')}`;

const FOCUSES = [
  'Managing work stress',
  'Sleep and evening routines',
  'Setting boundaries',
  'Grief and loss',
  'Anxiety at work',
  'Communication at home',
  'Building a daily routine',
  'Parenting stress',
  'Adjusting to a new role',
  'Money worries',
  'Coping with change',
  'Confidence at work',
];

const OPENINGS = [
  'We looked at what has changed since last time and where things still feel hard.',
  'We picked up where we left off and talked through a difficult week.',
  'We went over what you tried since our last session and what got in the way.',
  'We spent most of the session on one situation that keeps coming up.',
];

const NEXT_STEPS = [
  'Notice when it shows up and jot down what was happening.',
  'Try the breathing exercise once a day while you’re calm.',
  'Keep one evening this week free for yourself.',
  'Write down one thing that went well each day.',
  'Practise the conversation we rehearsed before you have it.',
  'Keep the same bedtime on work nights.',
];

/** A weekly course of `count` sessions on a weekday, the last one about `lastDaysAgo` days ago. */
function course(member: Person, count: number, lastDaysAgo: number): SessionRecord[] {
  const hour = between(8, 17) - new Date(slot(0)).getHours();
  const weekday = new Date(slot(-lastDaysAgo, hour)).getDay();
  lastDaysAgo += weekday === 0 ? 2 : weekday === 6 ? 1 : 0; // back to Friday
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    const focus = number === 1 ? 'Getting started' : pick(FOCUSES);
    return booking(member, number, slot(-lastDaysAgo - 7 * (count - 1 - i), hour), focus, roomName(), {
      recap: {
        overview: `${pick(OPENINGS)} Today’s focus was ${focus.toLowerCase()}.`,
        nextSteps: [pick(NEXT_STEPS)],
      },
    });
  });
}

/** Sessions current members had before the ones written out above, so the numbering adds up. */
function earlier(member: Person, firstWrittenNumber: number): SessionRecord[] {
  const first = CURRENT.filter((s) => s.memberId === member.id && s.number === firstWrittenNumber)[0];
  if (!first || firstWrittenNumber <= 1) return [];
  const daysBefore = Math.round((Date.now() - Date.parse(first.start)) / (24 * HOUR)) + 7;
  return course(member, firstWrittenNumber - 1, daysBefore);
}

const FIRST_NAMES = ['Alex', 'Bianca', 'Carlos', 'Dana', 'Eli', 'Fatima', 'Gabe', 'Hana', 'Isaac', 'Jade', 'Kofi', 'Lena', 'Mateo', 'Nora', 'Omar', 'Paige', 'Quinn', 'Rosa', 'Sanjay', 'Tess', 'Umar', 'Vera', 'Wes', 'Yara', 'Zoe'];
const LAST_NAMES = ['Adams', 'Brooks', 'Castillo', 'Dubois', 'Evans', 'Foster', 'Garcia', 'Hughes', 'Ito', 'Jensen', 'Khan', 'Lopez', 'Moreau', 'Nakamura', 'Owens', 'Patel', 'Rossi', 'Silva', 'Tanaka', 'Varga', 'Walsh', 'Young'];

/** Members who finished working with Maya over the past three years. */
export const FORMER_MEMBERS: Person[] = Array.from({ length: 50 }, (_, i) => {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    id: `former-${i + 1}-${firstName}-${lastName}`.toLowerCase(),
    name: `${firstName} ${lastName}`,
    firstName,
    initials: `${firstName[0]}${lastName[0]}`,
  };
});

/** Every session: the current caseload, its earlier sessions, and former members' courses. */
export const SESSIONS: SessionRecord[] = [
  ...CURRENT,
  ...earlier(PRIYA, 6),
  ...earlier(ELENA, 10),
  ...earlier(AISHA, 4),
  ...earlier(DANIEL, 3),
  ...earlier(GRACE, 8),
  ...earlier(NOAH, 2),
  ...FORMER_MEMBERS.flatMap((member) => course(member, between(4, 14), between(35, 3 * 365))),
];
