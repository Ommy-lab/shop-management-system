import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import RecordDetails from '../../components/common/RecordDetails';

import reconciliationService from '../../services/reconciliationService';

import { money, shortDate } from '../../utils/data';

export default function ReconciliationDetails() {
  const location = useLocation();

  /*
   * The same component is used by two routes:
   *
   *   /reconciliation/:id
   *   /reconciliation/admin/:id
   *
   * Admin users must use adminGet().
   * Salespeople should use the normal get().
   */
  const isAdminRoute = location.pathname.startsWith(
    '/reconciliation/admin/'
  );

  /*
   * Build the service expected by RecordDetails.
   *
   * RecordDetails only needs a get(id) method.
   * We select the correct backend endpoint depending
   * on which route opened this component.
   */
  const service = useMemo(
    () => ({
      get: (id) =>
        isAdminRoute
          ? reconciliationService.adminGet(id)
          : reconciliationService.get(id),
    }),
    [isAdminRoute]
  );

  /*
   * The back button should also return to the correct
   * reconciliation section.
   */
  const backTo = isAdminRoute
    ? '/reconciliation/admin'
    : '/reconciliation/history';

  return (
    <RecordDetails
      title="Reconciliation"
      service={service}
      dataKey="reconciliation"
      backTo={backTo}
      fields={[
        {
          key: 'reconciliation_date',
          label: 'Date',
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
          key: 'salesperson_name',
          label: 'Salesperson',
        },

        {
          key: 'salesperson_phone',
          label: 'Salesperson phone',
        },

        {
          key: 'total_sales',
          label: 'Total sales',
          render: money,
        },

        {
          key: 'cash_payments',
          label: 'Cash payments',
          render: money,
        },

        {
          key: 'mobile_money_payments',
          label: 'Mobile money',
          render: money,
        },

        {
          key: 'card_payments',
          label: 'Card payments',
          render: money,
        },

        {
          key: 'total_collected',
          label: 'Total collected',
          render: money,
        },

        {
          key: 'outstanding_credit',
          label: 'Outstanding credit',
          render: money,
        },

        {
          key: 'total_expenses',
          label: 'Total expenses',
          render: money,
        },

        {
          key: 'expected_cash',
          label: 'Expected cash',
          render: money,
        },

        {
          key: 'submitted_cash',
          label: 'Submitted cash',
          render: money,
        },

        {
          key: 'cash_difference',
          label: 'Cash difference',
          render: money,
        },

        {
          key: 'cash_status',
          label: 'Cash status',
        },

        {
          key: 'returned_quantity',
          label: 'Returned quantity',
        },

        {
          key: 'damaged_quantity',
          label: 'Damaged quantity',
        },

        {
          key: 'lost_quantity',
          label: 'Lost quantity',
        },

        {
          key: 'expired_quantity',
          label: 'Expired quantity',
        },

        {
          key: 'status',
          label: 'Status',
        },

        {
          key: 'approved_by_name',
          label: 'Approved by',
        },

        {
          key: 'approved_at',
          label: 'Approved at',
          render: shortDate,
        },

        {
          key: 'notes',
          label: 'Notes',
        },
      ]}
    />
  );
}