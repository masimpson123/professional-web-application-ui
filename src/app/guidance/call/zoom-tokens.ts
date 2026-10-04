import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Zoom Video SDK role: hosts can end the session for everyone. */
export type ZoomRole = 'host' | 'participant';

/** A token request failed. Its message is already fit to show in the room. */
export class ZoomTokenError extends Error {}

/** Fetches Zoom session tokens from the Spring service, which holds the SDK secret. */
@Injectable() // no providedIn: RoomPage provides it, so it exists only while a room is open
export class ZoomTokens {
  /**
   * @param userKey Stable label for who this is (max 36 chars). Zoom reports it back on
   *   each participant as `userKey`, which is how the call tells people apart.
   */
  async get(session: string, role: ZoomRole, userKey: string): Promise<string> {
    const params = new URLSearchParams({ session, role, userKey });
    const response = await fetch(`${environment.springApiUrl}zoom-token?${params}`).catch(() => {
      throw new ZoomTokenError('Couldn’t reach the server. Check your internet connection, then try again.');
    });
    if (!response.ok) {
      throw new ZoomTokenError(response.status === 503
        ? 'Video isn’t set up yet: the server has no Zoom credentials.'
        : 'Couldn’t get a session token. Try again.');
    }
    return (await response.json()).token;
  }
}
