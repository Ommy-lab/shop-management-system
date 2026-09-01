import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ErrorMessage from '../../components/common/ErrorMessage';
import { userService } from '../../services/userService';
import { asArray, getApiMessage } from '../../utils/data';

export default function Users() {
  const [users,setUsers]=useState([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const nav=useNavigate();
  const load=async()=>{setLoading(true);try{setUsers(asArray((await userService.list()).data))}catch(e){setError(getApiMessage(e))}finally{setLoading(false)}};useEffect(()=>{load()},[]);
  const columns=[{key:'id',label:'ID'},{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'role',label:'Role'},{key:'status',label:'Status',render:r=><StatusBadge value={r.status}/>},{key:'truck_id',label:'Truck'},{key:'actions',label:'Actions',render:r=>{const protectedUser=r.role==='SUPER_ADMIN';return <div className="row-actions"><button className="btn btn--ghost btn--sm" onClick={()=>nav(`/admin/users/${r.id}`)}>View</button>{!protectedUser&&<button className="btn btn--ghost btn--sm" onClick={()=>nav(`/admin/users/${r.id}/edit`)}>Edit</button>} {!protectedUser&&<><button className="btn btn--ghost btn--sm" onClick={()=>nav(`/admin/users/${r.id}/reset-password`)}>Reset Password</button><button className="btn btn--ghost btn--sm" onClick={()=>nav(`/admin/users/${r.id}/assign-truck`)}>Assign Truck</button></>}</div>}}];
  return <><PageHeader title="Users" description="Manage users without exposing the protected SUPER_ADMIN account." action={<button className="btn btn--primary" onClick={()=>nav('/admin/users/new')}>+ Add User</button>}/>{error&&<ErrorMessage message={error} onRetry={load}/>}<DataTable rows={users} loading={loading} columns={columns}/></>;
}
