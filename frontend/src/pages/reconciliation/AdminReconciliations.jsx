import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import reconciliationService from '../../services/reconciliationService';
import { useList } from '../../hooks/useRemote';

import {
  errorMessage,
  money,
  shortDate,
} from '../../utils/data';

import { useToast } from '../../context/ToastContext';

export default function AdminReconciliations() {
  /*
   * Load all reconciliations available to management.
   *
   * The backend decides which reconciliations the logged-in
   * administrator is allowed to see.
   */
  const loader = useCallback(
    () => reconciliationService.adminList(),
    []
  );

  const {
    rows,
    loading,
    error,
    reload,
  } = useList(loader, 'reconciliations');

  /*
   * action contains the reconciliation currently selected
   * for approval or rejection.
   *
   * Example:
   * {
   *   type: 'approve',
   *   row: {...}
   * }
   */
  const [action, setAction] = useState(null);

  /*
   * Used to prevent duplicate approve/reject requests.
   */
  const [working, setWorking] = useState(false);

  const { notify } = useToast();

  /*
   * Approve or reject the selected reconciliation.
   *
   * IMPORTANT:
   * The backend uses SUBMITTED as the status waiting
   * for administrator review.
   */
  const decide = async () => {
    if (!action?.row?.id || working) {
      return;
    }

    /*
     * Only SUBMITTED reconciliations can be reviewed.
     *
     * The backend also enforces this rule, but checking it
     * here prevents unnecessary API requests.
     */
    if (action.row.status !== 'SUBMITTED') {
      notify(
        'This reconciliation is no longer waiting for review.',
        'error'
      );

      setAction(null);
      return;
    }

    /*
     * Rejection requires a reason in the backend.
     *
     * The current ConfirmDialog does not appear to provide
     * an input field, so we collect the reason using the
     * browser prompt for now.
     *
     * We only ask for the reason when Reject is selected.
     */
    let rejectionReason = '';

    if (action.type === 'reject') {
      rejectionReason = window.prompt(
        'Enter the reason for rejecting this reconciliation:'
      );

      /*
       * If the administrator cancels the prompt, do not
       * submit the rejection.
       */
      if (rejectionReason === null) {
        return;
      }

      rejectionReason = rejectionReason.trim();

      /*
       * The backend requires a rejection reason.
       */
      if (!rejectionReason) {
        notify(
          'A rejection reason is required.',
          'error'
        );
        return;
      }
    }

    setWorking(true);

    try {
      if (action.type === 'approve') {
        /*
         * Approval does not require additional data.
         */
        await reconciliationService.approve(
          action.row.id
        );
      } else {
        /*
         * The backend expects the rejection reason.
         */
        await reconciliationService.reject(
          action.row.id,
          {
            reason: rejectionReason,
          }
        );
      }

      notify(
        action.type === 'approve'
          ? 'Reconciliation approved successfully.'
          : 'Reconciliation rejected successfully.',
        'success'
      );

      /*
       * Close the confirmation dialog.
       */
      setAction(null);

      /*
       * Reload the table so the new status appears
       * immediately.
       */
      await reload();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setWorking(false);
    }
  };

  /*
   * Open the approval confirmation dialog.
   *
   * IMPORTANT:
   * Backend status is SUBMITTED, not PENDING.
   */
  const requestApprove = (row) => {
    if (working || row.status !== 'SUBMITTED') {
      return;
    }

    setAction({
      type: 'approve',
      row,
    });
  };

  /*
   * Open the rejection confirmation dialog.
   *
   * The rejection reason is requested when the administrator
   * confirms the rejection.
   */
  const requestReject = (row) => {
    if (working || row.status !== 'SUBMITTED') {
      return;
    }

    setAction({
      type: 'reject',
      row,
    });
  };

  /*
   * Table columns.
   */
  const columns = [
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
      key: 'salesperson_name',
      label: 'Salesperson',
    },

    {
      key: 'total_sales',
      label: 'Sales',
      render: money,
    },

    {
      key: 'submitted_cash',
      label: 'Submitted',
      render: money,
    },

    {
      key: 'cash_difference',
      label: 'Difference',
      render: money,
    },

    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge value={value} />
      ),
    },

    {
      key: 'actions',
      label: 'Actions',

      render: (_, row) => (
        <div className="table-actions">
          {/* Open the full reconciliation record. */}
          <Link
            className="btn btn--small btn--outline"
            to={`/reconciliation/admin/${row.id}`}
          >
            View
          </Link>

          {/*
           * IMPORTANT:
           * The backend creates a submitted reconciliation
           * with status = SUBMITTED.
           *
           * Therefore these buttons MUST check SUBMITTED.
           */}
          {row.status === 'SUBMITTED' && (
            <>
              <button
                type="button"
                className="btn btn--small btn--success"
                disabled={working}
                onClick={() => requestApprove(row)}
              >
                Approve
              </button>

              <button
                type="button"
                className="btn btn--small btn--danger-ghost"
                disabled={working}
                onClick={() => requestReject(row)}
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Management review"
        title="Reconciliations"
        description="Review and explicitly approve or reject submitted truck-day balances."
      />

      <div className="panel">
        {loading ? (
          <LoadingSpinner
            label="Loading reconciliations…"
          />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={reload}
          />
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            emptyTitle="No reconciliation records found"
          />
        )}
      </div>

      {/*
       * Approval/rejection confirmation dialog.
       *
       * For rejection, the actual reason is collected after
       * the administrator confirms this dialog.
       */}
      <ConfirmDialog
        open={Boolean(action)}

        title={
          action?.type === 'approve'
            ? 'Approve reconciliation'
            : 'Reject reconciliation'
        }

        message={
          action?.row
            ? `${
                action.type === 'approve'
                  ? 'Approve'
                  : 'Reject'
              } the reconciliation for ${
                action.row.truck_name ||
                'the selected truck'
              } submitted by ${
                action.row.salesperson_name ||
                'the salesperson'
              }? Submitted cash: ${money(
                action.row.submitted_cash
              )}.`
            : ''
        }

        danger={action?.type === 'reject'}

        confirmLabel={
          action?.type === 'approve'
            ? 'Approve'
            : 'Reject'
        }

        loading={working}

        onClose={() => {
          if (!working) {
            setAction(null);
          }
        }}

        onConfirm={decide}
      />
    </>
  );
}