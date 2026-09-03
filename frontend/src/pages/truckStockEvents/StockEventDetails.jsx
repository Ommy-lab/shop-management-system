import RecordDetails from '../../components/common/RecordDetails';
import truckStockEventService from '../../services/truckStockEventService';
import { money, shortDate } from '../../utils/data';

export default function StockEventDetails() {
  return (
    <RecordDetails
      title="Stock event"
      service={truckStockEventService}
      dataKey="event"
      backTo="/truck-stock-events"
      fields={[
        {
          key: 'id',
          label: 'Reference',

          // The backend provides an ID rather than a reference string.
          // We create a readable event reference for the UI.
          render: (value) =>
            `EVT-${String(value).padStart(4, '0')}`,
        },
        {
          key: 'event_date',
          label: 'Event date',
          render: shortDate,
        },
        {
          key: 'event_type',
          label: 'Event type',
        },
        {
          key: 'truck_id',
          label: 'Truck ID',
        },
        {
          key: 'notes',
          label: 'Notes',
        },
        {
          key: 'created_at',
          label: 'Recorded at',
          render: shortDate,
        },
      ]}
    >
      {(record) => (
        <div className="nested-records">
          <h3>Products</h3>

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
                      SKU: {item.sku || '—'} · Unit:{' '}
                      {item.unit || '—'}
                    </div>
                  </div>

                  <div>
                    {item.quantity} ×{' '}
                    {money(item.cost_price)}
                  </div>

                  <strong>
                    {money(item.cost_subtotal)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">
              No products were recorded for this event.
            </p>
          )}
        </div>
      )}
    </RecordDetails>
  );
}