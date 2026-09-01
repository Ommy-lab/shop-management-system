import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LineItems from '../../components/common/LineItems';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import ErrorMessage from '../../components/common/ErrorMessage';
import service from '../../services/purchaseService';
import productService from '../../services/productService';
import supplierService from '../../services/supplierService';
import { asArray, getApiMessage } from '../../utils/data';

export default function PurchaseForm() {
  const nav = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [head, setHead] = useState({ supplier_id: '', purchase_date: '', notes: '', payment_status: 'UNPAID' });
  const [items, setItems] = useState([{ product_id: '', quantity: 1, price: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([supplierService.list(), productService.list()])
      .then(([supplierResponse, productResponse]) => {
        setSuppliers(asArray(supplierResponse.data));
        setProducts(asArray(productResponse.data));
      })
      .catch((err) => setError(getApiMessage(err, 'Unable to load suppliers and products.')));
  }, []);

  const change = (event) => setHead((value) => ({ ...value, [event.target.name]: event.target.value }));
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const updateItem = (index, key, value) => setItems((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item));

  const submit = async (event) => {
    event.preventDefault();
    if (!head.supplier_id || !head.purchase_date || !items.length || items.some((item) => !item.product_id || Number(item.quantity) <= 0 || Number(item.price) < 0)) {
      setError('Please complete the supplier, date and purchase item fields.');
      return;
    }
    setSaving(true); setError('');
    try {
      await service.create({ ...head, items: items.map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) })) });
      nav('/purchases');
    } catch (err) { setError(getApiMessage(err)); } finally { setSaving(false); }
  };

  return <><PageHeader title="Create Purchase"/><form className="form-card" onSubmit={submit}>
    <FormSelect label="Supplier" name="supplier_id" value={head.supplier_id} onChange={change} options={suppliers.map((s) => ({ value: s.id, label: s.name || s.company_name || `Supplier #${s.id}` }))} required/>
    <FormInput label="Purchase Date" name="purchase_date" type="date" value={head.purchase_date} onChange={change} required/>
    <LineItems items={items} setItems={setItems} priceLabel="Buying Price" products={products} onItemChange={updateItem}/>
    <div className="total-box">Total <strong>{total.toLocaleString()}</strong></div>
    <FormSelect label="Payment Status" name="payment_status" value={head.payment_status} onChange={change} options={['PAID','PARTIAL','UNPAID']} required/>
    <label className="form-field"><span>Notes</span><textarea name="notes" value={head.notes} onChange={change}/></label>
    {error && <ErrorMessage message={error}/>}<div className="form-actions"><button type="button" className="btn btn--secondary" onClick={() => nav('/purchases')}>Cancel</button><button className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Create Purchase'}</button></div>
  </form></>;
}
