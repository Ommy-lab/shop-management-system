import ReportView from '../../components/common/ReportView';
import { money } from '../../utils/data';

export default function DebtReport() {
  return (
    <ReportView
      title="Debt report"
      description="Outstanding customer credit summarized by truck for the selected period."
      method="debts"
      dataKey="report"
      columns={[
        {
          key: 'truck_name',
          label: 'Truck',
        },
        {
          key: 'outstanding_sales',
          label: 'Outstanding sales',
        },
        {
          key: 'outstanding_debt',
          label: 'Outstanding debt',
          render: money,
        },
      ]}
    />
  );
}