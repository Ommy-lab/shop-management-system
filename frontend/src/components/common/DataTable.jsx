import EmptyState from './EmptyState';
export default function DataTable({ columns, rows, keyField = 'id', emptyTitle, emptyAction }) {
  if (!rows?.length) return <EmptyState title={emptyTitle} action={emptyAction}/>;
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[keyField] ?? index}>{columns.map((column) => <td key={column.key} data-label={column.label}>{column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>;
}
