export default function SearchBar({ value, onChange, placeholder='Search...' }) {
  return <label className="search-bar"><span className="sr-only">Search</span><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/></label>;
}
