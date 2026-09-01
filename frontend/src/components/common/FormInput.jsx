export default function FormInput({ label, name, value, onChange, type='text', required=false, min, max, step, placeholder }) {
  return <label className="form-field"><span>{label}{required && ' *'}</span><input name={name} type={type} value={value ?? ''} onChange={onChange} required={required} min={min} max={max} step={step} placeholder={placeholder}/></label>;
}
