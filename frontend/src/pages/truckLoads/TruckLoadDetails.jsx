import RecordDetails from '../../components/common/RecordDetails';
import truckLoadService from '../../services/truckLoadService';
import { shortDate } from '../../utils/data';

export default function TruckLoadDetails() {
  return (
    <RecordDetails
      title="Truck load"
      service={truckLoadService}
      dataKey="truck_load"
      backTo="/truck-loads"
      fields={[
        {
          key: 'id',
          label: 'Reference',

          // The backend provides only the numeric load ID.
          // We turn it into a readable business reference.
          render: (value) =>
            `LOAD-${String(value).padStart(4, '0')}`,
        },
        {
          key: 'load_date',
          label: 'Load date',
          render: shortDate,
        },
        {
          key: 'truck_name',
          label: 'Truck',
        },
        {
          key: 'registration_number',
          label: 'Registration',
        },
        {
          key: 'created_by_name',
          label: 'Loaded by',
        },
        {
          key: 'created_at',
          label: 'Recorded at',
          render: shortDate,
        },
        {
          key: 'notes',
          label: 'Notes',
        },
      ]}
    >
      {(record) => {
        // Calculate total units because the backend does not
        // provide a total_items field in the detail response.
        const totalUnits =
          record?.items?.reduce(
            (total, item) =>
              total + Number(item.quantity || 0),
            0
          ) || 0;

        return (
          <div className="nested-records">
            <div className="section-heading">
              <div>
                <h3>Loaded products</h3>
                <p className="muted">
                  Products transferred from the main store to the truck.
                </p>
              </div>

              <strong>{totalUnits} units</strong>
            </div>

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

                    <strong>
                      {item.quantity} {item.unit || 'units'}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                No products were recorded for this truck load.
              </p>
            )}
          </div>
        );
      }}
    </RecordDetails>
  );
}