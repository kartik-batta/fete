import React, { useState } from 'react';
import { EventData, AITheme, TimelineEvent, InvitationDraft } from '../../types';
import {
  Sparkles,
  Palette,
  Mail,
  Clock,
  Utensils,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ArrowRight,
  Printer,
  Edit3,
  Heart,
  PartyPopper,
  Wine,
  Lightbulb,
} from 'lucide-react';
import { TweakThemeModal } from '../modals/TweakThemeModal';
import { triggerFestiveConfetti, triggerMiniConfetti } from '../../utils/confetti';

interface AiStudioTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
  onSwitchTab: (tab: string) => void;
}

export const AiStudioTab: React.FC<AiStudioTabProps> = ({
  event,
  onUpdateEvent,
  onSwitchTab,
}) => {
  const [subTab, setSubTab] = useState<'themes' | 'invitations' | 'timeline' | 'ideas'>('themes');

  // 1. THEMES STATE
  const [themeVibe, setThemeVibe] = useState('Warm, festive, chic and botanical');
  const [themeNotes, setThemeNotes] = useState('');
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [suggestedThemes, setSuggestedThemes] = useState<AITheme[]>([]);
  const [selectedThemeToTweak, setSelectedThemeToTweak] = useState<AITheme | null>(null);

  // 2. INVITATIONS STATE
  const [inviteType, setInviteType] = useState<'invitation' | 'thank_you'>('invitation');
  const [inviteTone, setInviteTone] = useState<'warm' | 'playful' | 'elegant' | 'minimalist'>('warm');
  const [inviteExtras, setInviteExtras] = useState('Dietary options provided, please RSVP 2 weeks prior');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [currentInvite, setCurrentInvite] = useState<InvitationDraft>(
    event.invitationDraft || {
      subjectLine: `You're Invited: ${event.title} ✨`,
      headline: `Celebrate ${event.title}`,
      greeting: 'Dear friends and family,',
      body: `We are coming together to celebrate this cherished milestone with laughter, wonderful company, sparkling drinks, and farm-fresh bites. Your presence will make the celebration complete!`,
      detailsBlock: {
        when: `${event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Upcoming Date'} • ${event.time || '4:00 PM'}`,
        where: `${event.venueName || event.location || 'Our Venue'}`,
        rsvpNote: 'Please kindly RSVP with your dietary preferences.',
        dressCode: event.themeTitle ? `Festive Chic • Inspired by "${event.themeTitle}"` : 'Festive & Elegant',
      },
      closing: "We can't wait to clink glasses with you!",
      signoff: `With love and excitement, ${event.hostName || 'Your Host'}`,
      tone: 'warm',
      cardStyle: 'floral',
    }
  );
  const [isEditingInvite, setIsEditingInvite] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // 3. TIMELINE STATE
  const [startTime, setStartTime] = useState(event.time || '03:00 PM');
  const [endTime, setEndTime] = useState('09:00 PM');
  const [keyMoments, setKeyMoments] = useState('Welcome spritz, group photos, dinner courses, speeches & toasts, cake cutting, dance party');
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [suggestedTimeline, setSuggestedTimeline] = useState<TimelineEvent[]>([]);

  // 4. MENU & IDEAS STATE
  const [dietaryPref, setDietaryPref] = useState('Vegetarian, gluten-free, and refreshing mocktail options');
  const [ageGroup, setAgeGroup] = useState('Adults & multi-generational family');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [curatedIdeas, setCuratedIdeas] = useState<{
    decor: { item: string; description: string; estimatedCost?: string; priority?: string }[];
    menu: { starters: string[]; mains: string[]; desserts: string[]; signatureDrinks: string[] };
    activities: { title: string; duration: string; description: string; materialsNeeded?: string }[];
  } | null>(null);

  // 1. CALL THEMES API
  const handleGenerateThemes = async () => {
    setIsGeneratingThemes(true);
    try {
      const res = await fetch('/api/gemini/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: event.occasion,
          guestCount: event.guests.length || 30,
          budget: event.totalBudget || 2500,
          vibe: themeVibe,
          notes: themeNotes,
        }),
      });
      const data = await res.json();
      if (data.themes) {
        setSuggestedThemes(data.themes);
        triggerMiniConfetti(0.5, 0.4);
      }
    } catch (err) {
      console.error('Failed to generate themes:', err);
    } finally {
      setIsGeneratingThemes(false);
    }
  };

  // 2. CALL INVITATION API
  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const res = await fetch('/api/gemini/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: event.title,
          occasion: event.occasion,
          hostName: event.hostName,
          date: event.date,
          time: event.time,
          location: event.venueName || event.location,
          theme: event.themeTitle,
          tone: inviteTone,
          extraDetails: inviteExtras,
          type: inviteType,
        }),
      });
      const data = await res.json();
      if (data.invitation) {
        setCurrentInvite({
          ...data.invitation,
          tone: inviteTone,
          cardStyle: currentInvite.cardStyle || 'floral',
        });
        triggerMiniConfetti(0.5, 0.4);
      }
    } catch (err) {
      console.error('Failed to generate invitation:', err);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  // 3. CALL TIMELINE API
  const handleGenerateTimeline = async () => {
    setIsGeneratingTimeline(true);
    try {
      const res = await fetch('/api/gemini/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: event.title,
          occasion: event.occasion,
          startTime,
          endTime,
          guestCount: event.guests.length || 30,
          vibes: event.themeTitle || 'Celebratory',
          keyMoments,
        }),
      });
      const data = await res.json();
      if (data.timeline) {
        setSuggestedTimeline(data.timeline);
        triggerMiniConfetti(0.5, 0.4);
      }
    } catch (err) {
      console.error('Failed to generate timeline:', err);
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  // 4. CALL IDEAS API
  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(false);
    setIsGeneratingIdeas(true);
    try {
      const res = await fetch('/api/gemini/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: event.occasion,
          guestCount: event.guests.length || 30,
          budget: event.totalBudget,
          theme: event.themeTitle || themeVibe,
          dietary: dietaryPref,
          ageGroup,
        }),
      });
      const data = await res.json();
      if (data.ideas) {
        setCuratedIdeas(data.ideas);
        triggerMiniConfetti(0.5, 0.4);
      }
    } catch (err) {
      console.error('Failed to generate ideas:', err);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // APPLY THEME TO EVENT
  const handleApplyCustomizedTheme = (customTheme: AITheme) => {
    onUpdateEvent({
      ...event,
      themeTitle: customTheme.title,
      themeDescription: customTheme.tagline,
      themePalette: customTheme.palette,
    });
  };

  // ADD DECOR ITEMS TO CHECKLIST
  const handleAddDecorToTasks = (decorItems: string[]) => {
    const newTasks = decorItems.map((item, idx) => ({
      id: `t-decor-${Date.now()}-${idx}`,
      title: `Source décor: ${item}`,
      phase: '1_month_before' as const,
      dueDate: event.date,
      completed: false,
      priority: 'medium' as const,
      assignedTo: event.hostName || 'Host',
      notes: 'Added from AI Celebration Stylist',
    }));
    onUpdateEvent({ ...event, tasks: [...event.tasks, ...newTasks] });
    triggerFestiveConfetti();
    alert(`Added ${decorItems.length} décor items to your To-Do checklist!`);
  };

  // APPLY TIMELINE TO EVENT
  const handleApplyTimelineToEvent = (mode: 'replace' | 'append') => {
    if (suggestedTimeline.length === 0) return;
    const nextTimeline =
      mode === 'replace' ? suggestedTimeline : [...event.timeline, ...suggestedTimeline];
    onUpdateEvent({ ...event, timeline: nextTimeline });
    triggerFestiveConfetti();
    alert('Day-of Run of Show successfully updated!');
    onSwitchTab('timeline');
  };

  // COPY INVITATION TEXT
  const handleCopyInvite = () => {
    const textToCopy = `${currentInvite.subjectLine}\n\n${currentInvite.headline}\n${currentInvite.greeting}\n\n${currentInvite.body}\n\nWHEN: ${currentInvite.detailsBlock?.when}\nWHERE: ${currentInvite.detailsBlock?.where}\nRSVP: ${currentInvite.detailsBlock?.rsvpNote}\nDRESS CODE: ${currentInvite.detailsBlock?.dressCode || 'Festive'}\n\n${currentInvite.closing}\n${currentInvite.signoff}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  // SAVE INVITATION TO EVENT
  const handleSaveInviteToEvent = () => {
    onUpdateEvent({ ...event, invitationDraft: currentInvite });
    triggerMiniConfetti(0.5, 0.5);
    alert('Invitation draft saved to this event!');
  };

  return (
    <div className="space-y-6">
      {/* AI Studio Header */}
      <div className="bg-gradient-to-r from-rose-100/80 via-amber-100/60 to-purple-100/70 p-6 sm:p-8 rounded-3xl border border-[#EFE3D5] shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-rose-800 border border-rose-200 shadow-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" />
            <span>AI Celebration Concierge • Powered by Gemini</span>
          </div>
          <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
            Creative Ideas Tailored to Your Celebration
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            Generate curated themes, custom stationery wording, day-of timelines, and artisanal menus.
            Every suggestion is completely editable and tweaks can be saved directly to your event!
          </p>
        </div>

        {/* Sub-Nav Pills */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar relative z-10">
          <button
            onClick={() => setSubTab('themes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition ${
              subTab === 'themes'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Party Themes</span>
          </button>

          <button
            onClick={() => setSubTab('invitations')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition ${
              subTab === 'invitations'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invitations & Thank You</span>
          </button>

          <button
            onClick={() => setSubTab('timeline')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition ${
              subTab === 'timeline'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Day-of Timeline</span>
          </button>

          <button
            onClick={() => setSubTab('ideas')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition ${
              subTab === 'ideas'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Décor, Menu & Games</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: THEMES GENERATOR */}
      {subTab === 'themes' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs">
            <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
              Party Theme Inspiration
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Suggests cohesive aesthetic packages with palettes, floral/decor motifs, attire guidance, and playlist cues.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Desired Vibe / Style
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warm French botanical, retro sunset disco, enchanted forest..."
                  value={themeVibe}
                  onChange={(e) => setThemeVibe(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Special Notes or Favorite Elements
                </label>
                <input
                  type="text"
                  placeholder="e.g. Include dried citrus, outdoor fairy lights, peach tones"
                  value={themeNotes}
                  onChange={(e) => setThemeNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>

            {/* Quick Vibe Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <span className="text-[11px] text-stone-400 font-medium">Quick vibes:</span>
              {[
                'Sunset Botanicals & Spritz',
                'Retro Pastel Disco',
                'Cozy Autumn Harvest',
                'Celestial Indigo & Starlight',
                'Clean Scandinavian Linen',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setThemeVibe(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateThemes}
              disabled={isGeneratingThemes}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-xs shadow-md transition flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingThemes ? 'animate-spin' : ''}`} />
              <span>{isGeneratingThemes ? 'Styling Concepts...' : 'Generate 3 Theme Concepts'}</span>
            </button>
          </div>

          {/* Theme Results Grid */}
          {suggestedThemes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestedThemes.map((theme, idx) => (
                <div
                  key={theme.id || idx}
                  className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-serif-title text-lg font-bold text-stone-900 group-hover:text-rose-600 transition">
                        {theme.title}
                      </h4>
                    </div>

                    <p className="text-xs text-stone-600 italic font-serif mb-4 leading-relaxed">
                      "{theme.tagline}"
                    </p>

                    {/* Color Swatches */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1.5">
                        Color Palette
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {theme.palette?.map((col, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-[10px]"
                            title={`${col.name} (${col.hex})`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span className="text-stone-700 font-medium">{col.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Decor Highlights */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1.5">
                        Décor Elements
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-600">
                        {theme.decorIdeas?.map((dec, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1.5">
                            <span className="text-rose-400 text-sm leading-none">•</span>
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Attire & Music */}
                    <div className="space-y-2 text-xs text-stone-600 bg-[#FAF7F2] p-3 rounded-2xl mb-4 border border-[#EFE5D8]">
                      <div>
                        <strong className="text-stone-800">Playlist:</strong> {theme.musicVibe}
                      </div>
                      <div>
                        <strong className="text-stone-800">Attire:</strong> {theme.attirePrompt}
                      </div>
                      <div>
                        <strong className="text-rose-700">Signature Touch:</strong>{' '}
                        {theme.signatureTouch}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => setSelectedThemeToTweak(theme)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Tweak & Apply to Celebration</span>
                    </button>

                    <button
                      onClick={() => handleAddDecorToTasks(theme.decorIdeas)}
                      className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200 transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Décor to Checklist</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: INVITATIONS & THANK YOU */}
      {subTab === 'invitations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs space-y-4">
            <h3 className="font-serif-title text-lg font-bold text-stone-900">
              Stationery & Message Studio
            </h3>
            <p className="text-xs text-stone-500">
              Craft bespoke invitations and post-party thank you messages with tailored tones.
            </p>

            {/* Mode: Invite vs Thank You */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Message Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInviteType('invitation')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    inviteType === 'invitation'
                      ? 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-300'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  💌 Celebration Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setInviteType('thank_you')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    inviteType === 'thank_you'
                      ? 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-300'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  ✨ Thank You Card
                </button>
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Tone of Voice
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'warm', label: 'Warm & Heartfelt' },
                  { id: 'playful', label: 'Playful & Bubbly' },
                  { id: 'elegant', label: 'Editorial & Formal' },
                  { id: 'minimalist', label: 'Modern Minimalist' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInviteTone(t.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      inviteTone === t.id
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra details */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Specific Inclusions / Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Dietary preferences requested, plus-ones welcome, valet parking details"
                value={inviteExtras}
                onChange={(e) => setInviteExtras(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>

            <button
              onClick={handleGenerateInvite}
              disabled={isGeneratingInvite}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingInvite ? 'animate-spin' : ''}`} />
              <span>{isGeneratingInvite ? 'Crafting Wording...' : 'Generate New Draft'}</span>
            </button>
          </div>

          {/* Interactive Live Card Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Stationery Card Container */}
            <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#E8DCC9] shadow-xl p-8 sm:p-12 relative overflow-hidden transition-all">
              {/* Subtle decorative inner border */}
              <div className="border border-[#E8DCC9]/70 rounded-2xl p-6 sm:p-8 relative">
                {/* Header Badge */}
                <div className="text-center mb-6">
                  <span className="text-2xl mb-1 block">🥂</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 block">
                    {inviteType === 'invitation' ? 'YOU ARE CORDIALLY INVITED' : 'WITH SINCERE GRATITUDE'}
                  </span>
                </div>

                {/* Editable Subject & Headline */}
                <div className="text-center mb-6">
                  {isEditingInvite ? (
                    <input
                      type="text"
                      value={currentInvite.headline}
                      onChange={(e) =>
                        setCurrentInvite({ ...currentInvite, headline: e.target.value })
                      }
                      className="font-serif-title text-2xl sm:text-3xl font-bold text-center text-stone-900 w-full border-b border-rose-300 focus:outline-none"
                    />
                  ) : (
                    <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                      {currentInvite.headline}
                    </h3>
                  )}
                </div>

                {/* Greeting & Body */}
                <div className="space-y-4 text-center max-w-lg mx-auto mb-8">
                  {isEditingInvite ? (
                    <input
                      type="text"
                      value={currentInvite.greeting}
                      onChange={(e) =>
                        setCurrentInvite({ ...currentInvite, greeting: e.target.value })
                      }
                      className="text-xs sm:text-sm text-center text-stone-600 font-medium w-full border-b border-rose-200 focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-stone-600 font-medium">
                      {currentInvite.greeting}
                    </p>
                  )}

                  {isEditingInvite ? (
                    <textarea
                      rows={4}
                      value={currentInvite.body}
                      onChange={(e) =>
                        setCurrentInvite({ ...currentInvite, body: e.target.value })
                      }
                      className="text-xs sm:text-sm text-stone-800 font-serif leading-relaxed w-full p-2 border border-rose-200 rounded-xl focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-stone-800 font-serif leading-relaxed">
                      {currentInvite.body}
                    </p>
                  )}
                </div>

                {/* Details Block */}
                <div className="bg-[#FAF6EE] rounded-2xl p-5 border border-[#E9DEC8] max-w-md mx-auto text-center space-y-2 text-xs mb-8">
                  <div>
                    <span className="font-semibold text-stone-900 block">WHEN</span>
                    {isEditingInvite ? (
                      <input
                        type="text"
                        value={currentInvite.detailsBlock?.when}
                        onChange={(e) =>
                          setCurrentInvite({
                            ...currentInvite,
                            detailsBlock: { ...currentInvite.detailsBlock, when: e.target.value },
                          })
                        }
                        className="text-stone-700 w-full text-center border-b border-rose-200"
                      />
                    ) : (
                      <span className="text-stone-700">{currentInvite.detailsBlock?.when}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-stone-900 block">WHERE</span>
                    {isEditingInvite ? (
                      <input
                        type="text"
                        value={currentInvite.detailsBlock?.where}
                        onChange={(e) =>
                          setCurrentInvite({
                            ...currentInvite,
                            detailsBlock: { ...currentInvite.detailsBlock, where: e.target.value },
                          })
                        }
                        className="text-stone-700 w-full text-center border-b border-rose-200"
                      />
                    ) : (
                      <span className="text-stone-700">{currentInvite.detailsBlock?.where}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-stone-900 block">DRESS CODE</span>
                    {isEditingInvite ? (
                      <input
                        type="text"
                        value={currentInvite.detailsBlock?.dressCode}
                        onChange={(e) =>
                          setCurrentInvite({
                            ...currentInvite,
                            detailsBlock: {
                              ...currentInvite.detailsBlock,
                              dressCode: e.target.value,
                            },
                          })
                        }
                        className="text-stone-700 w-full text-center border-b border-rose-200"
                      />
                    ) : (
                      <span className="text-stone-700">
                        {currentInvite.detailsBlock?.dressCode || 'Festive Chic'}
                      </span>
                    )}
                  </div>

                  <div className="pt-1 text-[11px] text-stone-500 italic">
                    {currentInvite.detailsBlock?.rsvpNote}
                  </div>
                </div>

                {/* Sign-off */}
                <div className="text-center space-y-1">
                  <p className="font-handwriting text-2xl text-rose-800">
                    {currentInvite.closing}
                  </p>
                  <p className="font-medium text-xs text-stone-700">
                    {currentInvite.signoff}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EFE5D8] shadow-xs">
              <button
                onClick={() => setIsEditingInvite(!isEditingInvite)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  isEditingInvite
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingInvite ? 'Done Tweaking' : 'Tweak Text In-Place'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInvite}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveInviteToEvent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save to Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TIMELINE GENERATOR */}
      {subTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs">
            <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
              AI Day-of Timeline Architect
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Orchestrate a seamless flow of moments, from setup to final toasts and send-off.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Guest Count
                </label>
                <input
                  type="number"
                  value={event.guests.length || 30}
                  readOnly
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50 text-stone-600"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Key Desired Moments
              </label>
              <input
                type="text"
                value={keyMoments}
                onChange={(e) => setKeyMoments(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm"
              />
            </div>

            <button
              onClick={handleGenerateTimeline}
              disabled={isGeneratingTimeline}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-xs shadow-md transition flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingTimeline ? 'animate-spin' : ''}`} />
              <span>{isGeneratingTimeline ? 'Calculating Run of Show...' : 'Generate Day-of Run of Show'}</span>
            </button>
          </div>

          {/* Timeline Results List */}
          {suggestedTimeline.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
                <div>
                  <h4 className="font-serif-title text-xl font-bold text-stone-900">
                    Generated Timeline Schedule ({suggestedTimeline.length} Milestones)
                  </h4>
                  <p className="text-xs text-stone-500">
                    Review and tweak times or text directly before applying to your celebration schedule.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyTimelineToEvent('replace')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition"
                  >
                    Replace Event Timeline
                  </button>
                  <button
                    onClick={() => handleApplyTimelineToEvent('append')}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition"
                  >
                    Append to Existing
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {suggestedTimeline.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col sm:flex-row items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => {
                          const updated = [...suggestedTimeline];
                          updated[idx] = { ...updated[idx], time: e.target.value };
                          setSuggestedTimeline(updated);
                        }}
                        className="w-24 px-2 py-1 rounded-lg bg-stone-900 text-white font-mono text-xs font-bold text-center"
                      />

                      <div className="space-y-1 flex-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...suggestedTimeline];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setSuggestedTimeline(updated);
                          }}
                          className="font-serif-title font-bold text-sm text-stone-900 w-full bg-transparent border-b border-stone-200 focus:outline-none"
                        />
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...suggestedTimeline];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setSuggestedTimeline(updated);
                          }}
                          className="text-xs text-stone-600 w-full bg-transparent border-b border-stone-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                        Lead: {item.assignedTo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: DÉCOR, MENU & ACTIVITIES */}
      {subTab === 'ideas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#EFE5D8] shadow-xs">
            <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
              Menu, Décor & Party Activities
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Curate delicious hors d'oeuvres, signature cocktails, memorable guest icebreakers, and styling accents.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Dietary Preferences & Bar
                </label>
                <input
                  type="text"
                  value={dietaryPref}
                  onChange={(e) => setDietaryPref(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Crowd Dynamic & Age Group
                </label>
                <input
                  type="text"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-xs shadow-md transition flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingIdeas ? 'animate-spin' : ''}`} />
              <span>{isGeneratingIdeas ? 'Cooking up ideas...' : 'Generate Recommendations'}</span>
            </button>
          </div>

          {curatedIdeas && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Artisanal Menu */}
              <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🍽️</span>
                    <h4 className="font-serif-title text-lg font-bold text-stone-900">
                      Celebration Menu
                    </h4>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                        Hors d'Oeuvres & Starters
                      </span>
                      <ul className="space-y-1 text-stone-700">
                        {curatedIdeas.menu.starters.map((item, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                        Main Courses
                      </span>
                      <ul className="space-y-1 text-stone-700">
                        {curatedIdeas.menu.mains.map((item, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                        Celebration Desserts
                      </span>
                      <ul className="space-y-1 text-stone-700">
                        {curatedIdeas.menu.desserts.map((item, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                        Signature Sips & Mocktails
                      </span>
                      <ul className="space-y-1 text-stone-700">
                        {curatedIdeas.menu.signatureDrinks.map((item, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100">
                  <button
                    onClick={() => {
                      onUpdateEvent({
                        ...event,
                        menuIdeas: curatedIdeas.menu,
                      });
                      triggerFestiveConfetti();
                      alert('Saved menu ideas to celebration profile!');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-200 transition"
                  >
                    Save Menu to Event
                  </button>
                </div>
              </div>

              {/* Column 2: Activities & Games */}
              <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎲</span>
                    <h4 className="font-serif-title text-lg font-bold text-stone-900">
                      Party Games & Moments
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {curatedIdeas.activities.map((act, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{act.title}</span>
                          {act.duration && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                              {act.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-stone-600 leading-relaxed">{act.description}</p>
                        {act.materialsNeeded && (
                          <p className="text-[10px] text-stone-400 italic">
                            Needs: {act.materialsNeeded}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100">
                  <button
                    onClick={() => {
                      // Add activities as timeline milestones
                      const newMilestones = curatedIdeas.activities.map((act, idx) => ({
                        id: `tl-act-${Date.now()}-${idx}`,
                        time: `Activity ${idx + 1}`,
                        title: act.title,
                        description: act.description,
                        category: 'activity' as const,
                        assignedTo: 'Host / MC',
                        tips: act.materialsNeeded,
                      }));
                      onUpdateEvent({ ...event, timeline: [...event.timeline, ...newMilestones] });
                      triggerFestiveConfetti();
                      alert('Added activities to event schedule!');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs border border-purple-200 transition"
                  >
                    Add Activities to Schedule
                  </button>
                </div>
              </div>

              {/* Column 3: Décor Checklist */}
              <div className="bg-white rounded-3xl border border-[#EFE5D8] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💐</span>
                    <h4 className="font-serif-title text-lg font-bold text-stone-900">
                      Décor & Visuals
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {curatedIdeas.decor.map((dec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{dec.item}</span>
                          {dec.estimatedCost && (
                            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {dec.estimatedCost}
                            </span>
                          )}
                        </div>
                        <p className="text-stone-600 leading-relaxed">{dec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100">
                  <button
                    onClick={() => {
                      const decorTitles = curatedIdeas.decor.map((d) => d.item);
                      handleAddDecorToTasks(decorTitles);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 font-semibold text-xs border border-rose-200 transition"
                  >
                    Add Décor to To-Do Tasks
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tweak Theme Modal */}
      {selectedThemeToTweak && (
        <TweakThemeModal
          isOpen={Boolean(selectedThemeToTweak)}
          onClose={() => setSelectedThemeToTweak(null)}
          theme={selectedThemeToTweak}
          onSaveToEvent={handleApplyCustomizedTheme}
        />
      )}
    </div>
  );
};
