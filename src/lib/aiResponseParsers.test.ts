import {
  parseIdeasResponse,
  parseInvitationResponse,
  parseThemesResponse,
  parseTimelineResponse,
  ResponseShapeError,
} from './aiResponseParsers';

describe('parseThemesResponse', () => {
  it('normalises optional fields and missing ids', () => {
    const [theme] = parseThemesResponse({
      success: true,
      themes: [{ title: 'Disco', tagline: 'Shine', palette: [{ name: 'Gold', hex: '#FFD700' }] }],
    });
    expect(theme).toEqual({
      id: 'theme-1',
      title: 'Disco',
      tagline: 'Shine',
      palette: [{ name: 'Gold', hex: '#FFD700' }],
      decorIdeas: [],
      musicVibe: '',
      attirePrompt: '',
      signatureTouch: '',
    });
  });

  it('reports the offending path', () => {
    expect(() => parseThemesResponse({ themes: [{ title: 1 }] })).toThrow(
      new ResponseShapeError('$.themes[0].title', 'a string'),
    );
    expect(() => parseThemesResponse({})).toThrow(/\$\.themes/);
    expect(() => parseThemesResponse(null)).toThrow(ResponseShapeError);
  });
});

describe('parseInvitationResponse', () => {
  const invitation = {
    subjectLine: 'S',
    headline: 'H',
    greeting: 'G',
    body: 'B',
    detailsBlock: { when: 'W', where: 'Wh', rsvpNote: 'R' },
    closing: 'C',
    signoff: 'So',
  };

  it('accepts a valid invitation and omits a missing dress code', () => {
    const parsed = parseInvitationResponse({ invitation });
    expect(parsed).toEqual(invitation);
    expect('dressCode' in parsed.detailsBlock).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(() => parseInvitationResponse({ invitation: { ...invitation, body: undefined } })).toThrow(
      /\$\.invitation\.body/,
    );
    expect(() =>
      parseInvitationResponse({ invitation: { ...invitation, detailsBlock: { when: 'W' } } }),
    ).toThrow(/detailsBlock\.where/);
  });
});

describe('parseTimelineResponse', () => {
  it('coerces unknown categories and fills defaults', () => {
    const [item] = parseTimelineResponse({
      timeline: [{ time: '4 PM', title: 'Cake', category: 'dessert-o-clock' }],
    });
    expect(item).toEqual({
      id: 'tl-1',
      time: '4 PM',
      title: 'Cake',
      description: '',
      category: 'activity',
      assignedTo: '',
    });
  });

  it('keeps valid categories and tips', () => {
    const [item] = parseTimelineResponse({
      timeline: [{ id: 'x', time: '1', title: 't', category: 'toast', tips: 'Short!' }],
    });
    expect(item).toMatchObject({ id: 'x', category: 'toast', tips: 'Short!' });
  });
});

describe('parseIdeasResponse', () => {
  const ideas = {
    decor: [{ item: 'Garland', description: 'Pretty', estimatedCost: '$50' }],
    menu: { starters: ['A'], mains: ['B'], desserts: ['C'], signatureDrinks: ['D'] },
    activities: [{ title: 'Trivia', description: 'Fun' }],
  };

  it('parses decor, menu and activities', () => {
    expect(parseIdeasResponse({ ideas })).toEqual({
      ...ideas,
      activities: [{ title: 'Trivia', description: 'Fun', duration: '' }],
    });
  });

  it('rejects non-string menu items', () => {
    expect(() =>
      parseIdeasResponse({ ideas: { ...ideas, menu: { ...ideas.menu, mains: [42] } } }),
    ).toThrow(/menu\.mains\[0\]/);
  });
});
