import { randomUUID } from 'node:crypto';
import { formatClockTime, formatDisplayTime, formatEventDate, humanizeOccasion, resolveTimeWindow } from './format';
import { DEFAULTS } from './prompts';
import type {
  Ideas,
  InvitationCopy,
  InvitationRequest,
  Theme,
  ThemesRequest,
  Timeline,
  TimelineRequest,
} from './schemas';

/*
 * Curated content served when Gemini is not configured, fails, times out, or returns
 * output that does not pass validation. Shapes match the AI responses exactly.
 */

/** Three hand-crafted theme concepts, personalised with the occasion. */
export function fallbackThemes(input: ThemesRequest): Theme[] {
  return [
    {
      id: 'theme-1',
      title: `${humanizeOccasion(input.occasion || DEFAULTS.occasion)} In Provence: Pastel Botanicals`,
      tagline: 'Warm terracotta, dried lavender sprigs, linen runners, and artisanal cheese boards under twinkling fairy lights.',
      palette: [
        { name: 'Peach Bellini', hex: '#FFD6BA' },
        { name: 'French Lavender', hex: '#D8B4E2' },
        { name: 'Sage Leaf', hex: '#B8D5B8' },
        { name: 'Warm Cream', hex: '#FFF8E7' },
        { name: 'Terracotta', hex: '#E78B75' },
      ],
      decorIdeas: [
        'Wildflower bud vases arranged down long communal linen tables',
        'Warm amber taper candles and glowing festoon bulb canopies',
        'Personalized watercolor calligraphy placecards pinned to fresh rosemary sprigs',
        'Vintage drink cart featuring signature botanical spritzers with edible pansies',
      ],
      musicVibe: 'French café acoustic guitar, sunny bossa nova, and indie folk instrumentals',
      attirePrompt: 'Breezy garden cocktail: linen shirts, pastel sundresses, and soft earth tones',
      signatureTouch: 'A curated floral bouquet bar where guests wrap their own mini posy to take home.',
    },
    {
      id: 'theme-2',
      title: 'Golden Hour Soirée & Citrus Glow',
      tagline: 'Sun-drenched champagne accents, blood orange garnishes, and disco balls scattering soft reflections.',
      palette: [
        { name: 'Sunset Honey', hex: '#F9C74F' },
        { name: 'Blood Orange', hex: '#F9844A' },
        { name: 'Rose Quartz', hex: '#F4ACB7' },
        { name: 'Champagne Shimmer', hex: '#FFEAA7' },
        { name: 'Warm Blanc', hex: '#FAF5EE' },
      ],
      decorIdeas: [
        'Mini mirror disco balls nestled inside citrus and eucalyptus centerpieces',
        'Custom neon script or retro marquee sign with a celebratory phrase',
        'Sunset ombre champagne coupe tower with dried orange wheels',
        'Polaroid photo guestbook corner with gold metallic gel pens',
      ],
      musicVibe: 'Feel-good 70s disco re-edits, modern nu-disco, and warm upbeat groove',
      attirePrompt: 'Festive chic with subtle shimmer, warm jewel tones, or velvet accents',
      signatureTouch: 'An interactive cocktail spritz cart with bespoke customized glass stirrers.',
    },
    {
      id: 'theme-3',
      title: 'Velvet Midnight & Starlight Lounge',
      tagline: 'Intimate celestial vibes with deep indigo, shimmering gold, moody florals, and acoustic candlelight.',
      palette: [
        { name: 'Midnight Navy', hex: '#2B2D42' },
        { name: 'Dusty Mauve', hex: '#B5838D' },
        { name: 'Starlight Gold', hex: '#E0A96D' },
        { name: 'Blush Silk', hex: '#FFDDD2' },
        { name: 'Deep Emerald', hex: '#405B55' },
      ],
      decorIdeas: [
        'Suspended paper lantern stars with soft micro-LED fairy lights',
        'Velvet table runners with dark ceramic dinnerware and brass cutlery',
        'Constellation place cards with handwritten personalized notes for each guest',
        'A dessert table illuminated with hurricane glass lanterns and cascading greenery',
      ],
      musicVibe: 'Warm acoustic covers, neo-soul ballads, and mellow downtempo jazz',
      attirePrompt: 'Cocktail lounge attire: deep navy, emerald, wine, or black with gold jewelry',
      signatureTouch: 'A custom constellation message board where guests write wishes like shining stars.',
    },
  ];
}

/** Invitation or thank-you copy templated from the event details. */
export function fallbackInvitation(input: InvitationRequest): InvitationCopy {
  const { eventTitle, hostName, location, theme } = input;
  const occasion = input.occasion && humanizeOccasion(input.occasion);
  const date = input.date && formatEventDate(input.date);
  const time = input.time && formatDisplayTime(input.time);

  if (input.type === 'thank_you') {
    return {
      subjectLine: `Thank you for celebrating ${eventTitle || 'with us'}! ✨`,
      headline: 'Our Hearts Are So Full',
      greeting: 'Dear friends and family,',
      body: `Thank you so much for being a part of ${eventTitle || 'our celebration'}. Having you there to share laughter, clink glasses, and create unforgettable memories made the day truly magical. We are endlessly grateful for your love, warm wishes, and wonderful company.`,
      detailsBlock: {
        when: date || 'This past weekend',
        where: location || 'At our gathering',
        rsvpNote: 'Photo gallery and candid snapshots will be shared soon!',
        dressCode: 'Cherished memories',
      },
      closing: 'Until our next celebration together,',
      signoff: `With all our love, ${hostName || 'The Hosts'}`,
    };
  }

  const subject = eventTitle || occasion;
  return {
    subjectLine: `You're Invited! Celebrate ${subject || 'with us'} 🥂`,
    headline: `Let's Celebrate ${subject || 'Together'}!`,
    greeting: 'You are warmly invited,',
    body: `We are gathering our favorite people to toast, feast, and make unforgettable memories for ${eventTitle || 'this special moment'}. There will be delightful treats, sparkling drinks, great tunes, and plenty of love.`,
    detailsBlock: {
      when: [date || 'Saturday, 4:00 PM', time].filter(Boolean).join(' • '),
      where: location || 'Sunset Terrace & Garden',
      rsvpNote: 'Please kindly RSVP by two weeks prior so we can reserve your glass and plate!',
      dressCode: theme ? `Festive Chic • Inspired by "${theme}"` : 'Festive & Comfortable Chic',
    },
    closing: "We can't wait to raise a glass with you!",
    signoff: `Warmly, ${hostName || 'Your Host'}`,
  };
}

/** Where a milestone sits: `'setup'` is before doors open, numbers are fractions of the event window. */
type MilestonePosition = 'setup' | number;
type MilestoneTemplate = Omit<Timeline[number], 'id' | 'time'> & { readonly at: MilestonePosition };

const SETUP_LEAD_MINUTES = 30;
const SLOT_MINUTES = 5;
const DEFAULT_WINDOW = { start: 14 * 60, end: 20 * 60 } as const;

const TIMELINE_TEMPLATE: readonly MilestoneTemplate[] = [
  {
    at: 'setup',
    title: 'Final Setup & Vendor Soundcheck',
    description: 'Florals in place, playlists queued, glassware prepped, and dessert table styled.',
    category: 'prep',
    assignedTo: 'Host & Coordinator',
    tips: 'Light candles 15 minutes before doors open.',
  },
  {
    at: 0,
    title: 'Doors Open & Welcome Drinks',
    description: 'Guests arrive to acoustic background playlist, signature cocktails & mocktails, and grazing board.',
    category: 'arrival',
    assignedTo: 'Greeter & Bartender',
    tips: 'Have the polaroid guestbook ready right by the welcome station.',
  },
  {
    at: 0.21,
    title: 'Icebreaker & Interactive Activity',
    description: 'Engaging celebration trivia, advice card station, or fun lawn game / photo challenge.',
    category: 'activity',
    assignedTo: 'Master of Ceremonies / Best Friend',
    tips: 'Keep it lighthearted and voluntary.',
  },
  {
    at: 0.375,
    title: 'Main Meal & Shared Feasting',
    description: 'Artisanal buffet or plated courses served with fresh wine pairings and mocktails.',
    category: 'food',
    assignedTo: 'Catering Team',
    tips: 'Check with guests who marked dietary allergies.',
  },
  {
    at: 0.58,
    title: 'Heartfelt Toasts & Speeches',
    description: 'Host welcome speech, loved ones share warm words, clinking of champagne glasses.',
    category: 'toast',
    assignedTo: 'Host & Key Speakers',
    tips: 'Cap each toast at 3-4 minutes to keep energy buoyant.',
  },
  {
    at: 0.67,
    title: 'Cake Cutting & Dessert Spread',
    description: 'Gathering around the centerpiece dessert, candle blowing, and coffee/tea service.',
    category: 'party',
    assignedTo: 'Host & Catering',
    tips: 'Play a celebratory anthem right as the cake is cut!',
  },
  {
    at: 0.75,
    title: 'Dance Floor & Golden Hour Sunset Photos',
    description: 'Tempo picks up with upbeat playlist, candid camera moments, dance floor celebration.',
    category: 'party',
    assignedTo: 'DJ / Playlist Lead & Photographer',
    tips: 'Golden hour lighting is peak photo time!',
  },
  {
    at: 1,
    title: 'Sparkler Send-Off & Goodnight Favors',
    description: 'Handing out favor bags, farewell embraces, and gentle wind-down music.',
    category: 'wind_down',
    assignedTo: 'Host Team',
    tips: 'Prepare takeaway boxes for leftover desserts.',
  },
];

/**
 * A well-paced run-of-show spread across the requested start/end window
 * (defaults to 2:00 PM - 8:00 PM), with fresh unique IDs on every call.
 */
export function fallbackTimeline(input: TimelineRequest): Timeline {
  const window = resolveTimeWindow(input.startTime, input.endTime, DEFAULT_WINDOW);
  const duration = window.end - window.start;
  const minuteFor = (at: MilestonePosition) =>
    at === 'setup'
      ? window.start - SETUP_LEAD_MINUTES
      : window.start + Math.round((duration * at) / SLOT_MINUTES) * SLOT_MINUTES;

  return TIMELINE_TEMPLATE.map(({ at, ...milestone }) => ({
    id: `tl-${randomUUID()}`,
    time: formatClockTime(minuteFor(at)),
    ...milestone,
  }));
}

const FALLBACK_IDEAS: Ideas = {
  decor: [
    {
      item: 'Cascading Pastel Balloon & Eucalyptus Garland',
      description: 'Blush pink, champagne, and sage organic arches flanking the entrance or photo backdrop.',
      estimatedCost: '$80 - $140',
      priority: 'High',
    },
    {
      item: 'Ribbed Amber Glassware & Taper Candle Clusters',
      description: 'Varying heights of pillar and taper candles in hurricane glass to ensure safety and romantic warmth.',
      estimatedCost: '$60 - $110',
      priority: 'Medium',
    },
    {
      item: 'Custom Arch Wood Welcome Board with Gold 3D Decal',
      description: 'Warm painted board with handwritten guest welcome and day-of schedule summary.',
      estimatedCost: '$45 - $75',
      priority: 'High',
    },
    {
      item: 'Overhead Warm Festoon Fairy Lights Canopy',
      description: 'Gentle 2700K warm micro bulbs casting a soft golden glow over dining tables.',
      estimatedCost: '$50 - $90',
      priority: 'Medium',
    },
    {
      item: 'Polaroid Memory Washing Line with Wooden Pegs',
      description: 'Fairy-lit jute twine where guests pin candid snaps taken during the event.',
      estimatedCost: '$25 - $40',
      priority: 'Low',
    },
  ],
  menu: {
    starters: [
      'Artisanal Burrata Crostini with Fig Jam & Micro Basil',
      'Smoked Salmon Tartare Blinis with Lemon Dill Crème Fraîche',
      'Roasted Peach & Goat Cheese Flatbread with Balsamic Glaze (Veg)',
      'Crispy Polenta Bites with Truffle Aioli (GF)',
    ],
    mains: [
      'Herb-Crusted Roast Tenderloin with Chimichurri Reduction',
      'Wild Mushroom & Fontina Truffle Risotto (Vegetarian & GF)',
      'Miso Glazed Chilean Sea Bass on Bok Choy & Jasmine Rice',
      'Heirloom Tomato & Roasted Beet Salad with Candied Pecans',
    ],
    desserts: [
      'Tiered Earl Grey & Lavender Buttercream Celebration Cake',
      'Mini French Macaron Tower (Rose, Pistachio, Salted Caramel)',
      'Dark Chocolate Sea Salt Ganache Tartlets',
      'Fresh Berry Pavlova Clouds with Passionfruit Coulis (GF)',
    ],
    signatureDrinks: [
      '“The Blushing Fête” — Prosecco, Elderflower Liqueur, Muddled Raspberries, Lemon Twist',
      '“Golden Hour Spritz” — Aperol, Blood Orange, Sparkling Soda, Fresh Rosemary',
      '“Honey Pear Fizz” (Mocktail) — Spiced Pear Purée, Raw Honey, Thyme, Ginger Beer',
      'Cucumber Mint Agave Refresher (Mocktail)',
    ],
  },
  activities: [
    {
      title: 'The "Who Knows The Celebrant Best?" Speed Trivia',
      duration: '20 mins',
      description: 'A punchy, hilarious 10-question multiple choice game on cute printed cards with a bottle of sparkling rosé for the winner.',
      materialsNeeded: 'Printed question cards, mini golf pencils, prize basket',
    },
    {
      title: 'Audio Guestbook & Vintage Rotary Telephone Voice Messages',
      duration: 'Ongoing throughout evening',
      description: 'Guests pick up a retro phone receiver and leave hilarious, loving voice memos and well-wishes.',
      materialsNeeded: 'Retro rotary recording phone or iPad station',
    },
    {
      title: 'Champagne Tower Pour & Communal Toast',
      duration: '15 mins',
      description: 'Host and honoree pour from magnum bottles down a stacked crystal coupe tower as music crescendos.',
      materialsNeeded: 'Coupe glasses (stacked pyramid), magnum champagne/sparkling cider',
    },
    {
      title: 'DIY Botanical Cocktail/Mocktail Bar',
      duration: 'Self-serve / 30 mins',
      description: 'Guests craft their own custom drink with dehydrated fruit wheels, edible flowers, infused syrups, and custom garnishes.',
      materialsNeeded: 'Garnish jars, tongs, recipe cards, syrup droppers',
    },
  ],
};

/** Curated décor, menu, and activity ideas. */
export function fallbackIdeas(): Ideas {
  return structuredClone(FALLBACK_IDEAS);
}
