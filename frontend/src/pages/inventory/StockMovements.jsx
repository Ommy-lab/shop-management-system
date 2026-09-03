import { useCallback } from 'react';

import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import inventoryService from '../../services/inventoryService';
import { useList } from '../../hooks/useRemote';
import { shortDate } from '../../utils/data';

export default function StockMovements() {
  const loader = useCallback(
    () => inventoryService.movements(),
    []
  );

  const {
    rows,
    loading,
    error,
    reload,
  } = useList(loader, 'movements');

  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title="Stock movements"
        description="Purchases, truck loads, returns, and adjustments recorded by the backend."
      />

      <div className="panel">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={reload}
          />
        ) : (
          <DataTable
            rows={rows}
            columns={[
              {
                key: 'created_at',
                label: 'Date',
                render: shortDate,
              },
              {
                key: 'product_name',
                label: 'Product',
              },
              {
                key: 'movement_type',
                label: 'Movement',
              },
              {
                key: 'quantity',
                label: 'Quantity',
              },
              {
                // The backend returns reference_type + reference_id,
                // not a single "reference" field.
                key: 'reference_id',
                label: 'Reference',
                render: (value, row) => {
                  const type =
                    row.reference_type
                      ?.replaceAll('_', ' ')
                      .replaceAll('TRUCK STOCK EVENT', 'TRUCK EVENT')
                      .replaceAll('TRUCK LOAD', 'TRUCK LOAD');

                  return `${type || '—'} #${value ?? '—'}`;
                },
              },
              {
                key: 'created_by_name',
                label: 'Recorded by',
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