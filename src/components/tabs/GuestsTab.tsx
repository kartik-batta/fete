import React, { useState } from 'react';
import { EventData, Guest } from '../../types';
import {
  Users,
  Plus,
  Search,
  Download,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { GuestModal } from '../modals/GuestModal';
import { triggerMiniConfetti, triggerFestiveConfetti } from '../../utils/confetti';
import { IconButton } from '../ui/IconButton';
import { LiveRegion, useAnnouncer } from '../ui/LiveRegion';
import { csvFileName, downloadCsv, guestsToCsv } from './guestsCsv';

type Rsvp = Guest['rsvp'];

const RSVP_CHOICES: { value: Rsvp; label: string; activeClass: string; hoverClass: string }[] = [
  { value: 'attending', label: 'Attending', activeClass: 'bg-emerald-700 text-white shadow-xs', hoverClass: 'hover:text-emerald-800' },
  { value: 'pending', label: 'Pending', activeClass: 'bg-amber-700 text-white shadow-xs', hoverClass: 'hover:text-amber-800' },
  { value: 'declined', label: 'Declined', activeClass: 'bg-stone-700 text-white shadow-xs', hoverClass: 'hover:text-stone-900' },
];

interface GuestsTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({ event, onUpdateEvent }) => {
  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const { message, announce } = useAnnouncer();

  // Metrics
  const attendingGuests = event.guests.filter((g) => g.rsvp === 'attending');
  const totalAttendingHeadcount = attendingGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);
  const pendingCount = event.guests.filter((g) => g.rsvp === 'pending').length;
  const declinedCount = event.guests.filter((g) => g.rsvp === 'declined').length;

  // Filtered list
  const query = search.trim().toLowerCase();
  const filteredGuests = event.guests.filter((g) => {
    const matchesSearch =
      !query ||
      [g.name, g.email, g.dietary, g.tableNumber].some((field) => field?.toLowerCase().includes(query));

    const matchesRsvp = filterRsvp === 'all' || g.rsvp === filterRsvp;
    const matchesGroup = filterGroup === 'all' || g.group === filterGroup;

    return matchesSearch && matchesRsvp && matchesGroup;
  });

  const handleSaveGuest = (guest: Guest) => {
    let updatedGuests: Guest[];
    if (editingGuest) {
      updatedGuests = event.guests.map((g) => (g.id === guest.id ? guest : g));
    } else {
      updatedGuests = [guest, ...event.guests];
      if (guest.rsvp === 'attending') {
        triggerFestiveConfetti();
      }
    }
    onUpdateEvent({ ...event, guests: updatedGuests });
    announce(editingGuest ? `Updated ${guest.name}.` : `Added ${guest.name} to the guest list.`);
    setEditingGuest(null);
  };

  const handleDeleteGuest = (guest: Guest) => {
    if (window.confirm(`Remove ${guest.name} from the guest list?`)) {
      onUpdateEvent({ ...event, guests: event.guests.filter((g) => g.id !== guest.id) });
      announce(`Removed ${guest.name}.`);
    }
  };

  const handleQuickRsvpChange = (guest: Guest, newRsvp: Rsvp, e: React.MouseEvent<HTMLButtonElement>) => {
    if (guest.rsvp === newRsvp) return;
    if (newRsvp === 'attending') {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
    }
    const updated = event.guests.map((g) => (g.id === guest.id ? { ...g, rsvp: newRsvp } : g));
    onUpdateEvent({ ...event, guests: updated });
    announce(`${guest.name} marked ${newRsvp}.`);
  };

  const handleExportCSV = () => {
    downloadCsv(guestsToCsv(event.guests), csvFileName(event.title));
    announce(`Exported ${event.guests.length} guests to CSV.`);
  };

  const metricCards = [
    { label: 'Total Headcount', value: totalAttendingHeadcount, note: 'Confirmed guests + plus-ones', icon: Users, box: 'bg-white border-[#EFE5D8]', head: 'text-stone-700', num: 'text-stone-900', sub: 'text-stone-600', iconColor: 'text-rose-600' },
    { label: 'Attending', value: attendingGuests.length, note: 'RSVPs accepted', icon: CheckCircle2, box: 'bg-emerald-50/50 border-emerald-100', head: 'text-emerald-900', num: 'text-emerald-800', sub: 'text-emerald-800', iconColor: 'text-emerald-700' },
    { label: 'Pending', value: pendingCount, note: 'Awaiting response', icon: Clock, box: 'bg-amber-50/50 border-amber-100', head: 'text-amber-900', num: 'text-amber-800', sub: 'text-amber-800', iconColor: 'text-amber-700' },
    { label: 'Declined', value: declinedCount, note: 'Cannot make it', icon: XCircle, box: 'bg-stone-50 border-stone-200', head: 'text-stone-700', num: 'text-stone-700', sub: 'text-stone-600', iconColor: 'text-stone-600' },
  ];

  return (
    <div className="space-y-6">
      <LiveRegion message={message} />

      {/* Headcount Metric Cards */}
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" aria-label="RSVP summary">
        {metricCards.map(({ label, value, note, icon: Icon, box, head, num, sub, iconColor }) => (
          <li key={label} className={`p-4 sm:p-5 rounded-3xl border shadow-xs ${box}`}>
            <div className={`flex items-center justify-between mb-1 ${head}`}>
              <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${num}`}>{value}</div>
            <p className={`text-[11px] mt-0.5 ${sub}`}>{note}</p>
          </li>
        ))}
      </ul>

      {/* Control Bar: Search, Filters, Add Guest, Export */}
      <div
        role="search"
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE5D8] shadow-xs"
      >
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search guests"
              placeholder="Search by name, table, allergy, or email..."
              maxLength={100}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            />
          </div>

          <select
            aria-label="Filter by RSVP status"
            value={filterRsvp}
            onChange={(e) => setFilterRsvp(e.target.value)}
            className="py-2 px-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
          >
            <option value="all">All RSVPs</option>
            <option value="attending">Attending</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>

          <select
            aria-label="Filter by guest group"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="py-2 px-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 hidden sm:block"
          >
            <option value="all">All Groups</option>
            <option value="friends">Friends</option>
            <option value="family">Family</option>
            <option value="colleagues">Colleagues</option>
            <option value="vip">VIP</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={event.guests.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 disabled:opacity-50 text-stone-800 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingGuest(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-3xl border border-[#EFE5D8] overflow-hidden shadow-xs">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-stone-400 mx-auto mb-2" aria-hidden="true" />
            <h3 className="font-serif-title text-base font-bold text-stone-800">No guests match your criteria</h3>
            <p className="text-xs text-stone-600 mt-1">Try clearing search filters or add a new guest.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">
                Guest list: showing {filteredGuests.length} of {event.guests.length} guests
              </caption>
              <thead className="bg-[#FAF7F2] border-b border-[#EFE5D8] text-stone-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th scope="col" className="py-3 px-4 sm:px-6">Guest</th>
                  <th scope="col" className="py-3 px-3">RSVP Status</th>
                  <th scope="col" className="py-3 px-3 text-center">
                    <abbr title="Plus ones" className="no-underline">+1s</abbr>
                  </th>
                  <th scope="col" className="py-3 px-3">Dietary / Allergies</th>
                  <th scope="col" className="py-3 px-3">Seating / Group</th>
                  <th scope="col" className="py-3 px-3">Notes</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-stone-50/60 transition group">
                    <th scope="row" className="py-3.5 px-4 sm:px-6 font-normal">
                      <div className="font-semibold text-stone-900 text-sm">{guest.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-600 mt-0.5">
                        {guest.email && (
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <Mail className="w-3 h-3 text-stone-500" aria-hidden="true" />
                            <span className="sr-only">Email:</span>
                            {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-500" aria-hidden="true" />
                            <span className="sr-only">Phone:</span>
                            {guest.phone}
                          </span>
                        )}
                      </div>
                    </th>

                    {/* RSVP toggle group: state exposed via aria-pressed + visible text */}
                    <td className="py-3.5 px-3">
                      <div
                        role="group"
                        aria-label={`RSVP for ${guest.name}`}
                        className="inline-flex rounded-xl p-0.5 bg-stone-100 border border-stone-200"
                      >
                        {RSVP_CHOICES.map((choice) => {
                          const active = guest.rsvp === choice.value;
                          return (
                            <button
                              key={choice.value}
                              type="button"
                              aria-pressed={active}
                              onClick={(e) => handleQuickRsvpChange(guest, choice.value, e)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                active ? choice.activeClass : `text-stone-700 ${choice.hoverClass}`
                              }`}
                            >
                              {active && <span aria-hidden="true">✓ </span>}
                              {choice.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 font-bold text-stone-800">
                        {guest.plusOnes > 0 ? `+${guest.plusOnes}` : '0'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {guest.dietary && guest.dietary.toLowerCase() !== 'none' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-900 border border-rose-200/60">
                          <UtensilsCrossed className="w-3 h-3 text-rose-600" aria-hidden="true" />
                          {guest.dietary}
                        </span>
                      ) : (
                        <span className="text-stone-600 text-xs">Standard</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-medium text-stone-800">{guest.tableNumber || 'Unassigned'}</div>
                      <div className="text-[10px] uppercase font-semibold text-stone-600">{guest.group}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-stone-700 truncate max-w-xs block">{guest.notes || '—'}</span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton
                          label={`Edit ${guest.name}`}
                          icon={Edit2}
                          onClick={() => {
                            setEditingGuest(guest);
                            setIsModalOpen(true);
                          }}
                        />
                        <IconButton
                          label={`Delete ${guest.name}`}
                          icon={Trash2}
                          tone="danger"
                          onClick={() => handleDeleteGuest(guest)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GuestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleSaveGuest}
        initialGuest={editingGuest}
      />
    </div>
  );
};
