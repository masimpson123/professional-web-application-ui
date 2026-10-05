/**
 * Where the app lives inside the portfolio. Its pages link with these instead of
 * absolute paths, because the app is mounted under the demo's route.
 */
export const GUIDANCE_HOME = '/guidance/app';
export const GUIDANCE_SESSIONS = `${GUIDANCE_HOME}/sessions`;
export const GUIDANCE_PROFILE = `${GUIDANCE_HOME}/profile`;
/** The new member check-in (PHQ-9 and GAD-7), done once. */
export const GUIDANCE_NEW_MEMBER_CHECK_IN = `${GUIDANCE_HOME}/check-in`;
/** The demo's intro page in the portfolio, which "Exit demo" returns to. */
export const GUIDANCE_EXIT = '/guidance';
