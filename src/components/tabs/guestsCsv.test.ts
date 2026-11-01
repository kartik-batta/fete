import { describe, expect, it } from 'vitest';
import type { Guest } from '../../types';
import { csvFileName, guestsToCsv, toCsvCell } from './guestsCsv';

describe('toCsvCell', () => {
  it('quotes and escapes embedded quotes', () => {
    expect(toCsvCell('Say "hi", ok')).toBe('"Say ""hi"", ok"');
  });

  it('neutralises formula injection', () => {
    expect(toCsvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(toCsvCell('+1')).toBe('"\'+1"');
    expect(toCsvCell('-2')).toBe('"\'-2"');
    expect(toCsvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
  });

  it('keeps numbers bare and empties missing values', () => {
    expect(toCsvCell(3)).toBe('3');
    expect(toCsvCell(undefined)).toBe('""');
  });
});

describe('guestsToCsv', () => {
  it('serialises a header and one row per guest, keeping # characters', () => {
    const guest: Guest = {
      id: 'g1',
      name: 'Ana #1',
      email: 'ana@example.com',
      phone: '',
      rsvp: 'attending',
      plusOnes: 2,
      dietary: '',
      group: 'family',
      tableNumber: 'T#4',
      notes: 'line\nbreak',
    };
    const lines = guestsToCsv([guest]).split('\r\n');
    expect(lines[0]).toContain('"Name","RSVP Status"');
    expect(lines[1]).toBe(
      '"Ana #1","attending",2,3,"None","family","T#4","ana@example.com","","line\nbreak"',
    );
  });

  it('builds a safe file name', () => {
    expect(csvFileName('Maya’s 30th / Soirée!')).toBe('Maya_s_30th_Soirée_Guest_List.csv');
    expect(csvFileName('***')).toBe('Celebration_Guest_List.csv');
  });
});
