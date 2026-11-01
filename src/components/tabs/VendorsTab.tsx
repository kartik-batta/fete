import React, { useState } from 'react';
import { EventData, Vendor, VendorCategory } from '../../types';
import {
  Briefcase,
  Plus,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { VendorModal } from '../modals/VendorModal';
import { triggerMiniConfetti } from '../../utils/confetti';

interface VendorsTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
}

const CATEGORY_ICONS: Record<VendorCategory, string> = {
  venue: '🏛️',
  catering: '🍷',
  photography: '📸',
  florist: '💐',
  music_dj: '🎵',
  cake_bakery: '🎂',
  rentals: '🪑',
  decor: '✨',
  entertainment: '🎭',
  other: '🏷️',
};

export const VendorsTab: React.FC<VendorsTabProps> = ({ event, onUpdateEvent }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const filteredVendors = event.vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      v.notes.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCommittedQuotes = event.vendors.reduce((acc, v) => acc + (v.costQuote || 0), 0);
  const bookedCount = event.vendors.filter((v) => v.status === 'booked' || v.status === 'paid').length;

  const handleSaveVendor = (vendor: Vendor) => {
    let updated: Vendor[];
    if (editingVendor) {
      updated = event.vendors.map((v) => (v.id === vendor.id ? vendor : v));
    } else {
      updated = [...event.vendors, vendor];
      triggerMiniConfetti(0.5, 0.5);
    }
    onUpdateEvent({ ...event, vendors: updated });
    setEditingVendor(null);
  };

  const handleDeleteVendor = (id: string) => {
    if (confirm('Delete this vendor record?')) {
      const updated = event.vendors.filter((v) => v.id !== id);
      onUpdateEvent({ ...event, vendors: updated });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Vendor Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#EFE5D8] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-1">
            Total Vendors
          </span>
          <div className="text-3xl font-bold text-stone-900">{event.vendors.length}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Partners & service providers</p>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block mb-1">
            Confirmed / Booked
          </span>
          <div className="text-3xl font-bold text-emerald-800">{bookedCount}</div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Contract secured</p>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 block mb-1">
            Total Quoted Value
          </span>
          <div className="text-3xl font-bold text-amber-900">${totalCommittedQuotes.toLocaleString()}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Sum of vendor estimates</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE5D8] shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor name, contact, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-2 px-3 rounded-xl border border-stone-200 text-xs bg-white text-stone-700"
          >
            <option value="all">All Vendor Types</option>
            <option value="venue">Venue</option>
            <option value="catering">Catering & Bar</option>
            <option value="photography">Photography</option>
            <option value="florist">Florals</option>
            <option value="music_dj">Music & DJ</option>
            <option value="cake_bakery">Bakery</option>
            <option value="rentals">Rentals</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingVendor(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE5D8] p-12 text-center shadow-xs">
          <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-serif-title text-base font-bold text-stone-800">No vendors found</h3>
          <p className="text-xs text-stone-500 mt-1">
            Add florists, caterers, musicians, and venue coordinators to your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => {
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-3xl border border-[#EFE5D8] p-5 shadow-xs hover:shadow-md hover:border-rose-200 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-2 rounded-2xl bg-stone-50 border border-stone-100">
                        {CATEGORY_ICONS[vendor.category] || '🏷️'}
                      </span>
                      <div>
                        <h4 className="font-serif-title text-base font-bold text-stone-900 group-hover:text-rose-600 transition">
                          {vendor.name}
                        </h4>
                        <span className="text-[10px] uppercase font-semibold text-stone-400 capitalize">
                          {vendor.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                        vendor.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : vendor.status === 'booked'
                          ? 'bg-rose-100 text-rose-800'
                          : vendor.status === 'contacted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {vendor.status}
                    </span>
                  </div>

                  {vendor.contactPerson && (
                    <div className="text-xs text-stone-700 font-medium mb-3">
                      Contact: <span className="font-semibold text-stone-900">{vendor.contactPerson}</span>
                    </div>
                  )}

                  {/* Contact Info Pills */}
                  <div className="space-y-1.5 text-xs text-stone-600 mb-4">
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 hover:underline truncate inline-flex items-center gap-1"
                        >
                          Website <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {vendor.notes && (
                    <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-4">
                      "{vendor.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Quoted Cost
                    </span>
                    <span className="text-sm font-bold text-stone-900 font-mono">
                      ${vendor.costQuote.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingVendor(vendor);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVendor(null);
        }}
        onSave={handleSaveVendor}
        initialVendor={editingVendor}
      />
    </div>
  );
};
