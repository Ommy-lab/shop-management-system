import RecordDetails from '../../components/common/RecordDetails';
import purchaseService from '../../services/purchaseService';
import { money, shortDate } from '../../utils/data';

export default function PurchaseDetails() {
  return (
    <RecordDetails
      title="Purchase"
      service={purchaseService}
      dataKey="purchase"
      backTo="/purchases"
      fields={[
        {
          key: 'id',
          label: 'Reference',
          // The backend only provides the purchase ID,
          // so we format it as a readable purchase reference.
          render: (value) => `PUR-${String(value).padStart(4, '0')}`,
        },
        {
          key: 'purchase_date',
          label: 'Date',
          render: shortDate,
        },
        {
          key: 'supplier_name',
          label: 'Supplier',
        },
        {
          key: 'supplier_phone',
          label: 'Supplier phone',
        },
        {
          key: 'supplier_location',
          label: 'Supplier location',
        },
        {
          key: 'total_amount',
          label: 'Total',
          render: money,
        },
        {
          key: 'payment_status',
          label: 'Payment status',
        },
        {
          key: 'created_by_name',
          label: 'Created by',
        },
        {
          key: 'notes',
          label: 'Notes',
        },
      ]}
    >
      {(record) => (
        <div className="nested-records">
          <h3>Purchased products</h3>

          {record?.items?.length ? (
            <div className="nested-records__list">
              {record.items.map((item, index) => (
                <div
                  className="nested-records__item"
                  key={item.id || index}
                >
                  <div>
                    <strong>{item.product_name}</strong>

                    <div className="muted">
                      SKU: {item.sku || '—'} · Unit: {item.unit || '—'}
                    </div>
                  </div>

                  <div>
                    {item.quantity} × {money(item.buying_price)}
                  </div>

                  <strong>
                    {money(item.subtotal)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">
              No purchased products were found.
            </p>
          )}
        </div>
      )}
    </RecordDetails>
  );
}