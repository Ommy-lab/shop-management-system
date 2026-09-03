import EntityList from '../../components/common/EntityList';
import expenseService from '../../services/expenseService';
import { money, shortDate } from '../../utils/data';

export default function Expenses() {
  return (
    <EntityList
      title="Expenses"
      eyebrow="Route costs"
      description="Record and review expenses for the authenticated salesperson."

      service={expenseService}

      // Backend response:
      // { success: true, count: 2, expenses: [...] }
      dataKey="expenses"

      // These fields exist in the backend response.
      searchFields={['category', 'description']}

      addTo="/expenses/new"
      detailBase="/expenses"

      columns={[
        // Backend uses expense_date, not date.
        {
          key: 'expense_date',
          label: 'Date',
          render: shortDate,
        },

        {
          key: 'category',
          label: 'Category',
        },

        {
          key: 'description',
          label: 'Description',
        },

        {
          key: 'amount',
          label: 'Amount',
          render: money,
        },
      ]}
    />
  );
}
