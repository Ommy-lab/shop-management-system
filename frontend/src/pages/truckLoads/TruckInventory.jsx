import { useEffect, useState } from 'react';

import PageHeader from '../../components/common/PageHeader';
import FormSelect from '../../components/common/FormSelect';
import DataTable from '../../components/common/DataTable';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import truckService from '../../services/truckService';
import truckLoadService from '../../services/truckLoadService';

import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roles';
import { asList, errorMessage } from '../../utils/data';

export default function TruckInventory() {
  const { user } = useAuth();

  const [trucks, setTrucks] = useState([]);
  const [truckInfo, setTruckInfo] = useState(null);

  // This state is only used when an admin/staff member
  // manually selects which truck to inspect.
  const [selectedTruckId, setSelectedTruckId] = useState('');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const salesperson = user?.role === ROLES.SALESPERSON;

  /*
   * For salespeople, always derive the truck ID directly
   * from the latest authenticated user object.
   *
   * This is important because AuthContext loads the user
   * asynchronously after the component may already mount.
   */
  const assignedTruckId =
    user?.truck_id || user?.assigned_truck_id || '';

  /*
   * Salesperson:
   *   use the truck assigned by the backend.
   *
   * Admin/staff:
   *   use the truck selected from the dropdown.
   */
  const truckId = salesperson ? assignedTruckId : selectedTruckId;

  // Load truck options for administrators/staff.
  useEffect(() => {
    if (salesperson) return;

    truckService
      .list()
      .then((response) => {
        const truckList = asList(response, 'trucks');

        setTrucks(truckList);

        // Automatically select the first truck if nothing
        // has been selected yet.
        if (!selectedTruckId && truckList.length > 0) {
          setSelectedTruckId(truckList[0].id);
        }
      })
      .catch((err) => {
        setError(errorMessage(err));
      });
  }, [salesperson, selectedTruckId]);

  /*
   * Load inventory whenever the effective truck ID changes.
   *
   * For a salesperson this will automatically run when
   * AuthContext finishes loading the user and truck_id becomes available.
   */
  useEffect(() => {
    if (!truckId) {
      setRows([]);
      setTruckInfo(null);
      return;
    }

    setLoading(true);
    setError('');

    truckLoadService
      .inventory(truckId)
      .then((response) => {
        /*
         * Backend response:
         *
         * {
         *   success: true,
         *   truck: {...},
         *   inventory: [...]
         * }
         *
         * Some API wrappers may place the payload inside
         * response.data.data, so support both structures.
         */
        const body = response.data?.data ?? response.data;

        setTruckInfo(body?.truck ?? null);
        setRows(asList(response, 'inventory'));
      })
      .catch((err) => {
        setRows([]);
        setTruckInfo(null);
        setError(errorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [truckId]);

  return (
    <>
      <PageHeader
        eyebrow={salesperson ? 'Assigned route stock' : 'Fleet stock'}
        title={salesperson ? 'My truck inventory' : 'Truck inventory'}
        description={
          salesperson
            ? 'Only inventory for your backend-assigned truck is requested.'
            : 'Select a truck to inspect its current inventory.'
        }
      />

      <div className="panel">
        {!salesperson && (
          <div className="toolbar">
            <FormSelect
              label="Truck"
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              options={trucks}
              required
            />
          </div>
        )}

        {salesperson && !truckId && (
          <ErrorMessage
            message="Your account does not include an assigned truck identifier. Ask an administrator to assign a truck."
          />
        )}

        {truckInfo && (
          <div className="workflow-banner">
            <span>
              <strong>{truckInfo.name}</strong>
            </span>

            <span>
              {truckInfo.registration_number || 'No registration'}
            </span>

            <span>
              Status: {truckInfo.status || '—'}
            </span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : truckId ? (
          <DataTable
            rows={rows}
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
                key: 'quantity',
                label: 'Quantity',
              },
              {
                key: 'unit',
                label: 'Unit',
              },
              {
                key: 'selling_price',
                label: 'Selling price',
              },
            ]}
          />
        ) : null}
      </div>
    </>
  );
}