import { Person, Role, SessionFormat, officeAddress } from '../api/models';

/** The ways a member can meet their provider, as the booking offers them. */
export const SESSION_FORMATS: { value: SessionFormat; label: string; icon: string; description: string }[] = [
  { value: 'video', label: 'Video', icon: 'video', description: 'A private video call, here in GuidanceResources.' },
  { value: 'phone', label: 'Phone', icon: 'phone', description: 'Your provider calls you at the time you choose.' },
  { value: 'in-person', label: 'In person', icon: 'map-pin', description: 'Meet at your provider’s office.' },
];

export const FORMAT_ICON: Record<SessionFormat, string> = {
  video: 'video',
  phone: 'phone',
  'in-person': 'map-pin',
};

interface FormatSession {
  format: SessionFormat;
  provider: Person;
  member: Person;
}

/**
 * Where a phone or in-person session happens, from the viewer's side: who calls
 * whom, or the office to go to. Video sessions need no note; they're joined here.
 */
export function formatNote(session: FormatSession, viewer: Role): string | undefined {
  const { format, provider, member } = session;
  if (format === 'phone') {
    if (viewer === 'provider') return member.phone ? `Call ${member.firstName} at ${member.phone}` : `Call ${member.firstName}`;
    return member.phone
      ? `${provider.firstName} will call you at ${member.phone}`
      : `${provider.firstName} will call you on the number you gave us`;
  }
  if (format === 'in-person') {
    if (viewer === 'provider') return 'In person, at your office';
    return provider.office ? `In person at ${provider.office.name}, ${officeAddress(provider.office)}` : `In person at ${provider.firstName}’s office`;
  }
  return undefined;
}
