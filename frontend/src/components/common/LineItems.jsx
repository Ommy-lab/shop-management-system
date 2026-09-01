export default function LineItems({ items, setItems, priceLabel = 'Price', products = [], onItemChange }) {
  const update = (index, key, value) => {
    if (onItemChange) onItemChange(index, key, value);
    else setItems(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };
  const add = () => setItems([...items, { product_id: '', quantity: 1, price: '' }]);
  const remove = (index) => setItems(items.filter((_, i) => i !== index));
  return <div className="line-items"><div className="line-items__head"><h3>Items</h3><button type="button" className="btn btn--secondary btn--sm" onClick={add}>+ Add item</button></div>
    {items.map((item, index) => <div className="line-item" key={index}>
      {products.length ? <select value={item.product_id} onChange={(e)=>update(index,'product_id',e.target.value)}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name||p.sku||`Product #${p.id}`}</option>)}</select> : <input placeholder="Product ID" value={item.product_id} onChange={(e)=>update(index,'product_id',e.target.value)}/>} 
      <input type="number" min="1" placeholder="Quantity" value={item.quantity} onChange={(e)=>update(index,'quantity',e.target.value)}/><input type="number" min="0" placeholder={priceLabel} value={item.price} onChange={(e)=>update(index,'price',e.target.value)}/><strong>{((Number(item.quantity)||0)*(Number(item.price)||0)).toLocaleString()}</strong>{items.length>1&&<button type="button" className="btn btn--danger btn--sm" onClick={()=>remove(index)}>Remove</button>}
    </div>)}
  </div>;
}
