import FormSelect from './FormSelect';
import FormInput from './FormInput';
import { money } from '../../utils/data';

export default function DynamicItems({ items, products, onChange, showPrice = true, inventory = [], label = 'Products' }) {
  const add = () => onChange([...items, { product_id: '', quantity: 1, unit_price: '' }]);
  const update = (index, field, value) => onChange(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const available = (productId) => inventory.find((row) => String(row.product_id || row.product?.id || row.id) === String(productId))?.quantity;
  return <fieldset className="items-editor"><legend>{label}</legend>{items.map((item, index) => <div className="item-row" key={index}><FormSelect label="Product" value={item.product_id} onChange={(e) => update(index, 'product_id', e.target.value)} options={products.map((p) => ({ value: p.id, label: `${p.name}${available(p.id) !== undefined ? ` — ${available(p.id)} available` : ''}` }))} required/><FormInput label="Quantity" type="number" min="1" value={item.quantity} onChange={(e) => update(index, 'quantity', e.target.value)} required/>{showPrice && <FormInput label="Unit price" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => update(index, 'unit_price', e.target.value)} required/>}<div className="item-row__subtotal"><small>Subtotal</small><strong>{showPrice ? money(Number(item.quantity) * Number(item.unit_price)) : `${item.quantity || 0} units`}</strong></div><button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(index)} aria-label="Remove item">×</button></div>)}<button type="button" className="btn btn--outline" onClick={add}>＋ Add product</button></fieldset>;
}
