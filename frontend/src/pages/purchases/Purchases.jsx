import EntityList from '../../components/common/EntityList';
import StatusBadge from '../../components/common/StatusBadge';
import purchaseService from '../../services/purchaseService';
import { money, shortDate } from '../../utils/data';

export default function Purchases() {
  return (
    <EntityList
      title="Purchases"
      eyebrow="Incoming stock"
      description="Record supplier deliveries that increase store inventory."
      service={purchaseService}
      dataKey="purchases"
      searchFields={[
        'supplier_name',
        'reference',
        'payment_status',
      ]}
      addTo="/purchases/new"
      detailBase="/purchases"
      columns={[
        {
          // Backend response field is purchase_date.
          key: 'purchase_date',
          label: 'Date',
          render: shortDate,
        },
        {
          /*
           * The current backend response does not contain
           * a reference field.
           *
           * Use the purchase ID for now.
           */
          key: 'id',
          label: 'Reference',
          render: (value) => `PUR-${String(value).padStart(4, '0')}`,
        },
        {
          key: 'supplier_name',
          label: 'Supplier',
        },
        {
          // Backend response field is total_amount.
          key: 'total_amount',
          label: 'Total',
          render: money,
        },
        {
          key: 'payment_status',
          label: 'Payment',
          render: (value) => (
            <StatusBadge value={value} />
          ),
        },
      ]}
    />
  );
}