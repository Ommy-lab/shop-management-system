export default function FormSelect({ label, name, value, onChange, options=[], required=false }) {
  return <label className="form-field"><span>{label}{required && ' *'}</span><select name={name} value={value ?? ''} onChange={onChange} required={required}><option value="">Select...</option>{options.map(option => <option key={option} value={option}>{String(option).replaceAll('_',' ')}</option>)}</select></label>;
}
