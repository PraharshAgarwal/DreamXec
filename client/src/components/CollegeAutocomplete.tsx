import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/apiConfig";

const INDIAN_COLLEGES_API_BASE = `${API_BASE_URL}/colleges`;
const OTHER_COLLEGE_LABEL = "Other";

interface CollegeOption {
  institution_name: string;
  aicte_id?: string;
}

export interface CollegeSelection extends CollegeOption {
  state: string;
}

interface CollegeApiItem {
  institution_name?: string;
  name?: string;
  aicte_id?: string | number;
  id?: string | number;
}

interface StateApiItem {
  name?: string;
  slug?: string;
}

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: CollegeSelection | null) => void;
  error?: boolean | string;
  placeholder?: string;
  className?: string;
}

// Simple fallback icon
const BuildingIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);

export default function CollegeAutocomplete({
  value,
  onChange,
  onSelect,
  error,
  placeholder,
  className = "",
}: CollegeAutocompleteProps) {
  // State API
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState("");

  // Internal Search State
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CollegeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedCollege, setSelectedCollege] = useState<CollegeOption | null>(
    null,
  );

  // Initialize query correctly when mounted with existing value
  // We don't overwrite if user types, but initially if value isn't empty, try to match it
  useEffect(() => {
    if (
      value &&
      value !== selectedCollege?.institution_name
    ) {
      if (value !== query) {
        setQuery(value);
      }
    }
  }, [value, query, selectedCollege]);

  // Fetch States
  useEffect(() => {
    let isMounted = true;
    const loadStates = async () => {
      setStatesLoading(true);
      setStatesError("");
      try {
        const response = await fetch(`${INDIAN_COLLEGES_API_BASE}/states`);
        if (!response.ok) throw new Error(`API failed (${response.status})`);
        const payload: any = await response.json();

        const rawStates: any[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.states)
              ? payload.states
              : [];

        const stateList = rawStates
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") {
              return (item.name || item.slug || "").trim();
            }
            return "";
          })
          .filter(Boolean);

        if (isMounted) setStates(stateList);
      } catch (err: any) {
        if (isMounted) setStatesError(err.message || "Failed to load states");
      } finally {
        if (isMounted) setStatesLoading(false);
      }
    };
    loadStates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Autocomplete fetch
  useEffect(() => {
    if (
      !selectedState ||
      query.trim().length < 3 ||
      query === OTHER_COLLEGE_LABEL
    ) {
      setResults([]);
      setLoading(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({
          state: selectedState,
          q: query.trim(),
          limit: "15",
        });
        const response = await fetch(
          `${INDIAN_COLLEGES_API_BASE}/search?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error(`Search failed (${response.status})`);

        const payload: any = await response.json();
        let rawResults: CollegeApiItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        const normalizedResults: CollegeOption[] = rawResults
          .filter((item) => item.name || item.institution_name)
          .map((item) => ({
            institution_name: (item.name || item.institution_name) as string,
            aicte_id:
              item.id || item.aicte_id
                ? String(item.id || item.aicte_id)
                : undefined,
          }));

        setResults(normalizedResults);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setSearchError(err.message || "Search failed");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selectedState]);

  const errorClass = error
    ? "border-red-600 shadow-[3px_3px_0_#dc2626]"
    : "border-[#003366] shadow-[3px_3px_0_#FF7F00]";

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* State Dropdown */}
      <div className="relative">
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setQuery("");
            onChange("");
            setSelectedCollege(null);
            setResults([]);
            setSearchError("");
            setShowDropdown(false);
            onSelect?.(null);
          }}
          disabled={statesLoading}
          className={`w-full px-3 py-2.5 text-sm font-medium text-[#003366] bg-white focus:outline-none transition-all appearance-none cursor-pointer border-[3px] ${errorClass}`}
        >
          <option value="">
            {statesLoading ? "Loading states..." : "Select College State"}
          </option>
          {states.map((st, i) => (
            <option key={`${st}-${i}`} value={st}>
              {st}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
          ▼
        </div>
      </div>
      {statesError && (
        <p className="text-xs font-bold text-red-600">
          Could not load states: {statesError}
        </p>
      )}

      {/* Autocomplete Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#003366] opacity-60">
          <BuildingIcon className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            setShowDropdown(true);
            if (
              !selectedCollege ||
              nextQuery !== selectedCollege.institution_name
            ) {
              setSelectedCollege(null);
              onChange("");
              onSelect?.(null);
            }
            if (!nextQuery.trim()) {
              setResults([]);
              setSearchError("");
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setShowDropdown(false), 150);
          }}
          placeholder={
            selectedState
              ? placeholder || "Type at least 3 letters to search"
              : "Select state first"
          }
          disabled={!selectedState}
          className={`w-full pl-10 pr-3 py-2.5 text-sm font-medium text-[#003366] bg-white focus:outline-none transition-all border-[3px] ${
            query.length > 0
              ? selectedCollege
                ? "border-[#16a34a] shadow-[3px_3px_0_#16a34a]"
                : "border-[#dc2626] shadow-[3px_3px_0_#dc2626]"
              : errorClass
          }`}
        />

        {/* Dropdown Menu */}
        {showDropdown && selectedState && query.trim().length >= 3 && (
          <div className="absolute left-0 right-0 mt-2 z-50 bg-white max-h-64 overflow-y-auto border-[3px] border-[#003366] shadow-[4px_4px_0_#FF7F00]">
            {loading && (
              <div className="px-3 py-2.5 text-sm font-bold text-[#003366]/70">
                Searching colleges...
              </div>
            )}
            {!loading && searchError && (
              <div className="px-3 py-2.5 text-sm font-bold text-red-600">
                Error: {searchError}
              </div>
            )}
            {!loading && !searchError && results.length === 0 && (
              <div className="px-3 py-2.5 text-sm font-bold text-[#003366]/70">
                No colleges found for this query.
              </div>
            )}
            {!loading &&
              !searchError &&
              results.map((college) => (
                <button
                  key={`${college.aicte_id ?? college.institution_name}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSelectedCollege(college);
                    setQuery(college.institution_name);
                    onChange(college.institution_name);
                    onSelect?.({
                      institution_name: college.institution_name,
                      aicte_id: college.aicte_id,
                      state: selectedState,
                    });
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 border-b border-[#003366]/10 hover:bg-[#FF7F00]/10 transition-colors"
                >
                  <div className="text-sm font-bold text-[#003366]">
                    {college.institution_name}
                  </div>
                  {college.aicte_id && (
                    <div className="text-xs font-semibold text-[#003366]/60">
                      AICTE ID: {college.aicte_id}
                    </div>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
      {selectedState &&
        query.trim().length > 0 &&
        query.trim().length < 3 &&
        query !== OTHER_COLLEGE_LABEL &&
        !selectedCollege && (
          <p className="mt-1.5 text-xs font-bold text-[#003366]/60">
            Type at least 3 characters to search.
          </p>
        )}
    </div>
  );
}
