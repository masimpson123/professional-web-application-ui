import { CheckInAnswers, NewMemberCheckIn, Person } from '../models';
import { HOUR } from './dates';
import { AISHA, DANIEL, ELENA, GRACE, MARCUS, NOAH, PRIYA, SAM } from './people';
import { SESSIONS } from './sessions';

// ---- New member check-ins, by member ------------------------------------------------
// Everyone in the caseload has done theirs except Jordan, so the member demo offers
// it to Jordan. Scores fit what each member's sessions are about, and nobody reports
// thoughts of self-harm (the PHQ-9's last question).

/** A check-in sent two days before the member's first session. */
function sent(member: Person, answers: CheckInAnswers): NewMemberCheckIn {
  const first = Math.min(...SESSIONS.filter((s) => s.memberId === member.id).map((s) => Date.parse(s.start)));
  return { ...answers, memberId: member.id, completedAt: new Date(first - 48 * HOUR).toISOString() };
}

export const NEW_MEMBER_CHECK_INS: Record<string, NewMemberCheckIn> = Object.fromEntries(
  [
    // Setting boundaries at work, and going back after leave: mild on both.
    sent(PRIYA, { phq9: [1, 1, 1, 2, 1, 1, 1, 0, 0], gad7: [2, 2, 1, 1, 0, 2, 1], difficulty: 1 }),
    // Panic on crowded trains: moderate anxiety, little low mood.
    sent(MARCUS, { phq9: [0, 1, 1, 1, 0, 0, 1, 0, 0], gad7: [3, 2, 2, 2, 1, 1, 3], difficulty: 2 }),
    // Co-parenting, and telling the kids about the move.
    sent(ELENA, { phq9: [1, 1, 2, 1, 1, 1, 1, 0, 0], gad7: [2, 1, 2, 1, 1, 1, 1], difficulty: 1 }),
    // Just starting, without much of a routine: moderate low mood.
    sent(SAM, { phq9: [2, 1, 2, 2, 1, 1, 2, 0, 0], gad7: [1, 1, 1, 1, 0, 1, 0], difficulty: 1 }),
    // Sleeping after night shifts: sleep and energy carry the score.
    sent(AISHA, { phq9: [0, 1, 3, 3, 1, 0, 1, 0, 0], gad7: [1, 1, 1, 2, 0, 1, 0], difficulty: 1 }),
    // Grief: moderate low mood.
    sent(DANIEL, { phq9: [2, 2, 2, 2, 1, 1, 1, 1, 0], gad7: [1, 1, 1, 1, 0, 0, 1], difficulty: 2 }),
    // Perfectionism, and exam season: moderate anxiety.
    sent(GRACE, { phq9: [1, 1, 1, 1, 0, 2, 1, 0, 0], gad7: [2, 3, 2, 2, 1, 1, 2], difficulty: 1 }),
    // Anger at home: irritability stands out.
    sent(NOAH, { phq9: [1, 1, 1, 1, 0, 1, 1, 1, 0], gad7: [1, 1, 1, 1, 1, 3, 0], difficulty: 2 }),
  ].map((checkIn) => [checkIn.memberId, checkIn]),
);
