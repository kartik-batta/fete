import { Type, type Schema } from '@google/genai';
import { TIMELINE_CATEGORIES } from '../schemas';

/*
 * Structured-output schemas sent to Gemini. They steer the model towards the shape the
 * frontend expects; the zod schemas in `../schemas` remain the source of truth and
 * re-validate every response before it reaches a client.
 */

const string: Schema = { type: Type.STRING };
const stringList: Schema = { type: Type.ARRAY, items: string };

export const themesResponseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: string,
      title: string,
      tagline: string,
      palette: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { name: string, hex: { type: Type.STRING, description: '#RRGGBB' } },
          required: ['name', 'hex'],
        },
      },
      decorIdeas: stringList,
      musicVibe: string,
      attirePrompt: string,
      signatureTouch: string,
    },
    required: ['id', 'title', 'tagline', 'palette', 'decorIdeas', 'signatureTouch'],
  },
};

export const invitationResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subjectLine: string,
    headline: string,
    greeting: string,
    body: string,
    detailsBlock: {
      type: Type.OBJECT,
      properties: { when: string, where: string, rsvpNote: string, dressCode: string },
      required: ['when', 'where', 'rsvpNote'],
    },
    closing: string,
    signoff: string,
  },
  required: ['subjectLine', 'headline', 'greeting', 'body', 'detailsBlock', 'closing', 'signoff'],
};

export const timelineResponseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: string,
      time: string,
      title: string,
      description: string,
      category: { type: Type.STRING, enum: [...TIMELINE_CATEGORIES] },
      assignedTo: string,
      tips: string,
    },
    required: ['id', 'time', 'title', 'description', 'category', 'assignedTo'],
  },
};

export const ideasResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    decor: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { item: string, description: string, estimatedCost: string, priority: string },
        required: ['item', 'description'],
      },
    },
    menu: {
      type: Type.OBJECT,
      properties: {
        starters: stringList,
        mains: stringList,
        desserts: stringList,
        signatureDrinks: stringList,
      },
      required: ['starters', 'mains', 'desserts', 'signatureDrinks'],
    },
    activities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { title: string, duration: string, description: string, materialsNeeded: string },
        required: ['title', 'description'],
      },
    },
  },
  required: ['decor', 'menu', 'activities'],
};
