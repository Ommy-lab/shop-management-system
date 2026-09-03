import EntityList from '../../components/common/EntityList';
import StatusBadge from '../../components/common/StatusBadge';
import truckStockEventService from '../../services/truckStockEventService';
import { money, shortDate } from '../../utils/data';

export default function StockEvents() {
  return (
    <EntityList
      title="Stock events"
      eyebrow="Route stock exceptions"
      description="Returns, damaged, lost, and expired products reported from the assigned truck."
      service={truckStockEventService}
      dataKey="events"

      // These are the fields that actually exist in the backend response.
      searchFields={['event_type', 'id', 'notes']}

      addTo="/truck-stock-events/new"
      detailBase="/truck-stock-events"

      columns={[
        {
          key: 'created_at',
          label: 'Date',
          render: shortDate,
        },
        {
          key: 'id',
          label: 'Reference',

          // The backend only provides the numeric ID,
          // so we create a readable reference in the frontend.
          render: (value) =>
            `EVT-${String(value).padStart(4, '0')}`,
        },
        {
          key: 'event_type',
          label: 'Event',
          render: (value) => <StatusBadge value={value} />,
        },
        {
          key: 'total_quantity',
          label: 'Units',
        },
        {
          key: 'total_cost_value',
          label: 'Cost value',
          render: money,
        },
        {
          key: 'notes',
          label: 'Notes',
        },
      ]}
    />
  );
}
