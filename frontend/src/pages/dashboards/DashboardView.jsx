import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import dashboardService from '../../services/dashboardService';
import { errorMessage, money, unwrap } from '../../utils/data';
import { useAuth } from '../../context/AuthContext';

/*
 * Dashboard summary cards by user role.
 *
 * IMPORTANT:
 * Every key below must match the exact property name
 * returned by the corresponding backend dashboard endpoint.
 */
const cards = {
  SUPER_ADMIN: [
    ['Today’s sales', 'today_sales', '◎', 'orange', 'money'],
    ['Today’s purchases', 'today_purchases', '↘', 'blue', 'money'],
    ['Store stock value', 'store_stock_value', '▦', 'green', 'money'],

    // Backend returns "low_stock_products", not "low_stock_items".
    ['Low stock products', 'low_stock_products', '⚠', 'red'],

    ['Active trucks', 'truck_sales', '▰', 'blue'],

    // Backend returns singular "outstanding_debt".
    ['Outstanding debt', 'outstanding_debt', '◫', 'red', 'money'],

    // Gross profit and net profit are NOT returned by
    // the Super Admin dashboard endpoint, so they should
    // not be displayed as dashboard cards here.
  ],

  ADMIN: [
    ['Today’s sales', 'today_sales', '◎', 'orange', 'money'],
    ['Today’s purchases', 'today_purchases', '↘', 'blue', 'money'],
    ['Store stock value', 'store_stock_value', '▦', 'green', 'money'],

    // Backend returns "low_stock_products".
    ['Low stock products', 'low_stock_products', '⚠', 'red'],

    ['Active trucks', 'truck_sales', '▰', 'blue'],

    // Backend field is "outstanding_debt".
    ['Outstanding debt', 'outstanding_debt', '◫', 'red', 'money'],
  ],

  STOREKEEPER: [
    ['Store stock value', 'store_stock_value', '▦', 'green', 'money'],
    ['Products in stock', 'total_store_units', '▣', 'blue'],
    ['Low stock', 'low_stock_products', '⚠', 'red'],
    ['Today’s incoming', 'units_received_today', '↘', 'orange'],
    ['Today’s truck loads', 'units_loaded_today', '⇧', 'blue'],
    ['Returned items', 'units_returned_today', '◇', 'red'],
  ],

  SALESPERSON: [
    ['Today’s sales', 'today_sales', '◎', 'orange', 'money'],
    ['Today’s collections', 'today_collections', '↗', 'green', 'money'],
    ['Outstanding debt', 'outstanding_debt', '◫', 'red', 'money'],
    ['My customers', 'customers', '👥', 'blue'],
    ['Truck inventory', 'truck_stock_units', '▦', 'orange'],
    ['Today’s expenses', 'today_expenses', '↘', 'red', 'money'],
    ['Returned today', 'returned_today', '↩', 'red'],
    ['Damaged today', 'damaged_today', '⚠', 'red'],
  ],
};

/*
 * Converts dashboard values into something React can safely render.
 *
 * This protects SummaryCard from accidentally receiving:
 * - objects
 * - arrays
 * - unexpected API structures
 *
 * For arrays, we normally display their length because a summary
 * card should show a count rather than the actual records.
 */
function getCardValue(value, type) {
  // Money values should be formatted using the existing money utility.
  if (type === 'money') {
    return money(value);
  }

  // If the backend returns an array, show the number of records.
  if (Array.isArray(value)) {
    return value.length;
  }

  // If the backend unexpectedly returns an object,
  // avoid crashing React by showing a safe fallback.
  if (value !== null && typeof value === 'object') {
    return '—';
  }

  // Normal string/number/undefined values can be rendered directly.
  return value;
}

export default function DashboardView() {
  const { user } = useAuth();

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Loads the dashboard data for the currently authenticated user.
   */
  const load = () => {
    // Don't attempt to request a dashboard before the user is available.
    if (!user?.role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    dashboardService
      .get(user.role)
      .then((response) => {
        /*
         * unwrap() extracts the "dashboard" property from the API response.
         *
         * Example:
         * {
         *   success: true,
         *   user: {...},
         *   dashboard: {...}
         * }
         *
         * becomes:
         * {
         *   total_store_units: "120",
         *   store_stock_value: "96000.00",
         *   ...
         * }
         */
        const dashboardData = unwrap(response, 'dashboard');

        setData(
          dashboardData && typeof dashboardData === 'object'
            ? dashboardData
            : {}
        );
      })
      .catch((err) => {
        setError(errorMessage(err));
        setData({});
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /*
   * Reload dashboard whenever the logged-in user's role changes.
   */
  useEffect(() => {
    load();
  }, [user?.role]);

  /*
   * Supports either:
   * - daily_sales
   * - sales_trend
   *
   * If neither exists, the chart displays the empty state.
   */
  const trend = useMemo(() => {
    if (Array.isArray(data.daily_sales)) {
      return data.daily_sales;
    }

    if (Array.isArray(data.sales_trend)) {
      return data.sales_trend;
    }

    return [];
  }, [data]);

  /*
   * Display loading state while the dashboard request is running.
   */
  if (loading) {
    return <LoadingSpinner label="Loading your dashboard…" />;
  }

  /*
   * Get cards belonging to the current user's role.
   */
  const roleCards = cards[user?.role] || [];

  return (
    <>
      <PageHeader
        eyebrow={`${user?.role?.replaceAll('_', ' ') || 'USER'} workspace`}
        title={`Good ${
          new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 18
              ? 'afternoon'
              : 'evening'
        }, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Live operational data from your authorized backend dashboard."
      />

      <ErrorMessage message={error} onRetry={load} />

      {/* Dashboard summary cards */}
      <div className="summary-grid">
        {roleCards.map(([label, key, icon, tone, type]) => (
          <SummaryCard
            key={key}
            label={label}
            value={getCardValue(data[key], type)}
            icon={icon}
            tone={tone}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Daily sales chart */}
        <section className="panel chart-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Performance</span>
              <h2>Daily sales</h2>
            </div>
          </div>

          {trend.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient
                    id="salesFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#f97316"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#f97316"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#f97316"
                  fill="url(#salesFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              No historical sales series was returned by this dashboard
              endpoint.
            </div>
          )}
        </section>

        {/* Business workflow */}
        <section className="panel workflow-panel">
          <span className="eyebrow">Operating model</span>

          <h2>Business flow</h2>

          <div className="workflow-steps">
            {[
              'Supplier',
              'Purchase',
              'Store stock',
              'Truck load',
              'Truck stock',
              'Sale',
              'Payment / debt',
              'Stock events',
              'Reconcile',
              'Reports',
            ].map((step, index) => (
              <div key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>

                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
