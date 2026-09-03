import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import RecordDetails from '../../components/common/RecordDetails';
import truckService from '../../services/truckService';
import userService from '../../services/userService';

import { asList, errorMessage } from '../../utils/data';

export default function TruckDetails() {
  const { id } = useParams();

  const [salespersonName, setSalespersonName] = useState('—');
  const [loadingSalesperson, setLoadingSalesperson] = useState(true);

  /*
   * The truck endpoint does not currently return the assigned
   * salesperson directly.
   *
   * Therefore we use the users endpoint and find the salesperson
   * whose truck_id matches this truck's ID.
   */
  useEffect(() => {
    let cancelled = false;

    const loadAssignedSalesperson = async () => {
      setLoadingSalesperson(true);

      try {
        const response = await userService.list();

        const users = asList(response, 'users');

        /*
         * Find the salesperson assigned to this truck.
         *
         * Example:
         *
         * truck ID = 2
         *
         * user:
         * {
         *   id: 3,
         *   name: "Salesperson One",
         *   role: "SALESPERSON",
         *   truck_id: 2
         * }
         */
        const salesperson = users.find(
          (user) =>
            String(user.truck_id) === String(id) &&
            user.role === 'SALESPERSON'
        );

        if (!cancelled) {
          setSalespersonName(
            salesperson?.name ?? '—'
          );
        }
      } catch (error) {
        /*
         * If loading the salesperson fails, the truck details
         * should still be displayed normally.
         */
        if (!cancelled) {
          console.error(
            'Failed to load assigned salesperson:',
            errorMessage(error)
          );

          setSalespersonName('—');
        }
      } finally {
        if (!cancelled) {
          setLoadingSalesperson(false);
        }
      }
    };

    loadAssignedSalesperson();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
   * RecordDetails loads the truck itself using:
   *
   * GET /api/trucks/:id
   *
   * The salesperson information is handled separately above.
   */
  return (
    <RecordDetails
      title="Truck"
      service={truckService}
      fields={[
        {
          key: 'name',
          label: 'Truck name',
        },
        {
          key: 'registration_number',
          label: 'Registration',
        },
        {
          key: 'capacity',
          label: 'Capacity',
        },
        {
          /*
           * salesperson_name does not come from the truck API.
           * We add it to the record through a custom renderer.
           */
          key: 'salesperson_name',
          label: 'Assigned salesperson',
          render: () =>
            loadingSalesperson
              ? 'Loading…'
              : salespersonName,
        },
        {
          key: 'status',
          label: 'Status',
        },
      ]}
      backTo="/trucks"
      editTo="/trucks/:id/edit"
      dataKey="truck"
    />
  );
}
