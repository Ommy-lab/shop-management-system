import EntityList from '../../components/common/EntityList';
import truckLoadService from '../../services/truckLoadService';
import { shortDate } from '../../utils/data';

/**
 * TruckLoads
 *
 * Displays the list of truck loads returned by the backend.
 *
 * Backend response:
 *
 * {
 *   success: true,
 *   count: 2,
 *   loads: [
 *     {
 *       id,
 *       truck_id,
 *       truck_name,
 *       registration_number,
 *       load_date,
 *       notes,
 *       created_by_name,
 *       created_at
 *     }
 *   ]
 * }
 *
 * Important:
 * The list endpoint does NOT return the individual loaded products.
 * Those are available from the truck-load details endpoint.
 */
export default function TruckLoads() {
  return (
    <EntityList
      title="Truck loads"
      eyebrow="Store → truck"
      description="Review confirmed transfers from central inventory into truck inventory."

      service={truckLoadService}

      // The backend returns "loads", not "truck_loads".
      dataKey="loads"

      // Only search fields that actually exist in the list response.
      searchFields={[
        'truck_name',
        'registration_number',
        'created_by_name',
      ]}

      addTo="/truck-loads/new"
      detailBase="/truck-loads"

      columns={[
        // The list endpoint has load_date, which is the actual
        // date the truck load was created/loaded.
        {
          key: 'load_date',
          label: 'Date',
          render: shortDate,
        },

        // There is no "reference" field in the backend response.
        // Use the load ID as the reference instead.
        {
          key: 'id',
          label: 'Reference',
          render: (value) => `#${value}`,
        },

        {
          key: 'truck_name',
          label: 'Truck',
        },

        // Backend uses created_by_name instead of storekeeper_name.
        {
          key: 'created_by_name',
          label: 'Loaded by',
        },

        // The list endpoint does not return item quantities.
        // Therefore we cannot calculate total units here.
        //
        // We display the load ID/reference instead of showing
        // incorrect or empty data.
        {
          key: 'registration_number',
          label: 'Registration',
        },
      ]}
    />
  );
}