import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import FormInput from '../../components/common/FormInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import reportService from '../../services/reportService';
import {
  errorMessage,
  money,
  today,
  unwrap,
} from '../../utils/data';

// Returns the date 30 days before today.
// This is used as the default report start date.
const monthAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

export default function ProfitLossReport() {
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Build the date range sent to the backend.
  const range = useMemo(
    () => ({
      start_date: startDate,
      end_date: endDate,
    }),
    [startDate, endDate]
  );

  useEffect(() => {
    setLoading(true);
    setError('');

    reportService
      .profitLoss(range)
      .then((response) => {
        /*
         * Backend response:
         *
         * {
         *   success: true,
         *   period: {...},
         *   report: {
         *     revenue: ...,
         *     cost_of_goods_sold: ...,
         *     gross_profit: ...,
         *     operating_expenses: ...,
         *     inventory_loss: ...,
         *     net_profit: ...,
         *     result: ...
         *   }
         * }
         *
         * Therefore we unwrap "report", not "profit_loss".
         */
        setData(unwrap(response, 'report'));
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [range]);

  return (
    <>
      <PageHeader
        eyebrow="Financial statement"
        title="Profit & loss"
        description="Revenue, cost of goods, operating expense, and inventory loss remain separately visible."
      />

      <div className="panel">
        {/* Report date filters */}
        <div className="report-filters">
          <FormInput
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <FormInput
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            {/* Main financial summary */}
            <div className="summary-grid">
              <SummaryCard
                label="Revenue"
                value={money(data.revenue)}
              />

              <SummaryCard
                label="Gross profit"
                value={money(data.gross_profit)}
                tone="green"
              />

              <SummaryCard
                label="Net profit"
                value={money(data.net_profit)}
                tone={Number(data.net_profit) >= 0 ? 'blue' : 'red'}
              />
            </div>

            {/* Detailed profit and loss statement */}
            <dl className="profit-statement">
              <div>
                <dt>Revenue</dt>
                <dd>{money(data.revenue)}</dd>
              </div>

              <div>
                <dt>Cost of goods sold (COGS)</dt>
                <dd>− {money(data.cost_of_goods_sold)}</dd>
              </div>

              <div className="subtotal">
                <dt>Gross profit</dt>
                <dd>{money(data.gross_profit)}</dd>
              </div>

              <div>
                <dt>Operating expenses</dt>
                <dd>− {money(data.operating_expenses)}</dd>
              </div>

              <div>
                <dt>
                  Inventory loss{' '}
                  <small>(damaged, lost, expired)</small>
                </dt>
                <dd>− {money(data.inventory_loss)}</dd>
              </div>

              <div className="total">
                <dt>Net profit</dt>
                <dd>{money(data.net_profit)}</dd>
              </div>
            </dl>

            {/* Display whether the business made a profit or loss */}
            {data.result && (
              <div className="report-result">
                Result: <strong>{data.result}</strong>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
