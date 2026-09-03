import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from './DataTable';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import PageHeader from './PageHeader';
import SearchBar from './SearchBar';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/data';

export default function EntityList({ title, description, eyebrow, service, dataKey, columns, searchFields, addTo, detailBase, canDelete = false }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [target, setTarget] = useState(null); const [removing, setRemoving] = useState(false); const { notify } = useToast();
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await service.list(); const body = response.data?.data ?? response.data; const result = Array.isArray(body) ? body : body?.[dataKey] || body?.items || body?.rows || []; setRows(result); } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); } }, [service, dataKey]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => rows.filter((row) => searchFields.some((field) => String(row[field] ?? '').toLowerCase().includes(query.toLowerCase()))), [rows, query, searchFields]);
  const actionColumn = { key: 'actions', label: 'Actions', render: (_, row) => <div className="table-actions">{detailBase && <Link className="btn btn--small btn--outline" to={`${detailBase}/${row.id}`}>View</Link>}{detailBase && service.update && <Link className="btn btn--small btn--ghost" to={`${detailBase}/${row.id}/edit`}>Edit</Link>}{canDelete && service.remove && <button className="btn btn--small btn--danger-ghost" onClick={() => setTarget(row)}>Deactivate</button>}</div> };
  const remove = async () => { setRemoving(true); try { await service.remove(target.id); setRows((items) => items.filter((item) => item.id !== target.id)); notify(`${title.slice(0, -1)} updated successfully.`, 'success'); setTarget(null); } catch (err) { notify(errorMessage(err), 'error'); } finally { setRemoving(false); } };
  return <><PageHeader eyebrow={eyebrow} title={title} description={description} actionTo={addTo} actionLabel={`Add ${title.slice(0, -1)}`}/><div className="panel"><div className="toolbar"><SearchBar value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}…`}/><span className="record-count">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span></div>{loading ? <LoadingSpinner label={`Loading ${title.toLowerCase()}…`}/> : error ? <ErrorMessage message={error} onRetry={load}/> : <DataTable columns={[...columns, actionColumn]} rows={filtered} emptyTitle={`No ${title.toLowerCase()} found`} emptyAction={addTo ? <Link className="btn btn--primary" to={addTo}>Add first record</Link> : null}/>}</div><ConfirmDialog open={Boolean(target)} title={`Deactivate ${title.slice(0, -1)}`} message={`Are you sure you want to deactivate ${target?.name || 'this record'}?`} confirmLabel="Deactivate" danger loading={removing} onClose={() => setTarget(null)} onConfirm={remove}/></>;
}
