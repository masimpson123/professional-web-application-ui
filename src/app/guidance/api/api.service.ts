import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import {
  CARE_PLANS,
  CARE_PLAN_NOTES,
  NEW_MEMBER_CHECK_INS,
  FORMER_MEMBERS,
  HIGHLIGHTS,
  JORDAN,
  MAYA,
  PEOPLE,
  RESOURCES,
  SESSIONS,
  SETTINGS,
  WORKING_HOURS,
  type SessionRecord,
  day,
  localDate,
} from './mock';
import {
  AiScribeConsent,
  BookingRequest,
  CarePlan,
  CarePlanItem,
  CheckInAnswers,
  CheckInFocus,
  Highlight,
  MemberSettings,
  NewMemberCheckIn,
  NewMemberCheckInStatus,
  Page,
  Person,
  Resource,
  ResourceQuery,
  Role,
  Session,
  SessionDetail,
  SessionRecap,
  SessionDoc,
  SessionSummary,
  SessionsQuery,
  TimeSlot,
  sessionEnd,
  sessionPhase,
} from './models';

/**
 * The app's one source of data: sessions, the people in them, care plans, and the
 * home page's highlights.
 *
 * It stands in for HTTP calls to the Java service, serving the demo data in
 * `./mock`. Each method returns what `HttpClient` would: a cold Observable that
 * emits one response after a short delay and completes, or errors with an
 * `HttpErrorResponse`. Moving to real requests should only change this file.
 */
@Injectable()
export class ApiService {
  /**
   * This is the demo's in-memory API. Mock-up-only shortcuts (like filling in a
   * form) check it, so they go when real requests replace this file.
   */
  readonly demo = true;

  /** `GET /api/me`. There's no sign-in yet, so the demo signs in as either side. */
  getCurrentUser(role: Role): Observable<Person> {
    return respond('/api/me', () => (role === 'provider' ? MAYA : JORDAN));
  }

  /**
   * `GET /api/highlights`: what the home page features this month, for the
   * signed-in side. Members get health topics; providers get ComPsych resources
   * to use in their sessions.
   */
  getHighlights(role: Role): Observable<Highlight[]> {
    return respond('/api/highlights', () => HIGHLIGHTS[role]);
  }

  /**
   * `GET /api/people/:id/sessions?when=&limit=&cursor=`: one page of the sessions
   * a person is booked into. `upcoming` is in progress and future, soonest first;
   * `past` is finished, most recent first. Paged on the server with a cursor, so
   * any number of sessions can be listed a page at a time.
   */
  getSessions(
    personId: string,
    { when, limit = 20, cursor }: SessionsQuery,
  ): Observable<Page<SessionSummary>> {
    return respond(`/api/people/${personId}/sessions?when=${when}`, () => {
      const now = Date.now();
      const past = when === 'past';
      const matching = SESSIONS.filter(
        (s) =>
          (s.providerId === personId || s.memberId === personId) && sessionEnd(s) <= now === past,
      ).sort((a, b) => sortKey(a).localeCompare(sortKey(b)) * (past ? -1 : 1));

      // Keyset paging: carry on after the last session the client has, so a page
      // stays right even if sessions start or finish in between requests.
      const from = cursor
        ? matching.findIndex((s) => (past ? sortKey(s) < cursor : sortKey(s) > cursor))
        : 0;
      const items = from < 0 ? [] : matching.slice(from, from + limit);
      const more = from >= 0 && from + limit < matching.length;
      return {
        items: items.map(toSummary),
        nextCursor: more ? sortKey(items[items.length - 1]) : undefined,
        total: matching.length,
      };
    });
  }

  /** `GET /api/members/:id/providers`: the providers a member works with. */
  getProviders(memberId: string): Observable<Person[]> {
    return respond(`/api/members/${memberId}/providers`, () => {
      const ids = new Set(SESSIONS.filter((s) => s.memberId === memberId).map((s) => s.providerId));
      return [...ids].map(person);
    });
  }

  /**
   * `GET /api/providers/:id/availability`: the times a member can book, soonest
   * first: the provider's working hours over the booking window, less anything
   * already booked and anything too soon.
   */
  getAvailability(providerId: string): Observable<TimeSlot[]> {
    return respond(`/api/providers/${providerId}/availability`, () => {
      const hours = WORKING_HOURS[providerId];
      if (!hours) return [];
      const earliest = Date.now() + hours.minNoticeHours * 60 * 60_000;
      const slots: TimeSlot[] = [];
      for (let offset = 0; offset <= hours.bookingWindowDays; offset++) {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        if (!hours.days.includes(date.getDay())) continue;
        for (const hour of hours.startHours) {
          date.setHours(hour, 0, 0, 0);
          const slot = { start: date.toISOString(), lengthMinutes: hours.lengthMinutes };
          if (date.getTime() >= earliest && !isBooked(providerId, slot)) slots.push(slot);
        }
      }
      return slots;
    });
  }

  /**
   * `POST /api/sessions`: a member books one of a provider's open times. The new
   * session gets its own Zoom room. 409s if the time was taken in the meantime.
   */
  bookSession({ memberId, providerId, start, format, focus }: BookingRequest): Observable<SessionSummary> {
    return respond('/api/sessions', () => {
      const hours = WORKING_HOURS[providerId];
      const slot = { start, lengthMinutes: hours?.lengthMinutes ?? 50 };
      if (!hours || isBooked(providerId, slot) || Date.parse(start) < Date.now()) {
        throw new HttpErrorResponse({ status: 409, statusText: 'Conflict', url: '/api/sessions' });
      }
      const record: SessionRecord = {
        id: `${memberId}-${crypto.randomUUID().slice(0, 8)}`,
        number: 0,
        providerId,
        memberId,
        start,
        lengthMinutes: slot.lengthMinutes,
        // Named after what they chose; the provider can rename it.
        focus: focus?.topics.join(', ') || focus?.note.slice(0, 60) || 'Check-in',
        checkInFocus: focus?.topics.length || focus?.note ? focus : undefined,
        format,
        // Every session gets a room, so a phone or in-person one can still move to video.
        zoomRoom: `cs-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`,
        docs: [],
      };
      SESSIONS.push(record);
      // Keep numbering in date order, so a session booked sooner than ones already
      // booked doesn't come out of sequence.
      SESSIONS.filter((s) => s.providerId === providerId && s.memberId === memberId)
        .sort(byStart)
        .forEach((s, i) => (s.number = i + 1));
      return toSummary(record);
    });
  }

  /** `GET /api/sessions/:id`: everything the session room needs. 404s for an unknown id. */
  getSession(id: string): Observable<SessionDetail> {
    return respond(`/api/sessions/${id}`, () => {
      const record = SESSIONS.find((s) => s.id === id);
      if (!record) return undefined;
      const { docs, recap, aiSummary, checkInFocus, aiScribe, ...session } = record;

      const series = SESSIONS.filter(
        (s) => s.memberId === session.memberId && s.providerId === session.providerId,
      ).sort(byStart);
      const next = series.find((s) => s.start > session.start);

      return {
        session,
        provider: person(session.providerId),
        member: person(session.memberId),
        shared: docs,
        recap,
        // Generated from the call's transcript, so there's none until the call has ended.
        aiSummary: sessionPhase(session) === 'ended' ? aiSummary : undefined,
        checkInFocus,
        aiScribe,
        carePlan: planFor(session.memberId),
        carePlanNote: CARE_PLAN_NOTES[session.memberId],
        nextSession: next && localDate(new Date(next.start)),
      };
    });
  }

  /**
   * `PUT /api/sessions/:id/ai-scribe`: the member says whether their provider may
   * use AI scribe in this session. They can change it during the session.
   */
  setAiScribe(sessionId: string, consent: AiScribeConsent): Observable<AiScribeConsent> {
    return respond(`/api/sessions/${sessionId}/ai-scribe`, () => {
      const record = SESSIONS.find((s) => s.id === sessionId);
      if (!record) return undefined;
      record.aiScribe = consent;
      return consent;
    });
  }

  /** `GET /api/members/:id/settings`: the member's settings, from My profile. */
  getSettings(memberId: string): Observable<MemberSettings> {
    return respond(`/api/members/${memberId}/settings`, () => SETTINGS[memberId] ?? {});
  }

  /** `PUT /api/members/:id/settings`: replaces the member's settings. */
  saveSettings(memberId: string, settings: MemberSettings): Observable<MemberSettings> {
    return respond(`/api/members/${memberId}/settings`, () => (SETTINGS[memberId] = settings));
  }

  /**
   * `PUT /api/sessions/:id/check-in/focus`: the pre-session check-in, what the
   * member would like to focus on. They can change it any time; their provider
   * sees it before the session.
   */
  saveCheckInFocus(sessionId: string, focus: CheckInFocus): Observable<CheckInFocus> {
    return respond(`/api/sessions/${sessionId}/check-in/focus`, () => {
      const record = SESSIONS.find((s) => s.id === sessionId);
      if (!record) return undefined;
      record.checkInFocus = focus;
      return focus;
    });
  }

  /**
   * `GET /api/members/:id/new-member-check-in`: whether the member has done their
   * new member check-in (it's done once), and their next session, which it helps with.
   */
  getNewMemberCheckIn(memberId: string): Observable<NewMemberCheckInStatus> {
    return respond(`/api/members/${memberId}/new-member-check-in`, () => {
      const next = nextSession(memberId);
      return {
        completedAt: NEW_MEMBER_CHECK_INS[memberId]?.completedAt,
        nextSession: next && toSummary(next),
      };
    });
  }

  /**
   * `POST /api/members/:id/new-member-check-in`: the member sends their new member
   * check-in. It's done once; their provider sees it before their next session.
   */
  submitNewMemberCheckIn(memberId: string, answers: CheckInAnswers): Observable<NewMemberCheckIn> {
    return respond(`/api/members/${memberId}/new-member-check-in`, () => {
      NEW_MEMBER_CHECK_INS[memberId] = { ...answers, memberId, completedAt: new Date().toISOString() };
      return NEW_MEMBER_CHECK_INS[memberId];
    });
  }

  /**
   * `PUT /api/sessions/:id/recap`: the provider writes or edits their notes on a
   * session. Members can read the notes but not change them. 404s for an unknown id.
   */
  saveRecap(sessionId: string, recap: SessionRecap): Observable<SessionRecap> {
    return respond(`/api/sessions/${sessionId}/recap`, () => {
      const record = SESSIONS.find((s) => s.id === sessionId);
      if (!record) return undefined;
      record.recap = recap;
      return recap;
    });
  }

  /**
   * `GET /api/people/:id/care-plans`: a member's care plan, or the care plans of
   * every member a provider is working with now, the soonest session first.
   * Members whose last session was over a month ago have finished, so they're out.
   */
  getCarePlans(personId: string): Observable<CarePlan[]> {
    return respond(`/api/people/${personId}/care-plans`, () => {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      const pairs = new Map<string, { providerId: string; memberId: string }>();
      for (const s of SESSIONS) {
        if ((s.providerId === personId || s.memberId === personId) && s.start >= monthAgo) {
          pairs.set(`${s.providerId}/${s.memberId}`, { providerId: s.providerId, memberId: s.memberId });
        }
      }
      return [...pairs.values()]
        .map(({ providerId, memberId }) => ({
          provider: person(providerId),
          member: person(memberId),
          items: planFor(memberId),
          note: CARE_PLAN_NOTES[memberId],
          nextSession: nextSessionDate(providerId, memberId),
        }))
        .sort((a, b) => (a.nextSession ?? '9999').localeCompare(b.nextSession ?? '9999'));
    });
  }

  /** `PATCH /api/members/:id/care-plan/:itemId`: the member ticks an item off, or unticks it. */
  updateCarePlanItem(memberId: string, itemId: string, changes: { done: boolean }): Observable<CarePlanItem> {
    return respond(`/api/members/${memberId}/care-plan/${itemId}`, () => {
      const item = planFor(memberId).find((i) => i.id === itemId);
      if (item) Object.assign(item, changes);
      return item;
    });
  }

  /**
   * `GET /api/resources?q=&limit=&cursor=`: the ComPsych resource library, one
   * page at a time. With a query, resources whose title, description or topics
   * contain every word; without one, the newest first.
   */
  searchResources({ query = '', limit = 12, cursor }: ResourceQuery = {}): Observable<Page<Resource>> {
    return respond(`/api/resources?q=${encodeURIComponent(query)}`, () => {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      const matching = RESOURCES.filter((r) => {
        const text = [r.title, r.description, r.kind, ...r.topics].join(' ').toLowerCase();
        return words.every((word) => text.includes(word));
      }).sort((a, b) => b.published.localeCompare(a.published) || a.id.localeCompare(b.id));
      const from = cursor ? Number(cursor) : 0;
      const items = matching.slice(from, from + limit);
      return {
        items: items.map(({ published, topics, ...r }) => r),
        nextCursor: from + limit < matching.length ? String(from + limit) : undefined,
        total: matching.length,
      };
    });
  }

  /**
   * `POST /api/members/:id/care-plan` with resource ids: the provider adds
   * library resources to the member's care plan. Ones already in it are skipped.
   * Returns the new care plan items.
   */
  addResourcesToCarePlan(memberId: string, resourceIds: string[]): Observable<CarePlanItem[]> {
    return respond(`/api/members/${memberId}/care-plan`, () => {
      const plan = planFor(memberId);
      const added = RESOURCES.filter((r) => resourceIds.includes(r.id))
        .filter((r) => !plan.some((i) => i.id === `plan-${r.id}` || i.title === r.title))
        .map<CarePlanItem>(({ published, topics, ...r }) => ({
          ...r,
          id: `plan-${r.id}`,
          due: dueDate(memberId),
          done: false,
        }));
      plan.push(...added);
      return added;
    });
  }

  /**
   * `DELETE /api/members/:id/care-plan/:itemId`: the provider takes an item out
   * of the member's care plan. Returns the removed item; 404s if it isn't there.
   */
  removeFromCarePlan(memberId: string, itemId: string): Observable<CarePlanItem> {
    return respond(`/api/members/${memberId}/care-plan/${itemId}`, () => {
      const plan = planFor(memberId);
      const index = plan.findIndex((i) => i.id === itemId);
      return index < 0 ? undefined : plan.splice(index, 1)[0];
    });
  }

  /**
   * `POST /api/members/:id/care-plan/uploads` (multipart): the provider uploads
   * documents into the member's care plan. Uploaded during a session, they're
   * also recorded as shared in it. Returns the uploaded documents and the care
   * plan items made from them.
   */
  uploadToCarePlan(
    memberId: string,
    files: File[],
    sessionId?: string,
  ): Observable<{ docs: SessionDoc[]; items: CarePlanItem[] }> {
    return respond(`/api/members/${memberId}/care-plan/uploads`, () => {
      const docs = files.map<SessionDoc>((file) => ({
        id: `upload-${crypto.randomUUID()}`,
        title: file.name,
        kind: 'file',
        detail: describeFile(file),
        // A real server would store the file and return its URL.
        url: URL.createObjectURL(file),
      }));
      SESSIONS.find((s) => s.id === sessionId)?.docs.unshift(...docs);
      const items = docs.map<CarePlanItem>((doc) => ({
        ...doc,
        kind: 'file',
        id: `plan-${doc.id}`,
        due: dueDate(memberId),
        done: false,
      }));
      planFor(memberId).push(...items);
      return { docs, items };
    });
  }
}

/** The member's care plan, created empty on first use. */
function planFor(memberId: string): CarePlanItem[] {
  return (CARE_PLANS[memberId] ??= []);
}

/** The date of the next session the two have booked, as yyyy-mm-dd. */
function nextSessionDate(providerId: string, memberId: string): string | undefined {
  const now = new Date().toISOString();
  const next = SESSIONS.filter(
    (s) => s.providerId === providerId && s.memberId === memberId && s.start > now,
  ).sort(byStart)[0];
  return next && localDate(new Date(next.start));
}

/** New care plan items are due by the member's next session, or in a week if none is booked. */
function dueDate(memberId: string): string {
  const provider = SESSIONS.find((s) => s.memberId === memberId)?.providerId ?? '';
  return nextSessionDate(provider, memberId) ?? day(7);
}

function describeFile(file: File): string {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : 'File';
  const kb = file.size / 1024;
  const size = kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`;
  return `${ext}, ${size}`;
}

/** How long the fake server takes to answer. */
const LATENCY_MS = 250;

/**
 * Answers like `HttpClient`: nothing happens until subscribed, the response comes
 * back later, and it's a copy, so callers can't change the "server's" data.
 * `body` returning undefined means there's nothing at `url`.
 */
function respond<T>(url: string, body: () => T | undefined): Observable<T> {
  return timer(LATENCY_MS).pipe(
    map(() => {
      const value = body();
      if (value === undefined) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Not Found', url });
      }
      return structuredClone(value);
    }),
  );
}

const byStart = (a: Session, b: Session) => a.start.localeCompare(b.start);

/** Whether the provider has a session overlapping `slot`. */
function isBooked(providerId: string, slot: TimeSlot): boolean {
  const start = Date.parse(slot.start);
  const end = start + slot.lengthMinutes * 60_000;
  return SESSIONS.some(
    (s) => s.providerId === providerId && Date.parse(s.start) < end && sessionEnd(s) > start,
  );
}

/** Orders sessions by start time, then id, so every session has a unique place to page from. */
const sortKey = (s: Session) => `${s.start}|${s.id}`;

function toSummary({ docs, recap, aiSummary, checkInFocus, aiScribe, ...session }: SessionRecord): SessionSummary {
  return {
    ...session,
    provider: person(session.providerId),
    member: person(session.memberId),
    checkInFocus,
  };
}

/** The member's next session that hasn't started yet, if they have one. */
function nextSession(memberId: string): SessionRecord | undefined {
  const now = Date.now();
  return SESSIONS.filter((s) => s.memberId === memberId && Date.parse(s.start) > now).sort(byStart)[0];
}

function person(id: string): Person {
  const found = PEOPLE.find((p) => p.id === id) ?? FORMER_MEMBERS.find((p) => p.id === id);
  if (!found) throw new Error(`demo data: no person ${id}`);
  return found;
}

