import ReportView from '../../components/common/ReportView';
import { money } from '../../utils/data';

export default function BestSellingProducts() {
  return (
    <ReportView
      title="Best-selling products"
      description="Product performance calculated from real backend sales data."
      method="bestSelling"
      dataKey="report"
      chart
      chartName="product_name"
      chartValue="quantity_sold"
      columns={[
        {
          key: 'product_name',
          label: 'Product',
        },
        {
          key: 'sku',
          label: 'SKU',
        },
        {
          key: 'quantity_sold',
          label: 'Quantity sold',
        },
        {
          key: 'sales_amount',
          label: 'Sales amount',
          render: money,
        },
      ]}
    />
  );
}
