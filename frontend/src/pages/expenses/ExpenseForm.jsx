import EntityForm from '../../components/common/EntityForm';
import expenseService from '../../services/expenseService';
import { today } from '../../utils/data';

/*
 * Expense form fields.
 *
 * The field names should match the backend API.
 */
const fields = [
  {
    name: 'category',
    label: 'Category',
    required: true,
  },

  {
    name: 'amount',
    label: 'Amount',
    type: 'number',
    min: '0.01',
    step: '0.01',
    required: true,
  },

  /*
   * Backend uses expense_date.
   *
   * This replaces the old "date" field.
   */
  {
    name: 'expense_date',
    label: 'Date',
    type: 'date',
    required: true,
  },

  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
  },
];

export default function ExpenseForm() {
  return (
    <EntityForm
      title="Expense"
      service={expenseService}
      fields={fields}
      backTo="/expenses"

      /*
       * Pre-fill the expense date with today's date.
       */
      initial={{
        expense_date: today(),
      }}
    />
  );
}
