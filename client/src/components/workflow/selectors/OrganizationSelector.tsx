import React, { useState, useEffect, useMemo } from "react";

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  orgType: string;
  allowedRoles?: string[];
  lifecycleStatus?: string;
}

interface OrganizationSelectorProps {
  organizations: OrganizationItem[];
  selectedOrg: OrganizationItem | null;
  onSelectOrg: (org: OrganizationItem) => void;
  onProceed: () => void;
  loading?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations,
  selectedOrg,
  onSelectOrg,
  onProceed,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "All Entities" },
    { id: "COLLEGE", label: "Colleges / Unis" },
    { id: "CLUB", label: "Clubs & Guilds" },
    { id: "RESEARCH_INSTITUTION", label: "Research Labs" },
    { id: "INCUBATOR", label: "Incubators" },
    { id: "CORPORATE", label: "Corporates" },
  ];

  const handleOrgClick = (org: OrganizationItem) => {
    onSelectOrg(org);
  };

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    return organizations.filter((o) => {
      const matchQuery =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q) ||
        o.orgType.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === "ALL" || o.orgType?.toUpperCase() === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [organizations, debouncedQuery, selectedCategory]);

  return (
    <div className="space-y-5">
      <div className="p-4 bg-[#FFDD33]/20 border-2 border-dashed border-[#121316]">
        <h2 className="text-xs font-headline font-black text-[#0F534A] uppercase tracking-wider mb-1">
          Step 1: Choose Your Organization or Club
        </h2>
        <p className="text-xs font-medium text-gray-600">
          Search and pick from existing registered institutions (Colleges, Clubs, Research Labs, Corporates, Incubators) to join with an allowable role.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isCatActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-[11px] font-headline font-black uppercase tracking-wider whitespace-nowrap border-2 border-[#121316] transition-all cursor-pointer ${
                isCatActive
                  ? "bg-[#FE4E1A] text-white shadow-[2px_2px_0_#121316]"
                  : "bg-white text-gray-700 hover:bg-[#FFDD33]/30"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="🔍 Search organization or club by name, slug, or type..."
        className="w-full px-4 py-3 text-xs font-bold text-[#121316] bg-[#FCFBF7] focus:outline-none border-2 border-[#121316] shadow-[3px_3px_0_#FE4E1A]"
      />

      {loading ? (
        <div className="p-8 text-center font-headline font-black text-xs text-[#0F534A]">
          Loading organizations catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white border-2 border-[#121316]">
          <p className="font-headline font-black text-xs text-gray-600 uppercase">
            No institutions or clubs found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto p-1">
          {filtered.map((org) => {
            const isSelected = selectedOrg?.id === org.id;
            const rolesCount = org.allowedRoles?.length || 0;

            const isClub = org.orgType === "CLUB";
            const badgeBg = isClub ? "bg-[#FEB3FC] text-[#4717AE]" : "bg-[#FFDD33] text-[#121316]";

            return (
              <div
                key={org.id}
                onClick={() => handleOrgClick(org)}
                className={`p-4 cursor-pointer flex flex-col justify-between gap-3 transition-all border-2 ${
                  isSelected ? "bg-[#FFDD33]/20 border-[#121316] shadow-[4px_4px_0_#121316]" : "bg-white border-gray-300 hover:border-[#121316] hover:shadow-[2px_2px_0_#121316]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-headline font-black uppercase border border-[#121316] ${badgeBg}`}>
                      {org.orgType?.replace(/_/g, " ")}
                    </span>
                    <h3 className="font-headline font-black text-xs text-[#0F534A] uppercase tracking-wide mt-1.5 line-clamp-2">
                      {org.name}
                    </h3>
                  </div>
                  <div
                    className={`w-6 h-6 flex items-center justify-center text-xs font-headline font-black shrink-0 border-2 border-[#121316] ${
                      isSelected ? "bg-[#FE4E1A] text-white" : "bg-white text-gray-400"
                    }`}
                  >
                    {isSelected ? "✓" : "+"}
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-gray-200 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-gray-600">
                    {rolesCount} allowable {rolesCount === 1 ? "role" : "roles"}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {org.allowedRoles?.slice(0, 2).map((r) => (
                      <span key={r} className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-[9px] font-bold text-gray-700">
                        {r.replace(/_/g, " ")}
                      </span>
                    ))}
                    {rolesCount > 2 && (
                      <span className="text-[9px] font-bold text-gray-500">
                        +{rolesCount - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          onClick={onProceed}
          disabled={!selectedOrg}
          className={`px-7 py-3 font-headline font-black text-white uppercase tracking-wider text-xs transition-all border-2 border-[#121316] cursor-pointer ${
            selectedOrg ? "bg-[#FE4E1A] hover:bg-[#0F534A] shadow-[3px_3px_0_#121316]" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Proceed to Role Selection →
        </button>
      </div>
    </div>
  );
};
