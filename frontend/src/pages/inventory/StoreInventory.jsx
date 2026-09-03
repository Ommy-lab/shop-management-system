import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';

import inventoryService from '../../services/inventoryService';

import {
  asList,
  errorMessage,
  money,
  unwrap,
} from '../../utils/data';


/**
 * StoreInventory
 *
 * Displays the current central/store inventory.
 *
 * The backend provides two separate responses:
 *
 * 1. inventoryService.store()
 *    {
 *      success: true,
 *      count: 2,
 *      inventory: [...]
 *    }
 *
 * 2. inventoryService.summary()
 *    {
 *      success: true,
 *      summary: {
 *        total_products: "2",
 *        total_units: "120",
 *        total_stock_value: "96000.00",
 *        low_stock_products: "0"
 *      }
 *    }
 *
 * The component keeps these two datasets separate:
 * - rows    -> inventory table
 * - summary -> summary cards
 */
export default function StoreInventory() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  /**
   * Load both the inventory records and inventory summary.
   */
  const load = () => {
    setLoading(true);
    setError('');

    Promise.all([
      inventoryService.store(),
      inventoryService.summary(),
    ])
      .then(([list, stats]) => {
        /**
         * The inventory endpoint returns:
         *
         * {
         *   success: true,
         *   count: 2,
         *   inventory: [...]
         * }
         *
         * Therefore "inventory" is the correct data key.
         */
        setRows(asList(list, 'inventory'));

        /**
         * The summary endpoint returns:
         *
         * {
         *   success: true,
         *   summary: {...}
         * }
         */
        setSummary(unwrap(stats, 'summary'));
      })
      .catch((e) => {
        setError(errorMessage(e));
      })
      .finally(() => {
        setLoading(false);
      });
  };


  /**
   * Load inventory when the page first opens.
   */
  useEffect(() => {
    load();
  }, []);


  /**
   * Filter inventory records according to the search text.
   *
   * We search by:
   * - product name
   * - SKU
   */
  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();

    if (!search) {
      return rows;
    }

    return rows.filter((row) =>
      `${row.product_name || row.name || ''} ${row.sku || ''}`
        .toLowerCase()
        .includes(search)
    );
  }, [rows, query]);


  return (
    <>
      <PageHeader
        eyebrow="Central stock"
        title="Store inventory"
        description="Live quantities received from purchases and reduced by confirmed truck loads."
      />


      {/* ---------------------------------------------------------
          INVENTORY SUMMARY
          --------------------------------------------------------- */}

      <div className="summary-grid">

        {/* Total value of all inventory */}
        <SummaryCard
          label="Stock value"
          value={money(summary.total_stock_value)}
          icon="▦"
          tone="green"
        />


        {/* Number of different products */}
        <SummaryCard
          label="Products in stock"
          value={summary.total_products ?? '—'}
          icon="▣"
          tone="blue"
        />


        {/* Total physical units across all products */}
        <SummaryCard
          label="Total units"
          value={summary.total_units ?? '—'}
          icon="◉"
          tone="orange"
        />


        {/* Number of products that are at/below minimum stock */}
        <SummaryCard
          label="Low stock items"
          value={summary.low_stock_products ?? '—'}
          icon="⚠"
          tone="red"
        />

      </div>


      {/* ---------------------------------------------------------
          INVENTORY TABLE
          --------------------------------------------------------- */}

      <div className="panel">

        <div className="toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
          />
        </div>


        {/* Loading state */}
        {loading ? (
          <LoadingSpinner label="Loading store inventory…" />
        ) : error ? (

          /* Error state */
          <ErrorMessage
            message={error}
            onRetry={load}
          />

        ) : (

          /* Inventory table */
          <DataTable
            rows={filtered}

            columns={[
              {
                key: 'product_name',
                label: 'Product',

                // Backend uses product_name.
                // The fallback to name makes the table
                // tolerant of another possible response shape.
                render: (value, row) =>
                  value || row.name || '—',
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
                key: 'buying_price',
                label: 'Buying price',
                render: money,
              },

              {
                key: 'selling_price',
                label: 'Selling price',
                render: money,
              },

              {
                key: 'stock_value',
                label: 'Stock value',

                /**
                 * The backend already provides stock_value,
                 * for example:
                 *
                 * "stock_value": "56000.00"
                 *
                 * Use it directly.
                 *
                 * The fallback calculation is kept in case
                 * an older backend response doesn't provide it.
                 */
                render: (value, row) =>
                  money(
                    value ??
                    Number(row.quantity || 0) *
                    Number(row.buying_price || 0)
                  ),
              },

              {
                key: 'status',
                label: 'Status',

                /**
                 * Backend provides:
                 *
                 * is_low_stock: true / false
                 *
                 * Use that authoritative value when available.
                 *
                 * If it isn't available, calculate the status
                 * using quantity and minimum_stock.
                 */
                render: (value, row) => {
                  const status =
                    typeof row.is_low_stock === 'boolean'
                      ? (
                          row.is_low_stock
                            ? 'LOW_STOCK'
                            : 'IN_STOCK'
                        )
                      : (
                          Number(row.quantity || 0) <=
                          Number(row.minimum_stock || 0)
                            ? 'LOW_STOCK'
                            : 'IN_STOCK'
                        );

                  return (
                    <StatusBadge value={status} />
                  );
                },
              },
            ]}

            emptyTitle="No inventory records found"
          />
        )}
      </div>
    </>
  );
}
