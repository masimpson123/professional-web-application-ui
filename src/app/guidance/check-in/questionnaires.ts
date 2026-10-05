import { Frequency } from '../api/models';

/*
 * The PHQ-9 and GAD-7, word for word. Developed by Drs. Robert L. Spitzer, Janet
 * B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from
 * Pfizer Inc. No permission is required to reproduce, translate, display or
 * distribute them. Keep the wording as it is: the scores are only valid for the
 * questions as written.
 */

export interface Questionnaire {
  id: 'phq9' | 'gad7';
  /** Plain-language name for the section. */
  title: string;
  /** The instrument's name, shown beside the title. */
  instrument: string;
  /** The question every item answers. */
  stem: string;
  items: string[];
}

export const PHQ9: Questionnaire = {
  id: 'phq9',
  title: 'Your mood',
  instrument: 'PHQ-9',
  stem: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  items: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead or of hurting yourself in some way',
  ],
};

export const GAD7: Questionnaire = {
  id: 'gad7',
  title: 'Worry and anxiety',
  instrument: 'GAD-7',
  stem: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
  items: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
  ],
};

/** The answers both questionnaires share, by score. */
export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

/** The PHQ-9's closing question, asked only when at least one problem was reported. */
export const DIFFICULTY = {
  question:
    'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
  options: [
    { value: 0, label: 'Not difficult at all' },
    { value: 1, label: 'Somewhat difficult' },
    { value: 2, label: 'Very difficult' },
    { value: 3, label: 'Extremely difficult' },
  ] satisfies { value: Frequency; label: string }[],
};
