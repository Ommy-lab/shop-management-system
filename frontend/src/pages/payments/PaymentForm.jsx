import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/common/SummaryCard';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import ErrorMessage from '../../components/common/ErrorMessage';

import saleService from '../../services/saleService';
import paymentService from '../../services/paymentService';

import { errorMessage, money, unwrap } from '../../utils/data';
import { useToast } from '../../context/ToastContext';

export default function PaymentForm() {
  const { saleId } = useParams();
  const nav = useNavigate();
  const { notify } = useToast();

  const [sale, setSale] = useState({});
  const [form, setForm] = useState({
    amount: '',
    payment_method: 'CASH',
    transaction_reference: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  /*
   * Load the sale so we know:
   * - total_amount
   * - amount_paid
   * - balance
   */
  useEffect(() => {
    saleService
      .get(saleId)
      .then((response) => {
        const saleData = unwrap(response, 'sale');

        setSale(saleData);
      })
      .catch((err) => {
        setError(errorMessage(err));
      });
  }, [saleId]);

  /*
   * IMPORTANT:
   * The backend uses these exact field names:
   *
   * total_amount → original sale value
   * amount_paid  → amount already collected
   * balance      → amount still outstanding
   *
   * Use the backend's balance directly.
   *
   * The fallback calculation is included for safety in case
   * an older endpoint does not provide balance.
   */
  const totalAmount = Number(sale.total_amount ?? 0);
  const amountPaid = Number(sale.amount_paid ?? 0);

  const remaining =
    sale.balance !== undefined && sale.balance !== null
      ? Number(sale.balance)
      : Math.max(totalAmount - amountPaid, 0);

  /*
   * Handle payment submission.
   */
  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const amount = Number(form.amount);

    /*
     * Prevent invalid payment amounts on the frontend.
     * The backend must still perform its own validation.
     */
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (amount > remaining) {
      setError(
        `Payment cannot exceed the remaining balance of ${money(remaining)}.`
      );
      return;
    }

    setSaving(true);

    try {
      await paymentService.create(saleId, {
        ...form,
        amount,
      });

      notify('Payment recorded successfully.', 'success');

      nav(`/sales/${saleId}/payments`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Collect payment"
        title="Record sale payment"
        description="Record cash, mobile money, or card payments against the outstanding sale balance."
      />

      <div className="summary-grid">
        <SummaryCard
          label="Sale total"
          value={money(totalAmount)}
        />

        <SummaryCard
          label="Paid"
          value={money(amountPaid)}
          tone="green"
        />

        <SummaryCard
          label="Remaining"
          value={money(remaining)}
          tone="red"
        />
      </div>

      <form className="panel form-card" onSubmit={submit}>
        <ErrorMessage message={error} />

        <div className="form-grid">
          <FormInput
            label="Payment amount"
            type="number"
            min="0.01"
            max={remaining > 0 ? remaining : undefined}
            step="0.01"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
            required
          />

          <FormSelect
            label="Payment method"
            value={form.payment_method}
            onChange={(e) =>
              setForm({
                ...form,
                payment_method: e.target.value,
              })
            }
            options={['CASH', 'MOBILE_MONEY', 'CARD'].map((value) => ({
              value,
              label: value.replace('_', ' '),
            }))}
            required
          />

          <FormInput
            label="Transaction reference"
            value={form.transaction_reference}
            onChange={(e) =>
              setForm({
                ...form,
                transaction_reference: e.target.value,
              })
            }
          />
        </div>

        <FormTextarea
          label="Notes"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
        />

        <div className="form-actions">
          <Link
            className="btn btn--ghost"
            to={`/sales/${saleId}`}
          >
            Cancel
          </Link>

          <button
            className="btn btn--primary"
            disabled={saving || remaining <= 0}
          >
            {saving ? 'Recording…' : 'Record payment'}
          </button>
        </div>
      </form>
    </>
  );
}