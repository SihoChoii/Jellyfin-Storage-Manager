import type { SortDirection, SortField } from '../types'

interface SortDropdownProps {
  value: SortField
  direction: SortDirection
  onChange: (field: SortField) => void
  onDirectionChange: (direction: SortDirection) => void
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'size', label: 'Size' },
  { value: 'date', label: 'Date' },
  { value: 'seasons', label: 'Seasons' },
  { value: 'episodes', label: 'Episodes' },
]

export default function SortDropdown({
  value,
  direction,
  onChange,
  onDirectionChange,
}: SortDropdownProps) {
  return (
    <div className="sort-controls">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortField)}
        className="sort-select"
        aria-label="Sort by"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onDirectionChange(direction === 'asc' ? 'desc' : 'asc')}
        className="sort-direction-btn"
        aria-label={`Sort direction: ${direction === 'asc' ? 'ascending' : 'descending'}`}
        title={direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
      >
        {direction === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  )
}
