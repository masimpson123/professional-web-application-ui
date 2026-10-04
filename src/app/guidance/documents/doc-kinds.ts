import { CarePlanKind, DocKind } from '../api/models';

/** The icon for each kind of document, from the ComPsych icon set. */
export const KIND_ICON: Record<DocKind, string> = {
  article: 'book-open',
  video: 'circle-play',
  guide: 'book-open-text',
  worksheet: 'clipboard-pen',
  summary: 'notebook-pen',
  form: 'file-check',
  file: 'paperclip',
};

/** What to call each kind of document. */
export const KIND_LABEL: Record<DocKind, string> = {
  article: 'Article',
  video: 'Video',
  guide: 'Guide',
  worksheet: 'Worksheet',
  summary: 'Note',
  form: 'Form',
  file: 'File',
};

/** How a member ticks off each kind of care plan item, and what it says once done. */
export const DONE_WORDS: Record<CarePlanKind, { verb: string; done: string; past: string }> = {
  article: { verb: 'Mark as read', done: 'Read', past: 'read' },
  guide: { verb: 'Mark as read', done: 'Read', past: 'read' },
  video: { verb: 'Mark as watched', done: 'Watched', past: 'watched' },
  worksheet: { verb: 'Mark complete', done: 'Completed', past: 'complete' },
  file: { verb: 'Mark complete', done: 'Completed', past: 'complete' },
};
