import { useMemo } from "react";
import type { EmploymentType, ExperienceLevel, JobFilterOptions, JobSearchFilters, JobSource, WorkMode } from "@believe-ai/shared";
import { DATE_POSTED_OPTIONS, EXPERIENCE_LEVELS, WORK_MODES } from "@believe-ai/shared";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Chip } from "../../components/ui/Chip.js";
import { EMPLOYMENT_LABELS, EXPERIENCE_LABELS, WORK_MODE_LABELS } from "./jobDisplay.js";
import { FilterSection } from "./FilterSection.js";

const SOURCE_LABELS: Record<JobSource, string> = { internal: "believe.ai", jsearch: "External" };

// Job data only yields states that already have a posting — for India specifically, the full
// state/UT list is shown regardless, so the filter is browsable before any listing exists there.
const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];
// Real-world country values are inconsistent — JSearch returns ISO codes ("IN"), manually
// posted jobs tend to use the full name ("India") — so both are treated as the same country.
const INDIA_ALIASES = new Set(["india", "in"]);

export interface JobFiltersProps {
  qInput: string;
  onQInputChange: (v: string) => void;
  salaryMinInput: string;
  onSalaryMinInputChange: (v: string) => void;
  filters: JobSearchFilters;
  filterOptions: JobFilterOptions | undefined;
  onSetFilter: <K extends keyof JobSearchFilters>(key: K, value: JobSearchFilters[K]) => void;
  onSetCountry: (v: string) => void;
  onSetState: (v: string) => void;
  onSetCity: (v: string) => void;
  onReset: () => void;
}

export function JobFilters({
  qInput,
  onQInputChange,
  salaryMinInput,
  onSalaryMinInputChange,
  filters,
  filterOptions,
  onSetFilter,
  onSetCountry,
  onSetState,
  onSetCity,
  onReset,
}: JobFiltersProps) {
  const locationOptions = useMemo(() => filterOptions?.locationOptions ?? [], [filterOptions]);
  const countries = useMemo(
    () => Array.from(new Set([...locationOptions.map((o) => o.country).filter((c): c is string => !!c), "India"])).sort(),
    [locationOptions],
  );
  const states = useMemo(() => {
    const fromData = locationOptions
      .filter((o) => !filters.country || o.country === filters.country)
      .map((o) => o.state)
      .filter((s): s is string => !!s);
    const extra = filters.country && INDIA_ALIASES.has(filters.country.toLowerCase()) ? INDIA_STATES : [];
    return Array.from(new Set([...fromData, ...extra])).sort();
  }, [locationOptions, filters.country]);
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          locationOptions
            .filter((o) => (!filters.country || o.country === filters.country) && (!filters.state || o.state === filters.state))
            .map((o) => o.city)
            .filter((c): c is string => !!c),
        ),
      ).sort(),
    [locationOptions, filters.country, filters.state],
  );

  const selectedSkillCount = filters.skill ? 1 : 0;
  const selectedCompanyCount = filters.company ? 1 : 0;
  const selectedDateCount = filters.datePosted && filters.datePosted !== "any" ? 1 : 0;
  const selectedSalaryCount = filters.salaryMin ? 1 : 0;

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Filters</h2>
        <button type="button" onClick={onReset} className="text-caption font-medium text-accent hover:underline">
          Reset
        </button>
      </div>

      <Input placeholder="Search location…" value={qInput} onChange={(e) => onQInputChange(e.target.value)} className="mb-3" />

      <FilterSection label="Location" defaultOpen>
        <div className="space-y-2">
          <Select value={filters.country ?? ""} onChange={(e) => onSetCountry(e.target.value)}>
            <option value="">Any country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {states.length > 0 && (
            <Select value={filters.state ?? ""} onChange={(e) => onSetState(e.target.value)}>
              <option value="">Any state</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
          {cities.length > 0 && (
            <Select value={filters.city ?? ""} onChange={(e) => onSetCity(e.target.value)}>
              <option value="">Any city</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </div>
        <ChipGroup
          value={filters.workMode}
          options={WORK_MODES.map((m) => [m, WORK_MODE_LABELS[m]] as [WorkMode, string])}
          onSelect={(v) => onSetFilter("workMode", v)}
        />
      </FilterSection>

      <FilterSection label="Job type" defaultOpen>
        <ChipGroup
          value={filters.employmentType}
          options={Object.entries(EMPLOYMENT_LABELS) as [EmploymentType, string][]}
          onSelect={(v) => onSetFilter("employmentType", v)}
        />
      </FilterSection>

      <FilterSection label="Experience" defaultOpen>
        <ChipGroup
          value={filters.experienceLevel}
          options={EXPERIENCE_LEVELS.map((l) => [l, EXPERIENCE_LABELS[l]] as [ExperienceLevel, string])}
          onSelect={(v) => onSetFilter("experienceLevel", v)}
        />
      </FilterSection>

      <FilterSection label="Salary" count={selectedSalaryCount}>
        <label className="block space-y-1.5 text-xs font-medium text-fg-muted">
          Minimum salary
          <Input
            type="number"
            min={0}
            placeholder="e.g. 50000"
            value={salaryMinInput}
            onChange={(e) => onSalaryMinInputChange(e.target.value)}
          />
        </label>
      </FilterSection>

      <FilterSection label="Company" count={selectedCompanyCount}>
        {filterOptions && filterOptions.companies.length > 0 ? (
          <Select value={filters.company ?? ""} onChange={(e) => onSetFilter("company", e.target.value || undefined)}>
            <option value="">Any company</option>
            {filterOptions.companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-caption text-fg-subtle">No companies to filter by yet.</p>
        )}
      </FilterSection>

      <FilterSection label="Skills" count={selectedSkillCount}>
        {filterOptions && filterOptions.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.skills.slice(0, 16).map((skill) => (
              <Chip key={skill} selected={filters.skill === skill} onClick={() => onSetFilter("skill", skill)}>
                {skill}
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-caption text-fg-subtle">No skills to filter by yet.</p>
        )}
      </FilterSection>

      <FilterSection label="Date posted" count={selectedDateCount}>
        <Select
          value={filters.datePosted ?? "any"}
          onChange={(e) => onSetFilter("datePosted", e.target.value === "any" ? undefined : (e.target.value as JobSearchFilters["datePosted"]))}
        >
          {DATE_POSTED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection label="Job source">
        <ChipGroup
          value={filters.source}
          options={Object.entries(SOURCE_LABELS) as [JobSource, string][]}
          onSelect={(v) => onSetFilter("source", v)}
        />
      </FilterSection>
    </div>
  );
}

function ChipGroup<T extends string>({
  value,
  options,
  onSelect,
}: {
  value: T | undefined;
  options: [T, string][];
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, l]) => (
        <Chip key={v} selected={value === v} onClick={() => onSelect(v)}>
          {l}
        </Chip>
      ))}
    </div>
  );
}
