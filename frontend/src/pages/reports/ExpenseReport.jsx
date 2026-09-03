import ReportView from '../../components/common/ReportView';
import { money } from '../../utils/data';

export default function ExpenseReport() {
  return (
    <ReportView
      title="Expense report"
      description="Operating expenses summarized by truck for the selected period."
      method="expenses"
      dataKey="report"
      columns={[
        {
          key: 'truck_name',
          label: 'Truck',
        },
        {
          key: 'expense_count',
          label: 'Expense count',
        },
        {
          key: 'total_expenses',
          label: 'Total expenses',
          render: money,
        },
      ]}
    />
  );
}
