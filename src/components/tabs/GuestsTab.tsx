import React, { useState } from 'react';
import { EventData, Guest } from '../../types';
import {
  Users,
  Plus,
  Search,
  Filter,
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

  // Metrics
  const attendingGuests = event.guests.filter((g) => g.rsvp === 'attending');
  const totalAttendingHeadcount = attendingGuests.reduce((acc, g) => acc + 1 + (g.plusOnes || 0), 0);
  const pendingCount = event.guests.filter((g) => g.rsvp === 'pending').length;
  const declinedCount = event.guests.filter((g) => g.rsvp === 'declined').length;

  // Filtered list
  const filteredGuests = event.guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.dietary.toLowerCase().includes(search.toLowerCase()) ||
      (g.tableNumber && g.tableNumber.toLowerCase().includes(search.toLowerCase()));

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
    setEditingGuest(null);
  };

  const handleDeleteGuest = (id: string) => {
    if (confirm('Are you sure you want to remove this guest?')) {
      const updatedGuests = event.guests.filter((g) => g.id !== id);
      onUpdateEvent({ ...event, guests: updatedGuests });
    }
  };

  const handleQuickRsvpChange = (guestId: string, newRsvp: 'attending' | 'declined' | 'pending', e: React.MouseEvent) => {
    if (newRsvp === 'attending') {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      triggerMiniConfetti(rect.x / window.innerWidth, rect.y / window.innerHeight);
    }
    const updated = event.guests.map((g) => (g.id === guestId ? { ...g, rsvp: newRsvp } : g));
    onUpdateEvent({ ...event, guests: updated });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'RSVP Status', 'Plus Ones', 'Total Seats', 'Dietary Requirements', 'Group', 'Table', 'Email', 'Phone', 'Notes'];
    const rows = event.guests.map((g) => [
      `"${g.name}"`,
      `"${g.rsvp}"`,
      g.plusOnes,
      g.plusOnes + 1,
      `"${g.dietary || 'None'}"`,
      `"${g.group}"`,
      `"${g.tableNumber || ''}"`,
      `"${g.email || ''}"`,
      `"${g.phone || ''}"`,
      `"${g.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Guest_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Headcount Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EFE5D8] shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Headcount</span>
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900">
            {totalAttendingHeadcount}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Confirmed guests + plus-ones
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attending</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800">
            {attendingGuests.length}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            RSVPs accepted
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-800">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Awaiting response
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-stone-50 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Declined</span>
            <XCircle className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-700">
            {declinedCount}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Cannot make it
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Guest, Export */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE5D8] shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, table, allergy, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* RSVP Filter */}
          <select
            value={filterRsvp}
            onChange={(e) => setFilterRsvp(e.target.value)}
            className="py-2 px-3 rounded-xl border border-stone-200 text-xs bg-white text-stone-700"
          >
            <option value="all">All RSVPs</option>
            <option value="attending">Attending</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>

          {/* Group Filter */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="py-2 px-3 rounded-xl border border-stone-200 text-xs bg-white text-stone-700 hidden sm:block"
          >
            <option value="all">All Groups</option>
            <option value="friends">Friends</option>
            <option value="family">Family</option>
            <option value="colleagues">Colleagues</option>
            <option value="vip">VIP</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingGuest(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-3xl border border-[#EFE5D8] overflow-hidden shadow-xs">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-serif-title text-base font-bold text-stone-800">No guests match your criteria</h3>
            <p className="text-xs text-stone-500 mt-1">Try clearing search filters or add a new guest.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EFE5D8] text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Guest</th>
                  <th className="py-3 px-3">RSVP Status</th>
                  <th className="py-3 px-3 text-center">+1s</th>
                  <th className="py-3 px-3">Dietary / Allergies</th>
                  <th className="py-3 px-3">Seating / Group</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredGuests.map((guest) => {
                  return (
                    <tr key={guest.id} className="hover:bg-stone-50/60 transition group">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-stone-900 text-sm">
                          {guest.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          {guest.email && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Mail className="w-3 h-3 text-stone-400" />
                              {guest.email}
                            </span>
                          )}
                          {guest.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {guest.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* RSVP dropdown pill */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex rounded-xl p-0.5 bg-stone-100 border border-stone-200">
                          <button
                            onClick={(e) => handleQuickRsvpChange(guest.id, 'attending', e)}
                            title="Mark Attending"
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              guest.rsvp === 'attending'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-emerald-700'
                            }`}
                          >
                            Attending
                          </button>
                          <button
                            onClick={(e) => handleQuickRsvpChange(guest.id, 'pending', e)}
                            title="Mark Pending"
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              guest.rsvp === 'pending'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-stone-600 hover:text-amber-700'
                            }`}
                          >
                            Pending
                          </button>
                          <button
                            onClick={(e) => handleQuickRsvpChange(guest.id, 'declined', e)}
                            title="Mark Declined"
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              guest.rsvp === 'declined'
                                ? 'bg-stone-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            Declined
                          </button>
                        </div>
                      </td>

                      {/* Plus Ones */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 font-bold text-stone-700">
                          {guest.plusOnes > 0 ? `+${guest.plusOnes}` : '0'}
                        </span>
                      </td>

                      {/* Dietary */}
                      <td className="py-3.5 px-3">
                        {guest.dietary && guest.dietary.toLowerCase() !== 'none' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200/60">
                            <UtensilsCrossed className="w-3 h-3 text-rose-500" />
                            {guest.dietary}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">Standard</span>
                        )}
                      </td>

                      {/* Table / Group */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-stone-800">
                          {guest.tableNumber || 'Unassigned'}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-stone-400 capitalize">
                          {guest.group}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-3">
                        <span className="text-stone-600 truncate max-w-xs block">
                          {guest.notes || '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingGuest(guest);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                            title="Edit Guest"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Guest"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
