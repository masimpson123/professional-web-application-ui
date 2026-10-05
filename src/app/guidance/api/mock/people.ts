import { Person } from '../models';

// ---- People -------------------------------------------------------------------

export const MAYA: Person = {
  id: 'maya-okafor',
  name: 'Maya Okafor',
  firstName: 'Maya',
  initials: 'MO',
  credentials: 'LPC',
  office: {
    name: 'Lakeshore Counseling',
    address: ['401 N Michigan Ave, Suite 1200', 'Chicago, IL 60611'],
  },
};

export const JORDAN: Person = { id: 'jordan-reyes', name: 'Jordan Reyes', firstName: 'Jordan', initials: 'JR', phone: '(312) 555-0143' };
export const PRIYA: Person = { id: 'priya-natarajan', name: 'Priya Natarajan', firstName: 'Priya', initials: 'PN', phone: '(312) 555-0178' };
export const MARCUS: Person = { id: 'marcus-bell', name: 'Marcus Bell', firstName: 'Marcus', initials: 'MB' };
export const ELENA: Person = { id: 'elena-ruiz', name: 'Elena Ruiz', firstName: 'Elena', initials: 'ER' };
export const SAM: Person = { id: 'sam-whitfield', name: 'Sam Whitfield', firstName: 'Sam', initials: 'SW', phone: '(773) 555-0112' };
export const AISHA: Person = { id: 'aisha-bello', name: 'Aisha Bello', firstName: 'Aisha', initials: 'AB' };
export const DANIEL: Person = { id: 'daniel-cho', name: 'Daniel Cho', firstName: 'Daniel', initials: 'DC', phone: '(847) 555-0165' };
export const GRACE: Person = { id: 'grace-kim', name: 'Grace Kim', firstName: 'Grace', initials: 'GK' };
export const NOAH: Person = { id: 'noah-fischer', name: 'Noah Fischer', firstName: 'Noah', initials: 'NF' };

export const PEOPLE = [MAYA, JORDAN, PRIYA, MARCUS, ELENA, SAM, AISHA, DANIEL, GRACE, NOAH];
