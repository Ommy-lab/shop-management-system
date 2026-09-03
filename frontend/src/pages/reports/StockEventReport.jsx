import ReportView from '../../components/common/ReportView';

export default function StockEventReport() {
  return (
    <ReportView
      title="Stock event report"
      description="Returns, damaged, lost, and expired inventory summarized for the selected period."
      method="stockEvents"
      dataKey="report"
      columns={[
        {
          key: 'event_type',
          label: 'Event',
        },
        {
          key: 'event_count',
          label: 'Events',
        },
        {
          key: 'total_quantity',
          label: 'Total quantity',
        },
      ]}
    />
  );
}
