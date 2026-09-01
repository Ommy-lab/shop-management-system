import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import LineItems from '../../components/common/LineItems';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import ErrorMessage from '../../components/common/ErrorMessage';
import service from '../../services/saleService';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import { asArray, getApiMessage } from '../../utils/data';

export default function SaleForm() {
  const nav = useNavigate(); const [customers,setCustomers]=useState([]); const [products,setProducts]=useState([]);
  const [head,setHead]=useState({customer_id:'',date:'',notes:''}); const [items,setItems]=useState([{product_id:'',quantity:1,price:''}]); const[e,setE]=useState('');const[s,setS]=useState(false);
  useEffect(()=>{Promise.all([customerService.listMine(),productService.list()]).then(([c,p])=>{setCustomers(asArray(c.data));setProducts(asArray(p.data))}).catch(x=>setE(getApiMessage(x,'Unable to load customers and products.')))},[]);
  const change=x=>setHead(v=>({...v,[x.target.name]:x.target.value}));const total=items.reduce((a,x)=>a+(Number(x.quantity)||0)*(Number(x.price)||0),0);const update=(i,k,v)=>setItems(cur=>cur.map((x,n)=>n===i?{...x,[k]:v}:x));
  const submit=async x=>{x.preventDefault();if(!head.customer_id||!head.date||!items.length||items.some(i=>!i.product_id||Number(i.quantity)<=0||Number(i.price)<0)){setE('Please complete the customer, date and sale item fields.');return}setS(true);try{await service.create({...head,items:items.map(i=>({...i,quantity:Number(i.quantity),price:Number(i.price)}))});nav('/sales')}catch(x){setE(getApiMessage(x))}finally{setS(false)}};
  return <><PageHeader title="Create Sale"/><form className="form-card" onSubmit={submit}><FormSelect label="Customer" name="customer_id" value={head.customer_id} onChange={change} options={customers.map(c=>({value:c.id,label:c.name||c.business_name||`Customer #${c.id}`}))} required/><FormInput label="Sale Date" name="date" type="date" value={head.date} onChange={change} required/><LineItems items={items} setItems={setItems} priceLabel="Selling Price" products={products} onItemChange={update}/><div className="total-box">Total <strong>{total.toLocaleString()}</strong></div><label className="form-field"><span>Notes</span><textarea name="notes" value={head.notes} onChange={change}/></label>{e&&<ErrorMessage message={e}/>}<div className="form-actions"><button type="button" className="btn btn--secondary" onClick={()=>nav('/sales')}>Cancel</button><button className="btn btn--primary" disabled={s}>{s?'Saving...':'Create Sale'}</button></div></form></>;
}
