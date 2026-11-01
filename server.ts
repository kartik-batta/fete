import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize shared Gemini instance
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. POST /api/gemini/themes
app.post('/api/gemini/themes', async (req, res) => {
  const { occasion, guestCount, budget, vibe, notes } = req.body;

  try {
    if (ai) {
      const prompt = `You are a world-class celebration stylist and event designer.
Suggest 3 distinct, creative, and memorable party theme concepts for:
Occasion: ${occasion || 'Celebration'}
Guest Count: ${guestCount || 30}
Budget: $${budget || 2000}
Desired Vibe: ${vibe || 'Warm, festive, joyful'}
Additional Notes: ${notes || 'None'}

Return a structured JSON list of 3 themes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                tagline: { type: Type.STRING },
                palette: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                    },
                    required: ['name', 'hex'],
                  },
                },
                decorIdeas: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                musicVibe: { type: Type.STRING },
                attirePrompt: { type: Type.STRING },
                signatureTouch: { type: Type.STRING },
              },
              required: ['id', 'title', 'tagline', 'palette', 'decorIdeas', 'signatureTouch'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ success: true, themes: parsed });
      }
    }
  } catch (err: any) {
    console.warn('Gemini themes error, using curated presets:', err?.message || err);
  }

  // Graceful fallback curated suggestions
  const fallbackThemes = [
    {
      id: 'theme-1',
      title: `${occasion || 'Celebration'} In Provence: Pastel Botanicals`,
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

  res.json({ success: true, themes: fallbackThemes });
});

// 2. POST /api/gemini/invitation
app.post('/api/gemini/invitation', async (req, res) => {
  const {
    eventTitle,
    occasion,
    hostName,
    date,
    time,
    location,
    theme,
    tone = 'warm',
    extraDetails,
    type = 'invitation',
  } = req.body;

  try {
    if (ai) {
      const isThankYou = type === 'thank_you';
      const prompt = `You are an expert stationery wordsmith and celebration host.
Write a beautifully phrased ${isThankYou ? 'Thank You card / message' : 'Celebration Invitation'}.
Event Title: ${eventTitle || 'Our Celebration'}
Occasion: ${occasion || 'Party'}
Host: ${hostName || 'The Host'}
Date: ${date || 'Upcoming Date'}
Time: ${time || 'Afternoon'}
Location: ${location || 'Our Venue'}
Theme/Vibe: ${theme || 'Festive and joyful'}
Tone: ${tone} (e.g. warm, playful, elegant, minimalist)
Extra Details: ${extraDetails || 'RSVP requested, dietary options provided'}

Respond strictly with valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectLine: { type: Type.STRING },
              headline: { type: Type.STRING },
              greeting: { type: Type.STRING },
              body: { type: Type.STRING },
              detailsBlock: {
                type: Type.OBJECT,
                properties: {
                  when: { type: Type.STRING },
                  where: { type: Type.STRING },
                  rsvpNote: { type: Type.STRING },
                  dressCode: { type: Type.STRING },
                },
                required: ['when', 'where', 'rsvpNote'],
              },
              closing: { type: Type.STRING },
              signoff: { type: Type.STRING },
            },
            required: ['subjectLine', 'headline', 'greeting', 'body', 'detailsBlock', 'closing', 'signoff'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.headline && parsed.body) {
        return res.json({ success: true, invitation: parsed });
      }
    }
  } catch (err: any) {
    console.warn('Gemini invitation error, using curated generator:', err?.message || err);
  }

  // Graceful fallback tailored copy
  const isThankYou = type === 'thank_you';
  const fallback = isThankYou
    ? {
        subjectLine: `Thank you for celebrating ${eventTitle || 'with us'}! ✨`,
        headline: 'Our Hearts Are So Full',
        greeting: 'Dear friends and family,',
        body: `Thank you so much for being a part of ${eventTitle || 'our celebration'}. Having you there to share laughter, clink glasses, and create unforgettable memories made the day truly magical. We are endlessly grateful for your love, warm wishes, and wonderful company.`,
        detailsBlock: {
          when: `${date || 'This past weekend'}`,
          where: `${location || 'At our gathering'}`,
          rsvpNote: 'Photo gallery and candid snapshots will be shared soon!',
          dressCode: 'Cherished memories',
        },
        closing: 'Until our next celebration together,',
        signoff: `With all our love, ${hostName || 'The Hosts'}`,
      }
    : {
        subjectLine: `You're Invited! Celebrate ${eventTitle || occasion || 'with us'} 🥂`,
        headline: `Let's Celebrate ${eventTitle || occasion}!`,
        greeting: 'You are warmly invited,',
        body: `We are gathering our favorite people to toast, feast, and make unforgettable memories for ${eventTitle || 'this special moment'}. There will be delightful treats, sparkling drinks, great tunes, and plenty of love.`,
        detailsBlock: {
          when: `${date || 'Saturday, 4:00 PM'} ${time ? `• ${time}` : ''}`,
          where: `${location || 'Sunset Terrace & Garden'}`,
          rsvpNote: 'Please kindly RSVP by two weeks prior so we can reserve your glass and plate!',
          dressCode: theme ? `Festive Chic • Inspired by "${theme}"` : 'Festive & Comfortable Chic',
        },
        closing: "We can't wait to raise a glass with you!",
        signoff: `Warmly, ${hostName || 'Your Host'}`,
      };

  res.json({ success: true, invitation: fallback });
});

// 3. POST /api/gemini/timeline
app.post('/api/gemini/timeline', async (req, res) => {
  const { eventTitle, occasion, startTime, endTime, guestCount, vibes, keyMoments } = req.body;

  try {
    if (ai) {
      const prompt = `You are an elite event planner and day-of coordinator.
Create a smooth, stress-free day-of run-of-show timeline for:
Event: ${eventTitle || occasion || 'Celebration'}
Occasion: ${occasion || 'Party'}
Time window: ${startTime || '2:00 PM'} to ${endTime || '8:00 PM'}
Guest Count: ${guestCount || 30}
Vibe: ${vibes || 'Celebratory, relaxed, paced well'}
Key moments desired: ${keyMoments || 'Welcome drinks, main feast, speeches/toasts, cake cutting, dancing & photos'}

Generate an ordered array of 6 to 9 timeline milestones.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                time: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  description: 'prep | arrival | activity | food | toast | party | wind_down',
                },
                assignedTo: { type: Type.STRING },
                tips: { type: Type.STRING },
              },
              required: ['id', 'time', 'title', 'description', 'category', 'assignedTo'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ success: true, timeline: parsed });
      }
    }
  } catch (err: any) {
    console.warn('Gemini timeline error, using fallback schedule:', err?.message || err);
  }

  const fallbackTimeline = [
    {
      id: 'tl-1',
      time: '01:30 PM',
      title: 'Final Setup & Vendor Soundcheck',
      description: 'Florals in place, playlists queued, glassware prepped, and dessert table styled.',
      category: 'prep',
      assignedTo: 'Host & Coordinator',
      tips: 'Light candles 15 minutes before doors open.',
    },
    {
      id: 'tl-2',
      time: '02:00 PM',
      title: 'Doors Open & Welcome Drinks',
      description: 'Guests arrive to acoustic background playlist, signature cocktails & mocktails, and grazing board.',
      category: 'arrival',
      assignedTo: 'Greeter & Bartender',
      tips: 'Have the polaroid guestbook ready right by the welcome station.',
    },
    {
      id: 'tl-3',
      time: '03:15 PM',
      title: 'Icebreaker & Interactive Activity',
      description: 'Engaging celebration trivia, advice card station, or fun lawn game / photo challenge.',
      category: 'activity',
      assignedTo: 'Master of Ceremonies / Best Friend',
      tips: 'Keep it lighthearted and voluntary.',
    },
    {
      id: 'tl-4',
      time: '04:15 PM',
      title: 'Main Meal & Shared Feasting',
      description: 'Artisanal buffet or plated courses served with fresh wine pairings and mocktails.',
      category: 'food',
      assignedTo: 'Catering Team',
      tips: 'Check with guests who marked dietary allergies.',
    },
    {
      id: 'tl-5',
      time: '05:30 PM',
      title: 'Heartfelt Toasts & Speeches',
      description: 'Host welcome speech, loved ones share warm words, clinking of champagne glasses.',
      category: 'toast',
      assignedTo: 'Host & Key Speakers',
      tips: 'Cap each toast at 3-4 minutes to keep energy buoyant.',
    },
    {
      id: 'tl-6',
      time: '06:00 PM',
      title: 'Cake Cutting & Dessert Spread',
      description: 'Gathering around the centerpiece dessert, candle blowing, and coffee/tea service.',
      category: 'party',
      assignedTo: 'Host & Catering',
      tips: 'Play a celebratory anthem right as the cake is cut!',
    },
    {
      id: 'tl-7',
      time: '06:30 PM',
      title: 'Dance Floor & Golden Hour Sunset Photos',
      description: 'Tempo picks up with upbeat playlist, candid camera moments, dance floor celebration.',
      category: 'party',
      assignedTo: 'DJ / Playlist Lead & Photographer',
      tips: 'Golden hour lighting is peak photo time!',
    },
    {
      id: 'tl-8',
      time: '08:00 PM',
      title: 'Sparkler Send-Off & Goodnight Favors',
      description: 'Handing out favor bags, farewell embraces, and gentle wind-down music.',
      category: 'wind_down',
      assignedTo: 'Host Team',
      tips: 'Prepare takeaway boxes for leftover desserts.',
    },
  ];

  res.json({ success: true, timeline: fallbackTimeline });
});

// 4. POST /api/gemini/ideas (Décor, Menu, Activities)
app.post('/api/gemini/ideas', async (req, res) => {
  const { occasion, guestCount, budget, theme, dietary, ageGroup } = req.body;

  try {
    if (ai) {
      const prompt = `You are a visionary party planner.
Suggest curated Décor, Menu, and Activity ideas for:
Occasion: ${occasion || 'Celebration'}
Theme: ${theme || 'Warm modern festive'}
Guest Count: ${guestCount || 30}
Budget: $${budget || 2000}
Dietary requirements: ${dietary || 'Vegetarian & gluten-free options'}
Age group: ${ageGroup || 'All ages & adults'}

Respond strictly with valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decor: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimatedCost: { type: Type.STRING },
                    priority: { type: Type.STRING },
                  },
                  required: ['item', 'description'],
                },
              },
              menu: {
                type: Type.OBJECT,
                properties: {
                  starters: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mains: { type: Type.ARRAY, items: { type: Type.STRING } },
                  desserts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  signatureDrinks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['starters', 'mains', 'desserts', 'signatureDrinks'],
              },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    description: { type: Type.STRING },
                    materialsNeeded: { type: Type.STRING },
                  },
                  required: ['title', 'description'],
                },
              },
            },
            required: ['decor', 'menu', 'activities'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.decor && parsed.menu && parsed.activities) {
        return res.json({ success: true, ideas: parsed });
      }
    }
  } catch (err: any) {
    console.warn('Gemini ideas error, using curated ideas:', err?.message || err);
  }

  // Graceful curated fallback ideas
  const fallbackIdeas = {
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

  res.json({ success: true, ideas: fallbackIdeas });
});

// Vite middleware or static serving
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Celebration Planner Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
