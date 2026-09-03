import ReportView from '../../components/common/ReportView';
import { money } from '../../utils/data';

export default function SalesReport() {
  return (
    <ReportView
      title="Sales report"
      description="Sales performance summary returned by the backend for the selected period."
      method="salesSummary"
      summary={[
        {
          key: 'total_sales_transactions',
          label: 'Total sales transactions',
        },
        {
          key: 'total_sales_amount',
          label: 'Total sales amount',
          render: money,
        },
        {
          key: 'average_sale_amount',
          label: 'Average sale amount',
          render: money,
        },
        {
          key: 'paid_sales',
          label: 'Paid sales',
        },
        {
          key: 'partial_sales',
          label: 'Partial sales',
        },
        {
          key: 'unpaid_sales',
          label: 'Unpaid sales',
        },
      ]}
    />
  );
}