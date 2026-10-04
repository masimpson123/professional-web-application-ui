// ---- Providers' working hours -------------------------------------------------
// When members can book sessions. Open times are these, less what's booked.

export interface WorkingHours {
  /** Days of the week, 0 = Sunday. */
  days: number[];
  /** Local hours sessions can start at. */
  startHours: number[];
  lengthMinutes: number;
  /** How far ahead a session must be booked. */
  minNoticeHours: number;
  /** How far ahead the calendar opens. */
  bookingWindowDays: number;
}

const WEEKDAYS_WITH_LUNCH: WorkingHours = {
  days: [1, 2, 3, 4, 5],
  startHours: [9, 10, 11, 13, 14, 15, 16],
  lengthMinutes: 50,
  minNoticeHours: 2,
  bookingWindowDays: 14,
};

/** By provider id. */
export const WORKING_HOURS: Record<string, WorkingHours> = {
  'maya-okafor': WEEKDAYS_WITH_LUNCH,
};
