import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import FormInput from '../../components/common/FormInput';
import FormTextarea from '../../components/common/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import reconciliationService from '../../services/reconciliationService';

import {
  errorMessage,
  money,
  unwrap,
} from '../../utils/data';

import { useToast } from '../../context/ToastContext';

export default function Reconciliation() {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [data, setData] = useState({});
  const [submittedCash, setSubmittedCash] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
   * Load today's reconciliation.
   *
   * The backend now returns one of two states:
   *
   * 1. reconciled: false
   *    -> No reconciliation has been submitted yet.
   *    -> Backend gives us a live calculation/preview.
   *
   * 2. reconciled: true
   *    -> A reconciliation already exists for today.
   *    -> The returned record should be displayed read-only.
   */
  useEffect(() => {
    reconciliationService
      .today()
      .then((response) => {
        const reconciliation = unwrap(
          response,
          'reconciliation'
        );

        setData(reconciliation || {});

        /*
         * If the reconciliation has already been submitted,
         * populate the existing values so the page remains
         * informative without requiring another submission.
         */
        if (reconciliation?.submitted_cash !== undefined) {
          setSubmittedCash(
            String(reconciliation.submitted_cash ?? '')
          );
        }

        if (reconciliation?.notes) {
          setNotes(reconciliation.notes);
        }
      })
      .catch((err) => {
        setError(errorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /*
   * The backend explicitly tells us whether today's
   * reconciliation already exists.
   *
   * This is more reliable than trying to infer the state
   * from status alone.
   */
  const alreadyReconciled = data.reconciled === true;

  /*
   * Expected cash is calculated by the backend.
   *
   * We use the backend value instead of trying to
   * recalculate sales/payments/expenses on the frontend.
   */
  const expected = Number(data.expected_cash || 0);

  /*
   * For a new reconciliation, calculate the difference
   * from the amount currently entered by the salesperson.
   *
   * For an already submitted reconciliation, use the
   * backend's saved cash_difference value instead.
   */
  const enteredCash = Number(submittedCash || 0);

  const difference = alreadyReconciled
    ? Number(data.cash_difference || 0)
    : enteredCash - expected;

  /*
   * Submit today's reconciliation.
   */
  const close = async () => {
    /*
     * Prevent accidental duplicate submission even if
     * the user somehow opens the confirmation dialog
     * while the record has already been reconciled.
     */
    if (alreadyReconciled) {
      setConfirm(false);
      return;
    }

    const cash = Number(submittedCash);

    /*
     * Basic frontend validation.
     *
     * The backend remains the final authority and will
     * validate the request again.
     */
    if (!Number.isFinite(cash) || cash < 0) {
      setError('Please enter a valid submitted cash amount.');
      setConfirm(false);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await reconciliationService.close({
        submitted_cash: cash,
        notes,
      });

      notify(
        'Daily reconciliation submitted for management review.',
        'success'
      );

      /*
       * After successful submission, go to history.
       * The submitted record will then be available there.
       */
      navigate('/reconciliation/history');
    } catch (err) {
      setError(errorMessage(err));
      setConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        label="Preparing today's reconciliation…"
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Daily close"
        title="Truck reconciliation"
        description={
          alreadyReconciled
            ? 'Review the reconciliation already submitted for today.'
            : 'Compare sales, collections, expenses, and stock events before submitting cash.'
        }
        action={
          <Link
            className="btn btn--outline"
            to="/reconciliation/history"
          >
            View history
          </Link>
        }
      />

      <ErrorMessage message={error} />

      {/*
       * Show a clear status banner when today's
       * reconciliation has already been submitted.
       */}
      {alreadyReconciled && (
        <div className="workflow-banner">
          <span>
            <strong>Today's reconciliation has already been submitted.</strong>
          </span>

          <span>
            Status: {data.status || 'SUBMITTED'}
          </span>

          {data.reconciliation_date && (
            <span>
              Date:{' '}
              {new Date(
                data.reconciliation_date
              ).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Financial summary */}
      <div className="summary-grid">
        <SummaryCard
          label="Today's sales"
          value={money(data.total_sales)}
        />

        <SummaryCard
          label="Total collected"
          value={money(data.total_collected)}
          tone="green"
        />

        <SummaryCard
          label="Outstanding credit"
          value={money(data.outstanding_credit)}
          tone="red"
        />

        <SummaryCard
          label="Expenses"
          value={money(data.total_expenses)}
          tone="blue"
        />
      </div>

      <div className="panel reconciliation-grid">
        {/* Payment/collection breakdown */}
        <section>
          <h3>Collection breakdown</h3>

          <dl className="ledger">
            <div>
              <dt>Cash</dt>
              <dd>
                {money(data.cash_payments)}
              </dd>
            </div>

            <div>
              <dt>Mobile money</dt>
              <dd>
                {money(data.mobile_money_payments)}
              </dd>
            </div>

            <div>
              <dt>Card</dt>
              <dd>
                {money(data.card_payments)}
              </dd>
            </div>

            <div>
              <dt>Expenses</dt>
              <dd>
                − {money(data.total_expenses)}
              </dd>
            </div>

            <div className="ledger__total">
              <dt>Expected cash</dt>
              <dd>
                {money(expected)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Stock accountability events */}
        <section>
          <h3>Stock events</h3>

          <dl className="ledger">
            <div>
              <dt>Returned</dt>
              <dd>
                {data.returned_quantity || 0}
              </dd>
            </div>

            <div>
              <dt>Damaged</dt>
              <dd>
                {data.damaged_quantity || 0}
              </dd>
            </div>

            <div>
              <dt>Lost</dt>
              <dd>
                {data.lost_quantity || 0}
              </dd>
            </div>

            <div>
              <dt>Expired</dt>
              <dd>
                {data.expired_quantity || 0}
              </dd>
            </div>
          </dl>
        </section>

        {/*
         * CASH SUBMISSION
         *
         * If today's reconciliation is already saved,
         * do NOT show the submission form.
         *
         * This prevents duplicate daily reconciliations.
         */}
        {alreadyReconciled ? (
          <section>
            <h3>Submitted reconciliation</h3>

            <dl className="ledger">
              <div>
                <dt>Submitted cash</dt>
                <dd>
                  {money(data.submitted_cash)}
                </dd>
              </div>

              <div>
                <dt>Expected cash</dt>
                <dd>
                  {money(data.expected_cash)}
                </dd>
              </div>

              <div className="ledger__total">
                <dt>Cash difference</dt>
                <dd>
                  {money(data.cash_difference)}
                </dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>
                  {data.status || 'SUBMITTED'}
                </dd>
              </div>
            </dl>

            {data.notes && (
              <div className="form-field">
                <label>Notes</label>

                <div className="field-display">
                  {data.notes}
                </div>
              </div>
            )}

            <p className="muted">
              This reconciliation has already been submitted
              and cannot be submitted again.
            </p>
          </section>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setConfirm(true);
            }}
          >
            <h3>Cash submission</h3>

            <FormInput
              label="Submitted cash"
              type="number"
              min="0"
              step="0.01"
              value={submittedCash}
              onChange={(event) =>
                setSubmittedCash(event.target.value)
              }
              required
            />

            {/*
             * Display the difference immediately as the
             * salesperson enters the physical cash amount.
             */}
            <div
              className={`difference ${
                difference === 0
                  ? 'difference--ok'
                  : 'difference--warn'
              }`}
            >
              <span>Cash difference</span>

              <strong>
                {money(difference)}
              </strong>
            </div>

            <FormTextarea
              label="Notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />

            <button
              type="submit"
              className="btn btn--primary btn--wide"
              disabled={saving}
            >
              Close truck day
            </button>
          </form>
        )}
      </div>

      {/*
       * Confirmation dialog is only meaningful when
       * submitting a brand-new reconciliation.
       */}
      <ConfirmDialog
        open={confirm && !alreadyReconciled}
        title="Close truck day"
        message={`Submit ${money(
          submittedCash
        )} cash with a ${money(
          difference
        )} difference for management review?`}
        confirmLabel="Submit reconciliation"
        loading={saving}
        onClose={() => setConfirm(false)}
        onConfirm={close}
      />
    </>
  );
}