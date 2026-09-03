import ReportView from '../../components/common/ReportView';
import { money } from '../../utils/data';

export default function PurchaseReport() {
  return (
    <ReportView
      title="Purchase report"
      description="Supplier purchases and incoming-stock costs summarized for the selected period."
      method="purchases"
      dataKey="report"
      columns={[
        {
          key: 'supplier_name',
          label: 'Supplier',
        },
        {
          key: 'purchases_count',
          label: 'Purchases',
        },
        {
          key: 'total_purchased_amount',
          label: 'Total purchased',
          render: money,
        },
      ]}
    />
  );
}
