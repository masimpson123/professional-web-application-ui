/**
 * Zoom session state: one reducer for every event, plus the selectors that derive
 * what the stage should show.
 *
 * ## Why a reducer
 *
 * Zoom reports a call through many independent callbacks (`user-added`,
 * `peer-video-state-change`, `connection-change`, …) that arrive in an order we
 * don't control. Existing participants are announced while `join()` is still in
 * flight, video events can land before the participant list catches up, and
 * stale copies of people linger after a tab closes without leaving.
 *
 * Handling each callback on its own, by attaching or detaching video right there,
 * let the screen drift out of step with the session. So instead:
 *
 *   Zoom callback ─► ZoomEvent ─► reduce() ─► ZoomSessionState (one signal)
 *                                                 │
 *                                  selectors (computed) ─► what should be shown
 *                                                 │
 *                       zoom-renderer.ts (RxJS) ─► what is attached in the DOM
 *
 * Everything in this file is pure (no SDK, DOM, or Angular), so each tricky
 * ordering can be reasoned about, and replayed, as a plain list of events.
 */

import { CallStatus, JoinOptions, RemoteParticipant } from './call.service';

/** The fields we use from Zoom's `Participant`, captured when an event arrives. */
export interface ZoomUserSnapshot {
  userId: number;
  displayName: string;
  /** The token's `user_key`, echoed back by Zoom. */
  userKey?: string;
  bVideoOn: boolean;
  muted?: boolean;
  isInFailover?: boolean;
}

/** One person in the session, as this app understands them. */
export interface SessionParticipant {
  userId: number;
  name: string;
  /**
   * The `user_key` they joined with. Each browser tab has its own and keeps it
   * across reloads, so stale copies of one person share it.
   */
  key?: string;
  /** Zoom's participant list has included them; until then this only holds an early event. */
  listed: boolean;
  videoOn: boolean;
  muted: boolean;
  /** Zoom has lost contact and is waiting to see whether they come back. */
  failover: boolean;
}

export interface ZoomSessionState {
  status: CallStatus;
  /**
   * The call we want to be in, from the moment we ask to join until we leave or
   * it ends. ZoomCall connects to whatever this is (see `selectConnectionTarget`).
   */
  request?: JoinOptions;
  /** Set while we're hanging up, so the resulting `Closed` isn't treated as a drop. */
  leaving: boolean;
  reconnecting: boolean;
  /** Our own Zoom user id, known once joined. */
  myId?: number;
  /** Our own `user_key`. */
  myKey?: string;
  /** How many other people's cameras this device can show at once. */
  maxRemoteVideos: number;
  /** Everyone Zoom has told us about, by user id, including stale copies. */
  participants: ReadonlyMap<number, SessionParticipant>;
  micOn: boolean;
  /** Whether we're connected to the session's audio: hearing it, and sending it if unmuted. */
  audio: 'off' | 'starting' | 'on';
  /** Audio is connected without our microphone (it's blocked or busy): we hear, but aren't heard. */
  speakerOnly: boolean;
  /** `auto-play-audio-failed`: the browser won't play the call's sound until we click something. */
  soundBlocked: boolean;
  cameraOn: boolean;
  /** Plain-language problem to show, or empty. */
  error: string;
}

export const initialZoomSessionState: ZoomSessionState = {
  status: 'ready',
  leaving: false,
  reconnecting: false,
  maxRemoteVideos: 0,
  participants: new Map(),
  micOn: true,
  audio: 'off',
  speakerOnly: false,
  soundBlocked: false,
  cameraOn: false,
  error: '',
};

/**
 * Everything that can change the session. Each Zoom callback, and each of our
 * own actions, becomes exactly one of these.
 */
export type ZoomEvent =
  /** We asked to join a call. */
  | { type: 'join-requested'; request: JoinOptions }
  /** We asked to leave: hang up, or stop a join that's still connecting. */
  | { type: 'leave-requested' }
  /** `join()` resolved: who we are, what this device can show, and who's here. */
  | {
      type: 'joined';
      myId: number;
      myKey: string;
      maxRemoteVideos: number;
      users: ZoomUserSnapshot[];
    }
  /** `join()` rejected. */
  | { type: 'join-failed'; message: string }
  /**
   * The participant list changed (`user-added` / `-updated` / `-removed`).
   * `authoritative` lists (after joining or reconnecting) also replace video
   * state, which otherwise comes from its own event (see `reduce`).
   */
  | { type: 'participants'; users: ZoomUserSnapshot[]; authoritative?: boolean }
  /** `peer-video-state-change`: someone else's camera turned on or off. */
  | { type: 'peer-video'; userId: number; on: boolean }
  /** `connection-change`. */
  | { type: 'connection'; state: 'Connected' | 'Reconnecting' | 'Closed' | 'Fail' }
  /** Our own mic or camera changed. */
  | { type: 'local-mic'; on: boolean }
  | { type: 'local-camera'; on: boolean }
  /** We called `startAudio()`. */
  | { type: 'audio-starting' }
  /** `startAudio()` resolved, with our microphone or without it. */
  | { type: 'audio-joined'; speakerOnly: boolean }
  /** `startAudio()` failed, or `current-audio-change` says audio dropped. */
  | { type: 'audio-left' }
  /** `auto-play-audio-failed`. */
  | { type: 'sound-blocked' }
  /** `active-media-failed`: our media broke after it had started. */
  | { type: 'media-failed'; kind: 'audio' | 'video' }
  /** A problem worth showing that doesn't change anything else. */
  | { type: 'error'; message: string }
  /** Our hang-up finished. */
  | { type: 'left' };

/** Applies one event. Pure: returns a new state and never mutates `state`. */
export function reduce(state: ZoomSessionState, event: ZoomEvent): ZoomSessionState {
  switch (event.type) {
    case 'join-requested':
      return {
        ...initialZoomSessionState,
        status: 'connecting',
        micOn: state.micOn,
        request: event.request,
      };

    case 'leave-requested':
      // In a call: clear the screen now and hang up (`left` follows). Anywhere
      // else, including mid-join, there's nothing to wait for.
      return state.status === 'connected'
        ? { ...state, request: undefined, leaving: true }
        : { ...ended(state), error: '' };

    case 'joined':
      return {
        ...state,
        status: 'connected',
        myId: event.myId,
        myKey: event.myKey,
        maxRemoteVideos: event.maxRemoteVideos,
        participants: mergeParticipants(state.participants, event.users, true),
      };

    case 'join-failed':
      return { ...state, status: 'failed', request: undefined, error: event.message };

    case 'participants':
      return {
        ...state,
        participants: mergeParticipants(state.participants, event.users, !!event.authoritative),
      };

    case 'peer-video':
      return {
        ...state,
        participants: patch(state.participants, event.userId, { videoOn: event.on }),
      };

    case 'connection':
      switch (event.state) {
        case 'Connected':
          return { ...state, reconnecting: false, error: '' };
        case 'Reconnecting':
          return { ...state, reconnecting: true };
        case 'Closed':
          // Our own hang-up also ends in `Closed`; only an unexpected one is news.
          return state.leaving ? state : { ...ended(state), error: 'The session ended.' };
        case 'Fail':
          return {
            ...ended(state),
            status: 'failed',
            error: 'Lost the connection to the session. Check your internet connection and rejoin.',
          };
      }
      return state;

    case 'local-mic':
      return { ...state, micOn: event.on };
    case 'local-camera':
      return { ...state, cameraOn: event.on };

    case 'audio-starting':
      return { ...state, audio: 'starting' };
    case 'audio-joined':
      return {
        ...state,
        audio: 'on',
        speakerOnly: event.speakerOnly,
        soundBlocked: false,
        micOn: event.speakerOnly ? false : state.micOn,
      };
    case 'audio-left':
      return { ...state, audio: 'off', speakerOnly: false, micOn: false };
    case 'sound-blocked':
      return { ...state, soundBlocked: true };

    case 'media-failed':
      switch (event.kind) {
        case 'video':
          return {
            ...state,
            cameraOn: false,
            error:
              'Your camera stopped. Check that no other app is using it, then start video again.',
          };
        case 'audio':
          return {
            ...state,
            error:
              'Your audio stopped working. Check your microphone and speakers, or leave and rejoin the session.',
          };
      }
      return state;

    case 'error':
      return { ...state, error: event.message };

    case 'left':
      // Only our own hang-up counts. A stale one, from a call we'd already moved on
      // from, must not undo a newer join or wipe an error about a dropped call.
      return state.leaving ? { ...ended(state), error: '' } : state;
  }
}

/**
 * Folds a participant list into what we already know.
 *
 * Zoom's list is the source of truth for *who is here*: names, keys, failover,
 * departures. For *camera state*, `peer-video-state-change` is authoritative: it
 * fires for every change, while the list can lag behind it. So the list only sets
 * video for people we're seeing for the first time, or when the list is
 * `authoritative` (right after joining or reconnecting, when we may have missed
 * events).
 */
function mergeParticipants(
  known: ReadonlyMap<number, SessionParticipant>,
  users: ZoomUserSnapshot[],
  authoritative: boolean,
): ReadonlyMap<number, SessionParticipant> {
  const next = new Map<number, SessionParticipant>();
  for (const user of users) {
    const existing = known.get(user.userId);
    next.set(user.userId, {
      userId: user.userId,
      name: user.displayName,
      key: user.userKey || existing?.key,
      listed: true,
      videoOn: authoritative || !existing ? user.bVideoOn : existing.videoOn,
      muted: !!user.muted,
      failover: !!user.isInFailover,
    });
  }
  return next; // anyone missing from the list has left
}

/**
 * Updates one participant. If an event names someone the list hasn't mentioned
 * yet, a placeholder keeps the event so the list can fill in the rest later.
 */
function patch(
  participants: ReadonlyMap<number, SessionParticipant>,
  userId: number,
  changes: Partial<SessionParticipant>,
): ReadonlyMap<number, SessionParticipant> {
  const next = new Map(participants);
  const current = next.get(userId) ?? {
    userId,
    name: '',
    listed: false,
    videoOn: false,
    muted: false,
    failover: false,
  };
  next.set(userId, { ...current, ...changes });
  return next;
}

/** The session is over for us: back to "left" with nothing on screen. */
function ended(state: ZoomSessionState): ZoomSessionState {
  return {
    ...state,
    status: 'left',
    request: undefined,
    leaving: false,
    reconnecting: false,
    myId: undefined,
    participants: new Map(),
    audio: 'off',
    speakerOnly: false,
    soundBlocked: false,
    cameraOn: false,
  };
}

// ---- Selectors ---------------------------------------------------------
// Pure reads of the state, wrapped in `computed()` by ZoomCall.

/**
 * Everyone else in the session, one entry per person, in the order they joined
 * (Zoom user ids increase as people join).
 *
 * A session can hold stale copies of someone: a tab that reloaded or closed
 * without leaving stays listed until Zoom times it out. Copies from one tab share
 * a `key`, so keep one per key, preferring a copy not in failover, then the most
 * recent join. Copies of ourselves are dropped entirely.
 */
export function selectRemotes(state: ZoomSessionState): SessionParticipant[] {
  const byPerson = new Map<string | number, SessionParticipant>();
  for (const p of state.participants.values()) {
    if (!p.listed || p.userId === state.myId || (p.key && p.key === state.myKey)) continue;
    const person = p.key ?? p.userId;
    const kept = byPerson.get(person);
    if (!kept || isBetterCopy(p, kept)) byPerson.set(person, p);
  }
  return [...byPerson.values()].sort((a, b) => a.userId - b.userId);
}

function isBetterCopy(a: SessionParticipant, b: SessionParticipant): boolean {
  return a.failover !== b.failover ? !a.failover : a.userId > b.userId;
}

/**
 * We're in the call but can't hear it: audio isn't connected, or the browser
 * blocked its sound.
 */
export function selectSoundOff(state: ZoomSessionState): boolean {
  return isLive(state) && (state.audio === 'off' || state.soundBlocked);
}

/** Everyone else as the stage shows them. */
export function selectRemoteParticipants(state: ZoomSessionState): RemoteParticipant[] {
  const shown = new Set(selectRemoteVideoTargets(state));
  return selectRemotes(state).map((p) => toRemoteParticipant(p, shown.has(p.userId)));
}

function toRemoteParticipant(p: SessionParticipant, videoShown: boolean): RemoteParticipant {
  return { userId: p.userId, name: p.name, videoOn: videoShown, muted: p.muted };
}

/**
 * The call to be connected to right now, or null for none. ZoomCall runs it
 * through `switchMap`, so a new request, or a leave, cancels a join in flight.
 */
export function selectConnectionTarget(state: ZoomSessionState): JoinOptions | null {
  return state.request ?? null;
}

/*
 * Render targets: whose stream each container should show right now, or null
 * for nothing. zoom-renderer.ts keeps the DOM in step with these.
 */

/** Streams can only be shown in a joined session we aren't leaving. */
function isLive(state: ZoomSessionState): boolean {
  return state.status === 'connected' && !state.leaving;
}

/**
 * Whose cameras belong in the gallery: everyone else with theirs on, up to as
 * many as this device can show. The rest appear as initials.
 */
export function selectRemoteVideoTargets(state: ZoomSessionState): number[] {
  if (!isLive(state)) return [];
  return selectRemotes(state)
    .filter((p) => p.videoOn)
    .slice(0, state.maxRemoteVideos)
    .map((p) => p.userId);
}

/** Our own camera, for the self-view. */
export function selectSelfVideoTarget(state: ZoomSessionState): number | null {
  return isLive(state) && state.cameraOn ? (state.myId ?? null) : null;
}
