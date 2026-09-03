import { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import debtService from '../../services/debtService';

import { useDetail } from '../../hooks/useRemote';
import { money, shortDate } from '../../utils/data';

import StatusBadge from '../../components/common/StatusBadge';

export default function CustomerDebtDetails() {
  const { id } = useParams();

  /*
   * Load debt information for the selected customer.
   */
  const loader = useCallback(
    (customerId) => debtService.customer(customerId),
    []
  );

  const {
    record,
    loading,
    error,
  } = useDetail(loader, id, 'customer');

  /*
   * The customer endpoint may return its sales under
   * "outstanding_sales" or "sales".
   *
   * We support both without passing objects directly to React.
   */
  const rows =
    record?.outstanding_sales ||
    record?.sales ||
    [];

  return (
    <>
      <PageHeader
        eyebrow="Customer credit"
        title={record?.name || 'Customer debt details'}
        description="Review outstanding sales and balances for this customer."
      />

      <div className="panel">
        {loading ? (
          <LoadingSpinner label="Loading customer debt…" />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <DataTable
            rows={rows}
            columns={[
              /*
               * Backend field:
               * sale_date
               */
              {
                key: 'sale_date',
                label: 'Date',
                render: shortDate,
              },

              /*
               * Backend field:
               * sale_id
               */
              {
                key: 'sale_id',
                label: 'Sale',
                render: (value) => `#${value}`,
              },

              /*
               * Total value of the sale.
               */
              {
                key: 'total_amount',
                label: 'Total',
                render: money,
              },

              /*
               * Amount already paid by the customer.
               */
              {
                key: 'amount_paid',
                label: 'Paid',
                render: money,
              },

              /*
               * Remaining balance.
               */
              {
                key: 'balance',
                label: 'Remaining',
                render: money,
              },

              /*
               * Current payment state.
               */
              {
                key: 'payment_status',
                label: 'Status',
                render: (value) => (
                  <StatusBadge value={value} />
                ),
              },
            ]}
            emptyTitle="No outstanding debts found"
          />
        )}
      </div>
    </>
  );
}
