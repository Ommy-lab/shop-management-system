export default function DataTable({ rows=[], columns=[], loading=false, emptyMessage='No records found.' }) {
  if (loading) return <div className="table-state">Loading...</div>;
  if (!rows.length) return <div className="empty-state"><h3>{emptyMessage}</h3></div>;
  return <div className="table-wrap"><table className="data-table"><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id ?? index}>{columns.map(column=><td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>;
}
