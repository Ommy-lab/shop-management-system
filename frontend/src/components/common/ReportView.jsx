import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from './PageHeader';
import FormInput from './FormInput';
import DataTable from './DataTable';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

import reportService from '../../services/reportService';
import {
  asList,
  errorMessage,
  today,
  unwrap,
} from '../../utils/data';

const monthAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

export default function ReportView({
  title,
  description,
  method,

  // Used by list/table reports.
  columns,

  // Used by list/table reports.
  dataKey = 'rows',

  // Used by summary/object reports.
  summary = null,

  chart = false,
  chartName = 'name',
  chartValue = 'total',
}) {
  const [range, setRange] = useState({
    start_date: monthAgo(),
    end_date: today(),
  });

  const [rows, setRows] = useState([]);
  const [summaryData, setSummaryData] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');

    reportService[method](range)
      .then((response) => {
        /*
         * Summary reports return an object such as:
         *
         * {
         *   success: true,
         *   period: {...},
         *   report: {
         *     total_sales_transactions: "4",
         *     total_sales_amount: "23000.00",
         *     ...
         *   }
         * }
         *
         * List reports return an array under a specific key.
         *
         * We support both formats.
         */
        if (summary) {
          setSummaryData(unwrap(response, 'report') || {});
          setRows([]);
        } else {
          setRows(asList(response, dataKey));
          setSummaryData({});
        }
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [method, dataKey, range, summary]);

  useEffect(() => {
    load();
  }, [load]);

  // Only list reports need chart data.
  const chartRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row[chartName] !== undefined &&
          row[chartValue] !== undefined
      ),
    [rows, chartName, chartValue]
  );

  return (
    <>
      <PageHeader
        eyebrow="Management insight"
        title={title}
        description={description}
      />

      <div className="panel">
        {/* Report date filters */}
        <div className="report-filters">
          <FormInput
            label="Start date"
            type="date"
            value={range.start_date}
            onChange={(e) =>
              setRange({
                ...range,
                start_date: e.target.value,
              })
            }
          />

          <FormInput
            label="End date"
            type="date"
            value={range.end_date}
            onChange={(e) =>
              setRange({
                ...range,
                end_date: e.target.value,
              })
            }
          />
        </div>

        {loading ? (
          <LoadingSpinner
            label={`Loading ${title.toLowerCase()}…`}
          />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={load}
          />
        ) : (
          <>
            {/* -------------------------------------------
                SUMMARY REPORT
                -------------------------------------------
                Used when the backend returns one report
                object instead of an array of rows.
            */}
            {summary && (
              <div className="summary-grid">
                {summary.map((item) => {
                  const value = summaryData[item.key];

                  return (
                    <div
                      className="summary-card"
                      key={item.key}
                    >
                      <div className="summary-card__label">
                        {item.label}
                      </div>

                      <div className="summary-card__value">
                        {item.render
                          ? item.render(value)
                          : value ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* -------------------------------------------
                CHART
                -------------------------------------------
                Only list reports use the chart.
            */}
            {!summary &&
              chart &&
              chartRows.length > 0 && (
                <div className="chart-card">
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <BarChart data={chartRows}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis dataKey={chartName} />

                      <YAxis />

                      <Tooltip />

                      <Bar
                        dataKey={chartValue}
                        fill="#f97316"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

            {/* -------------------------------------------
                TABLE
                -------------------------------------------
                List reports continue using DataTable.
            */}
            {!summary && (
              <DataTable
                rows={rows}
                columns={columns}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
