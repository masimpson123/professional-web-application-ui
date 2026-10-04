import { Highlight, Role } from '../models';

// ---- Home page highlights -----------------------------------------------------------

/** For members: health and well-being topics. */
const FOR_MEMBERS: Highlight[] = [
  {
    id: 'breast-cancer-awareness',
    icon: 'scroll-text',
    title: 'October: Breast Cancer Awareness Month',
    description:
      'Breast cancer is one of the most commonly diagnosed cancers among women in the United States, but it can be treated if detected early.',
    actionLabel: 'Read More',
  },
  {
    id: 'world-mental-health-day',
    icon: 'heart-handshake',
    title: 'October 10: World Mental Health Day',
    description:
      'Mental health is part of overall health. Small daily habits, like rest, movement and time with people you trust, add up.',
    actionLabel: 'Read More',
  },
  {
    id: 'sleep-and-stress',
    icon: 'moon',
    title: 'Sleep and stress',
    description:
      'Stress and poor sleep feed each other. Learn a few simple ways to wind down so that rest comes more easily.',
    actionLabel: 'Read More',
  },
];

/** For providers: ComPsych resources they can bring into their sessions. */
const FOR_PROVIDERS: Highlight[] = [
  {
    id: 'articles-for-care-plans',
    icon: 'library',
    title: 'GuidanceResources articles for care plans',
    description:
      'Articles on stress, sleep, grief, relationships and more, written for members. Add one to a member’s care plan during a session.',
    actionLabel: 'Browse articles',
  },
  {
    id: 'worksheets',
    icon: 'clipboard-pen',
    title: 'Worksheets members can complete',
    description:
      'Thought records, sleep logs, values sorts and more, for members to work through between sessions.',
    actionLabel: 'Browse worksheets',
  },
  {
    id: 'legal-financial-referrals',
    icon: 'scale',
    title: 'Legal and financial consultations',
    description:
      'When money or legal worries come up in a session, members can talk them through with ComPsych’s legal and financial specialists.',
    actionLabel: 'How to refer',
  },
  {
    id: 'support-between-sessions',
    icon: 'phone',
    title: 'Support between sessions',
    description:
      'Members can call GuidanceResources any time, day or night, if they need support before their next session.',
    actionLabel: 'Share the number',
  },
];

/** What the home page's carousel features, for each side. */
export const HIGHLIGHTS: Record<Role, Highlight[]> = {
  member: FOR_MEMBERS,
  provider: FOR_PROVIDERS,
};
