import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';

import reconciliationService from '../../services/reconciliationService';

import { useList } from '../../hooks/useRemote';
import { money, shortDate } from '../../utils/data';

export default function ReconciliationHistory() {
  /*
   * Load reconciliation history for the authenticated
   * salesperson.
   *
   * The backend determines which reconciliation records
   * belong to the logged-in salesperson.
   */
  const loader = useCallback(
    () => reconciliationService.history(),
    []
  );

  /*
   * Backend response:
   *
   * {
   *   success: true,
   *   count: 1,
   *   reconciliations: [...]
   * }
   *
   * Therefore "reconciliations" is the correct data key.
   */
  const {
    rows,
    loading,
    error,
    reload,
  } = useList(loader, 'reconciliations');

  return (
    <>
      <PageHeader
        eyebrow="Daily close history"
        title="My reconciliations"
        description="Review your previous end-of-day submissions, collections, expenses, and cash differences."
      />

      <div className="panel">
        {loading ? (
          <LoadingSpinner
            label="Loading reconciliation history…"
          />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={reload}
          />
        ) : (
          <DataTable
            rows={rows}
            columns={[
              /*
               * Date on which the truck reconciliation
               * was performed.
               */
              {
                key: 'reconciliation_date',
                label: 'Date',
                render: shortDate,
              },

              /*
               * Total value of sales made during the
               * reconciliation period.
               */
              {
                key: 'total_sales',
                label: 'Sales',
                render: money,
              },

              /*
               * Total money actually collected from
               * customers.
               */
              {
                key: 'total_collected',
                label: 'Collected',
                render: money,
              },

              /*
               * Physical cash reported by the salesperson
               * when closing the truck day.
               */
              {
                key: 'submitted_cash',
                label: 'Submitted cash',
                render: money,
              },

              /*
               * Difference between expected cash and
               * submitted physical cash.
               */
              {
                key: 'cash_difference',
                label: 'Difference',
                render: money,
              },

              /*
               * Reconciliation workflow status.
               *
               * Typical values:
               * PENDING
               * APPROVED
               * REJECTED
               */
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <StatusBadge value={value} />
                ),
              },

              /*
               * Open the complete reconciliation record.
               *
               * This uses the salesperson detail route:
               *
               * /reconciliation/:id
               *
               * ReconciliationDetails.jsx will automatically
               * use reconciliationService.get(id) for this route.
               */
              {
                key: 'actions',
                label: '',
                render: (_, row) => (
                  <Link
                    className="btn btn--small btn--outline"
                    to={`/reconciliation/${row.id}`}
                  >
                    View
                  </Link>
                ),
              },
            ]}
            emptyTitle="No reconciliation records found"
          />
        )}
      </div>
    </>
  );
}