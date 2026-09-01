import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import SearchBar from './SearchBar';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import ConfirmDialog from './ConfirmDialog';
import ErrorMessage from './ErrorMessage';
import { asArray, getApiMessage, money } from '../../utils/data';

export default function ResourcePage({ title, description, service, fields, createPath, singular }) {
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[confirm,setConfirm]=useState(null); const navigate=useNavigate();
 const load=async()=>{setLoading(true);setError('');try{setRows(asArray((await service.list()).data));}catch(e){setError(getApiMessage(e));}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const filtered=useMemo(()=>rows.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),[rows,query]);
 const columns=[...fields.map(field=>({key:field,label:field.replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase()),render:row=>field==='status'?<StatusBadge value={row[field]}/>:['buying_price','selling_price','price','amount'].includes(field)?money(row[field]):(row[field]??'—')})),{key:'actions',label:'Actions',render:row=><div className="row-actions"><button className="btn btn--ghost btn--sm" onClick={()=>navigate(`${createPath}/${row.id}`)}>View</button><button className="btn btn--ghost btn--sm" onClick={()=>navigate(`${createPath}/${row.id}/edit`)}>Edit</button><button className="btn btn--danger btn--sm" onClick={()=>setConfirm(row)}>Delete</button></div>}];
 const remove=async()=>{try{await service.remove(confirm.id);setConfirm(null);load();}catch(e){setError(getApiMessage(e));setConfirm(null);}};
 return <><PageHeader title={title} description={description} action={<button className="btn btn--primary" onClick={()=>navigate(`${createPath}/new`)}>+ Add {singular}</button>}/><div className="toolbar"><SearchBar value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}...`}/></div>{error&&<ErrorMessage message={error} onRetry={load}/>}<DataTable columns={columns} rows={filtered} loading={loading}/><ConfirmDialog open={Boolean(confirm)} title="Delete record?" message="The backend remains authoritative and may reject deletion when the record is protected." confirmLabel="Delete" danger onCancel={()=>setConfirm(null)} onConfirm={remove}/></>;
}
