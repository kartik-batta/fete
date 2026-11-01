import { Guest } from '../../types';

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Escapes one CSV cell (RFC 4180) and neutralises spreadsheet formula
 * injection: values starting with = + - @ (or tab/CR) are prefixed with `'`
 * so Excel/Sheets treat them as text rather than executing them.
 */
export function toCsvCell(value: string | number | null | undefined): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = value ?? '';
  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export const GUEST_CSV_HEADERS = [
  'Name',
  'RSVP Status',
  'Plus Ones',
  'Total Seats',
  'Dietary Requirements',
  'Group',
  'Table',
  'Email',
  'Phone',
  'Notes',
] as const;

/** Serialises the guest list as CSV text (CRLF line endings). */
export function guestsToCsv(guests: readonly Guest[]): string {
  const rows = guests.map((g) =>
    [
      toCsvCell(g.name),
      toCsvCell(g.rsvp),
      toCsvCell(g.plusOnes ?? 0),
      toCsvCell((g.plusOnes ?? 0) + 1),
      toCsvCell(g.dietary || 'None'),
      toCsvCell(g.group),
      toCsvCell(g.tableNumber),
      toCsvCell(g.email),
      toCsvCell(g.phone),
      toCsvCell(g.notes),
    ].join(','),
  );
  return [GUEST_CSV_HEADERS.map(toCsvCell).join(','), ...rows].join('\r\n');
}

/** Filesystem-safe file name derived from the event title. */
export function csvFileName(eventTitle: string): string {
  const base = eventTitle.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '') || 'Celebration';
  return `${base}_Guest_List.csv`;
}

/** Triggers a browser download of `csv` via a Blob URL (no data: URI size/encoding limits). */
export function downloadCsv(csv: string, fileName: string): void {
  // BOM so Excel opens UTF-8 (accents, emoji) correctly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
