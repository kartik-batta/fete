import React, { useState } from 'react';
import { EventData, Expense, ExpenseCategory, Vendor, VendorCategory } from '../../types';
import { Briefcase, Check, Edit2, ExternalLink, Globe, Mail, Phone, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { VendorModal } from '../modals/VendorModal';
import { triggerMiniConfetti } from '../../utils/confetti';
import { IconButton } from '../ui/IconButton';
import { LiveRegion, useAnnouncer } from '../ui/LiveRegion';
import { toSafeHttpUrl } from '../ui/form';

interface VendorsTabProps {
  event: EventData;
  onUpdateEvent: (updated: EventData) => void;
}

const CATEGORY_META: Record<VendorCategory, { icon: string; label: string; expense: ExpenseCategory }> = {
  venue: { icon: '🏛️', label: 'Venue', expense: 'venue' },
  catering: { icon: '🍷', label: 'Catering & Bar', expense: 'catering' },
  photography: { icon: '📸', label: 'Photography', expense: 'photo' },
  florist: { icon: '💐', label: 'Florals', expense: 'decor' },
  music_dj: { icon: '🎵', label: 'Music & DJ', expense: 'entertainment' },
  cake_bakery: { icon: '🎂', label: 'Bakery', expense: 'catering' },
  rentals: { icon: '🪑', label: 'Rentals', expense: 'decor' },
  decor: { icon: '✨', label: 'Styling & Lighting', expense: 'decor' },
  entertainment: { icon: '🎭', label: 'Entertainment', expense: 'entertainment' },
  other: { icon: '🏷️', label: 'Other', expense: 'other' },
};

const STATUS_BADGE: Record<Vendor['status'], string> = {
  paid: 'bg-emerald-100 text-emerald-900',
  booked: 'bg-rose-100 text-rose-900',
  contacted: 'bg-amber-100 text-amber-900',
  researching: 'bg-stone-100 text-stone-800',
};

const normalize = (s: string) => s.trim().toLowerCase();

/** Builds a planned budget line from a booked vendor's quote. */
function expenseFromVendor(vendor: Vendor, id = `exp-${Date.now()}`): Expense {
  return {
    id,
    name: vendor.name,
    category: CATEGORY_META[vendor.category]?.expense ?? 'other',
    budgeted: vendor.costQuote || 0,
    actual: 0,
    status: 'planned',
    vendorName: vendor.name,
    notes: 'Added from vendor quote',
  };
}

export const VendorsTab: React.FC<VendorsTabProps> = ({ event, onUpdateEvent }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const { message, announce } = useAnnouncer();

  const query = normalize(search);
  const filteredVendors = event.vendors.filter(
    (v) =>
      (!query || [v.name, v.contactPerson, v.notes].some((f) => f?.toLowerCase().includes(query))) &&
      (filterCategory === 'all' || v.category === filterCategory),
  );

  const totalCommittedQuotes = event.vendors.reduce((acc, v) => acc + (v.costQuote || 0), 0);
  const bookedCount = event.vendors.filter((v) => v.status === 'booked' || v.status === 'paid').length;
  const budgetedVendorNames = new Set(event.expenses.map((e) => normalize(e.vendorName ?? '')).filter(Boolean));

  const handleSaveVendor = (vendor: Vendor) => {
    if (editingVendor) {
      onUpdateEvent({ ...event, vendors: event.vendors.map((v) => (v.id === vendor.id ? vendor : v)) });
      announce(`Updated ${vendor.name}.`);
    } else {
      onUpdateEvent({ ...event, vendors: [...event.vendors, vendor] });
      triggerMiniConfetti(0.5, 0.5);
      announce(`Added vendor ${vendor.name}.`);
    }
    setEditingVendor(null);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    if (window.confirm(`Delete the vendor record for ${vendor.name}?`)) {
      onUpdateEvent({ ...event, vendors: event.vendors.filter((v) => v.id !== vendor.id) });
      announce(`Deleted vendor ${vendor.name}.`);
    }
  };

  const handleAddToBudget = (vendor: Vendor) => {
    onUpdateEvent({ ...event, expenses: [...event.expenses, expenseFromVendor(vendor)] });
    announce(`Added ${vendor.name}'s $${vendor.costQuote.toLocaleString()} quote to the budget.`);
  };

  const metrics = [
    { label: 'Total Vendors', value: event.vendors.length, note: 'Partners & service providers', box: 'bg-white border-[#EFE5D8]', head: 'text-stone-700', num: 'text-stone-900', sub: 'text-stone-600' },
    { label: 'Confirmed / Booked', value: bookedCount, note: 'Contract secured', box: 'bg-emerald-50/50 border-emerald-100', head: 'text-emerald-900', num: 'text-emerald-800', sub: 'text-emerald-800' },
    { label: 'Total Quoted Value', value: `$${totalCommittedQuotes.toLocaleString()}`, note: 'Sum of vendor estimates', box: 'bg-amber-50/50 border-amber-100', head: 'text-amber-900', num: 'text-amber-900', sub: 'text-amber-800' },
  ];

  return (
    <div className="space-y-6">
      <LiveRegion message={message} />

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Vendor summary">
        {metrics.map((m) => (
          <li key={m.label} className={`p-5 rounded-3xl border shadow-xs ${m.box}`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${m.head}`}>{m.label}</span>
            <div className={`text-3xl font-bold ${m.num}`}>{m.value}</div>
            <p className={`text-[11px] mt-0.5 ${m.sub}`}>{m.note}</p>
          </li>
        ))}
      </ul>

      <div
        role="search"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EFE5D8] shadow-xs"
      >
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search vendors"
              placeholder="Search vendor name, contact, notes..."
              maxLength={100}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            />
          </div>

          <select
            aria-label="Filter by vendor type"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-2 px-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
          >
            <option value="all">All Vendor Types</option>
            {(Object.keys(CATEGORY_META) as VendorCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingVendor(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Vendor</span>
        </button>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE5D8] p-12 text-center shadow-xs">
          <Briefcase className="w-10 h-10 text-stone-400 mx-auto mb-2" aria-hidden="true" />
          <h3 className="font-serif-title text-base font-bold text-stone-800">No vendors found</h3>
          <p className="text-xs text-stone-600 mt-1">Add florists, caterers, musicians, and venue coordinators to your team.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Vendors">
          {filteredVendors.map((vendor) => {
            const meta = CATEGORY_META[vendor.category] ?? CATEGORY_META.other;
            // Only http(s) links are ever rendered, guarding against javascript: URLs in stored data.
            const safeWebsite = vendor.website ? toSafeHttpUrl(vendor.website) : null;
            const isCommitted = vendor.status === 'booked' || vendor.status === 'paid';
            const inBudget = budgetedVendorNames.has(normalize(vendor.name));

            return (
              <li
                key={vendor.id}
                className="bg-white rounded-3xl border border-[#EFE5D8] p-5 shadow-xs hover:shadow-md hover:border-rose-200 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-2 rounded-2xl bg-stone-50 border border-stone-100" aria-hidden="true">
                        {meta.icon}
                      </span>
                      <div>
                        <h3 className="font-serif-title text-base font-bold text-stone-900 group-hover:text-rose-700 transition">
                          {vendor.name}
                        </h3>
                        <span className="text-[10px] uppercase font-semibold text-stone-600">{meta.label}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[vendor.status]}`}>
                      <span className="sr-only">Status: </span>
                      {vendor.status}
                    </span>
                  </div>

                  {vendor.contactPerson && (
                    <p className="text-xs text-stone-700 font-medium mb-3">
                      Contact: <span className="font-semibold text-stone-900">{vendor.contactPerson}</span>
                    </p>
                  )}

                  <ul className="space-y-1.5 text-xs text-stone-700 mb-4">
                    {vendor.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" aria-hidden="true" />
                        <a href={`tel:${vendor.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                          <span className="sr-only">Phone: </span>
                          {vendor.phone}
                        </a>
                      </li>
                    )}
                    {vendor.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" aria-hidden="true" />
                        <a href={`mailto:${encodeURIComponent(vendor.email)}`} className="truncate hover:underline">
                          <span className="sr-only">Email: </span>
                          {vendor.email}
                        </a>
                      </li>
                    )}
                    {safeWebsite && (
                      <li className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" aria-hidden="true" />
                        <a
                          href={safeWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose-700 hover:underline truncate inline-flex items-center gap-1"
                        >
                          Website<span className="sr-only"> for {vendor.name} (opens in a new tab)</span>
                          <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                        </a>
                      </li>
                    )}
                  </ul>

                  {vendor.notes && (
                    <p className="text-[11px] text-stone-700 italic bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-4">
                      “{vendor.notes}”
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-600 uppercase font-semibold block">Quoted Cost</span>
                      <span className="text-sm font-bold text-stone-900 font-mono">${vendor.costQuote.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Edit ${vendor.name}`}
                        icon={Edit2}
                        onClick={() => {
                          setEditingVendor(vendor);
                          setIsModalOpen(true);
                        }}
                      />
                      <IconButton
                        label={`Delete ${vendor.name}`}
                        icon={Trash2}
                        tone="danger"
                        onClick={() => handleDeleteVendor(vendor)}
                      />
                    </div>
                  </div>

                  {isCommitted &&
                    (inBudget ? (
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        In budget
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToBudget(vendor)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold transition"
                      >
                        <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                        Add quote to budget<span className="sr-only"> for {vendor.name}</span>
                      </button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
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
