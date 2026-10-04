import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, HostListener, OnDestroy, ViewChild, signal } from '@angular/core';
import type ZoomVideo from '@zoom/videosdk';
import type { VideoPlayer } from '@zoom/videosdk';
import { DemoHeaderComponent } from '../demo-header/demo-header.component';
import { environment } from '../../environments/environment';

type ZoomClient = ReturnType<typeof ZoomVideo.createClient>;
type ZoomStream = ReturnType<ZoomClient['getMediaStream']>;

/** `VideoQuality.Video_720P`, as a plain value so the SDK can stay lazily loaded. */
const VIDEO_720P = 3;

/**
 * One shared Zoom Video SDK session for everyone on this page. The Spring service
 * signs the session token and decides the session name, so the secret stays server-side.
 */
@Component({
  selector: 'app-video',
  imports: [DemoHeaderComponent],
  templateUrl: './video.component.html',
  styleUrl: './video.component.css',
  // <video-player-container> is a custom element registered by the Zoom Video SDK.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VideoComponent implements OnDestroy {
  @ViewChild('players') private players!: ElementRef<HTMLElement>;

  readonly name = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;

  readonly status = signal<'idle' | 'joining' | 'joined'>('idle');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly micOn = signal(false);
  readonly cameraOn = signal(false);
  readonly people = signal<string[]>([]);

  private zoom?: typeof ZoomVideo;
  private client?: ZoomClient;
  private stream?: ZoomStream;
  private audioStarted = false;
  /** Rendered videos by Zoom user id. Promises, so a detach can wait for an attach in flight. */
  private readonly videos = new Map<number, Promise<VideoPlayer | null>>();

  async join() {
    this.status.set('joining');
    this.error.set('');
    try {
      const response = await fetch(environment.springApiUrl + 'zoom-token');
      if (!response.ok) {
        throw new Error(response.status === 503
          ? 'Video isn’t set up yet: the server has no Zoom credentials.'
          : 'Couldn’t get a session token. Try again.');
      }
      const { session, token } = await response.json();
      const client = await this.ensureClient();
      await client.join(session, token, this.name);
      this.stream = client.getMediaStream();
      this.status.set('joined');
      this.refreshPeople();
      for (const user of client.getAllUser()) {
        if (user.bVideoOn) this.attach(user.userId);
      }
      await this.toggleMic();
      await this.toggleCamera();
    } catch (err) {
      this.reset();
      this.error.set(describe(err));
    }
  }

  async leave() {
    await Promise.all([...this.videos.keys()].map(userId => this.detach(userId)));
    await this.client?.leave().catch(() => undefined);
    this.reset();
  }

  toggleMic() {
    return this.once(async () => {
      const stream = this.stream!;
      try {
        if (this.micOn()) await stream.muteAudio();
        else if (this.audioStarted) await stream.unmuteAudio();
        else {
          await stream.startAudio();
          this.audioStarted = true;
        }
        this.micOn.set(!this.micOn());
      } catch {
        this.error.set('Microphone is blocked. Allow microphone access in your browser settings, then unmute.');
      }
    });
  }

  toggleCamera() {
    return this.once(async () => {
      const stream = this.stream!;
      const me = this.client!.getCurrentUserInfo().userId;
      try {
        if (this.cameraOn()) {
          await stream.stopVideo();
          this.cameraOn.set(false);
          await this.detach(me);
        } else {
          // Zoom mirrors the self-view itself.
          await stream.startVideo({ mirrored: true });
          this.cameraOn.set(true);
          this.attach(me);
        }
      } catch {
        this.error.set('Camera is blocked. Allow camera access in your browser settings, then start it again.');
      }
    });
  }

  // Chrome blocks `unload`, so leave on `pagehide`; otherwise a closed tab lingers in the session.
  @HostListener('window:pagehide')
  onPageHide() {
    void this.client?.leave();
  }

  ngOnDestroy() {
    // Zoom's client is a singleton, so destroy it to drop this component's event handlers.
    void this.leave().then(() => this.zoom?.destroyClient());
  }

  /** Creates the client on first join. Loaded here so the SDK stays out of every other page. */
  private async ensureClient(): Promise<ZoomClient> {
    if (this.client) return this.client;
    this.zoom = (await import('@zoom/videosdk')).default;
    const client = this.zoom.createClient();
    await client.init('en-US', 'Global', { patchJsMedia: true });

    client.on('peer-video-state-change', ({ action, userId }) => {
      if (action === 'Start') this.attach(userId);
      else void this.detach(userId);
    });
    client.on('user-added', () => this.refreshPeople());
    client.on('user-updated', () => this.refreshPeople());
    client.on('user-removed', users => {
      users.forEach(({ userId }) => void this.detach(userId));
      this.refreshPeople();
    });
    client.on('connection-change', ({ state }) => {
      if (state === 'Closed') this.reset();
      if (state === 'Fail') {
        this.reset();
        this.error.set('Lost the connection to the session. Check your internet connection and join again.');
      }
    });

    this.client = client;
    return client;
  }

  private refreshPeople() {
    const me = this.client?.getCurrentUserInfo()?.userId;
    this.people.set((this.client?.getAllUser() ?? [])
      .map(user => user.userId === me ? `${user.displayName} (you)` : user.displayName));
  }

  private attach(userId: number) {
    if (!this.videos.has(userId)) this.videos.set(userId, this.render(userId));
  }

  /** Retries, because attaching right after joining can fail transiently. */
  private async render(userId: number): Promise<VideoPlayer | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const element = await this.stream?.attachVideo(userId, VIDEO_720P).catch(() => null);
      if (element instanceof HTMLElement) {
        this.players.nativeElement.append(element);
        return element as VideoPlayer;
      }
      if (!this.videos.has(userId)) return null; // detached while waiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.warn(`[zoom] couldn't render video for user ${userId}`);
    return null;
  }

  private async detach(userId: number) {
    const player = this.videos.get(userId);
    this.videos.delete(userId);
    const element = await player;
    if (!element) return;
    element.remove();
    await this.stream?.detachVideo(userId, element).catch(() => undefined);
  }

  private reset() {
    this.players?.nativeElement.replaceChildren();
    this.videos.clear();
    this.stream = undefined;
    this.audioStarted = false;
    this.status.set('idle');
    this.micOn.set(false);
    this.cameraOn.set(false);
    this.people.set([]);
  }

  /** Runs one media action at a time, so a double-click can't start something twice. */
  private async once(action: () => Promise<void>) {
    if (this.busy() || !this.stream) return;
    this.busy.set(true);
    try {
      await action();
    } finally {
      this.busy.set(false);
    }
  }
}

/** Zoom rejects with `{ type, reason }` objects rather than Errors. */
function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  const reason = err && typeof err === 'object' && 'reason' in err ? String(err.reason) : '';
  if (/signature|sdkKey|token/i.test(reason)) return 'Zoom rejected the session token. Check the SDK key and secret on the server.';
  return `Couldn’t join the session${reason ? ` (${reason})` : ''}. Try again.`;
}
