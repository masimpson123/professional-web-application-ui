import { Person, Session, SessionAiSummary, SessionDoc, SessionRecap } from '../models';
import { WIND_DOWN_PLAN } from './care-plans';
import { HOUR, at, slot } from './dates';
import { AISHA, DANIEL, ELENA, GRACE, JORDAN, MARCUS, MAYA, NOAH, PRIYA, SAM } from './people';

// ---- Sessions -------------------------------------------------------------------

/**
 * A session as stored, with what was shared in it and, once written, its recap.
 * Finished sessions also have the AI summary generated from the call.
 */
export interface SessionRecord extends Session {
  docs: SessionDoc[];
  recap?: SessionRecap;
  aiSummary?: SessionAiSummary;
}

export function booking(
  member: Person,
  number: number,
  start: string,
  focus: string,
  zoomRoom: string,
  {
    docs = [],
    recap,
    aiSummary,
  }: { docs?: SessionDoc[]; recap?: SessionRecap; aiSummary?: SessionAiSummary } = {},
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
    aiSummary,
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
    aiSummary: {
      overview:
        'Jordan and Maya met for the first time. Jordan described stress from rotating shifts that carries into evenings and sleep. Maya explained how sessions work and what stays confidential, and they agreed on a first goal.',
      topics: [
        { title: 'What brought Jordan in', detail: 'Rotating shifts and last-minute changes leave Jordan replaying the workday at night.' },
        { title: 'How sessions work', detail: 'Maya went over session length, confidentiality and the consent form, which Jordan signed.' },
        { title: 'Goals', detail: 'In a few months Jordan would like to fall asleep without going over work.' },
        { title: 'Before next time', detail: 'Jordan will note when stress shows up during the week and what was happening.' },
      ],
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
    aiSummary: {
      overview:
        'Jordan and Maya looked at where the stress comes from. Last-minute shift changes and feeling unable to turn down extra hours came up most. A values card sort showed how much family time matters to Jordan.',
      topics: [
        { title: 'Sources of stress', detail: 'Shift changes announced at short notice, and pressure to accept extra hours.' },
        { title: 'Values card sort', detail: 'Family time ranked highest, which helps explain why the schedule weighs so heavily.' },
        { title: 'Work stress timeline', detail: 'Jordan started a timeline of stressful moments and will finish it before the next session.' },
      ],
    },
  }),
  booking(JORDAN, 3, slot(-7), 'Sleep and evening routines', 'cs-fa8ab5055fda', {
    docs: [
      { id: 's3-breathing', title: 'Box breathing: a four-minute reset', kind: 'article', detail: '4 min read' },
      { id: 's3-hygiene', title: 'Sleep hygiene checklist', kind: 'worksheet', detail: 'Completed' },
      WIND_DOWN_PLAN,
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
    aiSummary: {
      overview:
        'The session focused on evenings. Jordan has been checking the shift app in bed and then lying awake planning the next day. Jordan and Maya practised box breathing and built a wind-down routine.',
      topics: [
        { title: 'Evenings and screens', detail: 'Checking the shift app in bed tends to start a cycle of planning and worry.' },
        { title: 'Box breathing', detail: 'They practised the four-count breath together, and Jordan found it calming.' },
        { title: 'Wind-down routine', detail: 'A routine that starts 30 minutes before bed, with the phone left outside the bedroom on work nights.' },
        { title: 'Sleep log', detail: 'Jordan will fill in the sleep log each morning so they can review it together.' },
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
    aiSummary: {
      overview:
        'Priya and Maya talked through a hard conversation with Priya’s manager about workload. They practised ways to say no without over-explaining, and Priya noticed how much guilt comes with setting a limit.',
      topics: [
        { title: 'Conversation with the manager', detail: 'Priya wants to raise her workload but worries about how it will be received.' },
        { title: 'Saying no', detail: 'They rehearsed short, clear responses that don’t over-explain.' },
        { title: 'Guilt', detail: 'Priya noticed guilt comes up even when a limit is small.' },
      ],
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
    aiSummary: {
      overview:
        'Priya returns to work in two weeks. She and Maya walked through the first few days, where Priya would like support, and how to answer colleagues’ questions about her leave. They started a return-to-work plan for HR.',
      topics: [
        { title: 'The first few days', detail: 'What a typical first day might look like and which parts feel hardest.' },
        { title: 'Questions from colleagues', detail: 'A few short answers Priya is comfortable giving about her leave.' },
        { title: 'Return-to-work plan', detail: 'Started together. Priya will finish it and ask HR about a phased start.' },
      ],
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
    aiSummary: {
      overview:
        'Marcus and Maya met for the first time. Marcus described panic attacks that started this spring, mostly on crowded trains and in shops. They agreed to start by understanding what happens in the body during panic.',
      topics: [
        { title: 'When panic happens', detail: 'Mostly in crowded places: the morning train and busy shops.' },
        { title: 'Panic and the body', detail: 'Maya explained the physical side of panic, and why it feels so urgent.' },
        { title: 'Panic log', detail: 'Marcus will note each episode, where he was, and its strength from 1 to 10.' },
      ],
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
    aiSummary: {
      overview:
        'Marcus and Maya went through his panic log. Most episodes were on the morning train. They practised slow breathing and talked about how panic peaks and passes on its own.',
      topics: [
        { title: 'Panic log review', detail: 'Most episodes happened on the morning commute, at a strength of 6 to 8.' },
        { title: 'Slow breathing', detail: 'They practised slow breathing, to use daily while calm so it’s easier during panic.' },
        { title: 'How panic passes', detail: 'Panic peaks and fades on its own, even when it feels like it won’t.' },
      ],
    },
  }),

  booking(ELENA, 10, slot(-14, -1), 'Co-parenting conflict', 'cs-1aa77a35b49f', {
    recap: {
      overview:
        'We talked about the back-and-forth with your ex over the holiday schedule and worked out a few phrases that keep messages short and focused on the kids.',
      nextSteps: ['Use the short-message template for the next scheduling text.'],
    },
    aiSummary: {
      overview:
        'Elena and Maya talked about the back-and-forth with Elena’s ex over the holiday schedule, and worked out a few phrases that keep messages short and focused on the kids.',
      topics: [
        { title: 'Holiday schedule', detail: 'Long message threads about the schedule have been leaving Elena drained.' },
        { title: 'Short-message template', detail: 'A few phrases that stick to logistics and keep the kids at the centre.' },
      ],
    },
  }),
  // Just finished: the AI summary is ready, but no recap has been written yet.
  booking(ELENA, 11, slot(0, -1), 'Talking to the kids about the move', 'cs-b89e38f5e20d', {
    aiSummary: {
      overview:
        'Elena and Maya planned how to tell the kids about the move. They talked about what to say, when to say it, and how each child might react.',
      topics: [
        { title: 'What to tell the kids', detail: 'Keep it simple and honest, and focus on what stays the same.' },
        { title: 'Timing', detail: 'Elena would like to tell them together, on a weekend, a few weeks before the move.' },
        { title: 'Possible reactions', detail: 'The younger child may need more reassurance; the older one may want a say in their room.' },
      ],
    },
  }),

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
    aiSummary: {
      overview:
        'Aisha and Maya talked about how hard it is to sleep after a night shift, with daylight and noise at home. They put together a plan for better daytime sleep.',
      topics: [
        { title: 'Sleeping in the day', detail: 'Daylight and household noise make it hard to fall and stay asleep.' },
        { title: 'Sleep plan', detail: 'Blackout curtains, a short wind-down after getting home, and the same sleep window on every work day.' },
        { title: 'Shift-work sleep log', detail: 'Aisha will log her sleep after each shift.' },
      ],
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

/** What each focus covers, for the AI summaries of generated sessions. */
const FOCUS_DETAILS: Record<string, string> = {
  'Getting started': 'What brought them in, how sessions work, and what they hope will change.',
  'Managing work stress': 'Where the pressure at work comes from and which parts are in their control.',
  'Sleep and evening routines': 'What happens in the hour before bed and how to wind down sooner.',
  'Setting boundaries': 'Where it’s hardest to say no, and a few ways to say it.',
  'Grief and loss': 'How the loss is showing up day to day, and what has helped so far.',
  'Anxiety at work': 'The situations that set off anxiety at work and what they do in the moment.',
  'Communication at home': 'A recent disagreement at home and how to raise things earlier.',
  'Building a daily routine': 'A simple structure for the day that leaves room for rest.',
  'Parenting stress': 'The busiest parts of the day with the kids and where support would help.',
  'Adjusting to a new role': 'What’s different in the new role and what still feels uncertain.',
  'Money worries': 'How money worries affect sleep and mood, and one practical next step.',
  'Coping with change': 'What has changed recently and what has stayed steady.',
  'Confidence at work': 'Moments of self-doubt at work and the evidence against them.',
};

/** A weekly course of `count` sessions on a weekday, the last one about `lastDaysAgo` days ago. */
function course(member: Person, count: number, lastDaysAgo: number): SessionRecord[] {
  const hour = between(8, 17) - new Date(slot(0)).getHours();
  const weekday = new Date(slot(-lastDaysAgo, hour)).getDay();
  lastDaysAgo += weekday === 0 ? 2 : weekday === 6 ? 1 : 0; // back to Friday
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    const focus = number === 1 ? 'Getting started' : pick(FOCUSES);
    // Drawn in this order so the seeded history stays the same.
    const room = roomName();
    const opening = pick(OPENINGS);
    const nextStep = pick(NEXT_STEPS);
    return booking(member, number, slot(-lastDaysAgo - 7 * (count - 1 - i), hour), focus, room, {
      recap: {
        overview: `${opening} Today’s focus was ${focus.toLowerCase()}.`,
        nextSteps: [nextStep],
      },
      aiSummary: {
        overview: `${member.firstName} and Maya met for session ${number}, on ${focus.toLowerCase()}.`,
        topics: [
          { title: focus, detail: FOCUS_DETAILS[focus] },
          { title: 'Before next time', detail: nextStep },
        ],
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
