import { useEffect, useState } from 'react';

import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import debtService from '../../services/debtService';

import {
  asList,
  errorMessage,
  money,
  shortDate,
  unwrap,
} from '../../utils/data';

import StatusBadge from '../../components/common/StatusBadge';

export default function DebtDashboard() {
  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  /*
   * Load both:
   * 1. Debt summary statistics
   * 2. Individual outstanding sales
   */
  const load = () => {
    setLoading(true);
    setError('');

    Promise.all([
      debtService.summary(),
      debtService.outstanding(),
    ])
      .then(([summaryResponse, outstandingResponse]) => {
        /*
         * The summary endpoint returns:
         *
         * {
         *   success: true,
         *   summary: {...}
         * }
         */
        setSummary(unwrap(summaryResponse, 'summary') || {});

        /*
         * IMPORTANT:
         *
         * The outstanding endpoint returns:
         *
         * {
         *   success: true,
         *   count: 3,
         *   outstanding_sales: [...]
         * }
         *
         * Therefore the correct data key is
         * "outstanding_sales", NOT "sales".
         */
        setRows(
          asList(outstandingResponse, 'outstanding_sales')
        );
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Credit control"
        title="Outstanding debts"
        description="Track unpaid and partially paid sales and the balances still owed by customers."
      />


        {/* Debt summary cards */}
        <div className="summary-grid">
        {/* Total money still owed by customers */}
        <SummaryCard
            label="Outstanding balance"
            value={money(summary.total_outstanding_balance)}
            tone="red"
        />

        {/* Sales that have not received any payment */}
        <SummaryCard
            label="Unpaid sales"
            value={summary.unpaid_sales}
            tone="orange"
        />

        {/* Sales where the customer has paid only part of the amount */}
        <SummaryCard
            label="Partial sales"
            value={summary.partial_sales}
            tone="blue"
        />

        {/* Total number of sales made on credit */}
        <SummaryCard
            label="Credit sales"
            value={summary.credit_sales}
            tone="orange"
        />

        {/* Total value of all credit sales */}
        <SummaryCard
            label="Credit sales value"
            value={money(summary.total_credit_sales_amount)}
            tone="blue"
        />

        {/* Amount already collected from credit customers */}
        <SummaryCard
            label="Amount collected"
            value={money(summary.total_amount_paid)}
            tone="green"
        />
        </div>



      {/* Outstanding sales table */}
      <div className="panel">
        {loading ? (
          <LoadingSpinner label="Loading outstanding debts…" />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={load}
          />
        ) : (
          <DataTable
            rows={rows}
            columns={[
              /*
               * Backend:
               * sale_date
               */
              {
                key: 'sale_date',
                label: 'Sale date',
                render: shortDate,
              },

              /*
               * Backend:
               * sale_id
               *
               * There is no "reference" field in this response.
               */
              {
                key: 'sale_id',
                label: 'Sale',
                render: (value) => `#${value}`,
              },

              /*
               * Customer name.
               */
              {
                key: 'customer_name',
                label: 'Customer',
              },

              /*
               * Business/shop name.
               */
              {
                key: 'business_name',
                label: 'Business',
              },

              /*
               * Total amount of the sale.
               */
              {
                key: 'total_amount',
                label: 'Total',
                render: money,
              },

              /*
               * Amount already paid.
               */
              {
                key: 'amount_paid',
                label: 'Paid',
                render: money,
              },

              /*
               * Remaining customer balance.
               */
              {
                key: 'balance',
                label: 'Remaining',
                render: money,
              },

              /*
               * Payment status.
               *
               * Examples:
               * PARTIAL
               * UNPAID
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
