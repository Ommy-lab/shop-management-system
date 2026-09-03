import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import paymentService from '../../services/paymentService';
import { useList } from '../../hooks/useRemote';
import { money, shortDate } from '../../utils/data';

export default function SalePayments() {
  const { saleId } = useParams();

  // Load all payments belonging to this specific sale.
  const loader = useCallback(
    () => paymentService.forSale(saleId),
    [saleId]
  );

  const {
    rows,
    loading,
    error,
    reload,
  } = useList(loader, 'payments');

  return (
    <>
      <PageHeader
        eyebrow="Collection history"
        title={`Sale #${saleId} payments`}
        action={
          <Link
            className="btn btn--primary"
            to={`/sales/${saleId}/payment`}
          >
            ＋ Record payment
          </Link>
        }
      />

      <div className="panel">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={reload}
          />
        ) : rows.length === 0 ? (
          // An empty array is a valid successful response.
          // It means the sale has no payment records yet.
          <div className="empty-state">
            <h3>No payments recorded</h3>

            <p>
              No payment has been recorded for Sale #{saleId} yet.
            </p>

            <Link
              className="btn btn--primary"
              to={`/sales/${saleId}/payment`}
            >
              Record first payment
            </Link>
          </div>
        ) : (
          <DataTable
            rows={rows}
            columns={[
              {
                key: 'paid_at',
                label: 'Date',
                render: shortDate,
              },
              {
                key: 'amount',
                label: 'Amount',
                render: money,
              },
              {
                key: 'payment_method',
                label: 'Method',
                render: (value) =>
                  value?.replaceAll('_', ' ') || '—',
              },
              {
                key: 'transaction_reference',
                label: 'Reference',
              },
              {
                key: 'notes',
                label: 'Notes',
              },
            ]}
          />
        )}
      </div>
    </>
  );
}