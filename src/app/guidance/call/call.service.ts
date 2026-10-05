import { Signal } from '@angular/core';

export type CallStatus = 'ready' | 'connecting' | 'connected' | 'left' | 'failed';

export interface RemoteParticipant {
  /** Stable while they're in the call, so their tile can be tracked. */
  userId: number;
  name: string;
  /** Their camera is on and showing in their tile. */
  videoOn: boolean;
  muted: boolean;
}

/** Elements the stage hands over for the call to render video into. */
export interface CallViews {
  /** The tile that shows one other person's camera, or undefined if it isn't on screen. */
  remote: (userId: number) => HTMLElement | undefined;
  self: HTMLElement;
}

export interface JoinOptions {
  /** The Zoom session to join (the JWT `tpc`). Every session has its own. */
  room: string;
  displayName: string;
  /** The provider hosts; the member joins as a participant. */
  isHost: boolean;
}

/**
 * A video call with any number of people, as the stage sees it. Implementations own all media
 * and render into the containers given to `setViews`.
 */
export abstract class CallService {
  abstract readonly status: Signal<CallStatus>;
  abstract readonly micOn: Signal<boolean>;
  abstract readonly cameraOn: Signal<boolean>;
  /** Everyone else in the call, in the order they joined. Empty while you wait for others. */
  abstract readonly remotes: Signal<RemoteParticipant[]>;
  /** The connection dropped and is being restored; media may freeze meanwhile. */
  abstract readonly reconnecting: Signal<boolean>;
  /** Plain-language problem to show, or empty. */
  abstract readonly error: Signal<string>;
  /**
   * We're in the call but can't hear it: the browser blocked its sound, or audio
   * dropped. `turnOnSound()`, from a click, fixes both.
   */
  abstract readonly soundOff: Signal<boolean>;

  abstract setViews(views: CallViews): void;
  abstract join(options: JoinOptions): Promise<void>;
  abstract leave(): Promise<void>;
  abstract toggleMic(): Promise<void>;
  abstract toggleCamera(): Promise<void>;
  /** Call from a click: connects the call's audio, which the browser only allows after a gesture. */
  abstract turnOnSound(): Promise<void>;
}
