import EntityList from '../../components/common/EntityList';
import StatusBadge from '../../components/common/StatusBadge';
import saleService from '../../services/saleService';
import { money, shortDate } from '../../utils/data';

/**
 * Sales
 *
 * Displays sales available to the authenticated salesperson.
 *
 * Backend response:
 *
 * {
 *   success: true,
 *   count: 4,
 *   sales: [
 *     {
 *       id,
 *       sale_date,
 *       total_amount,
 *       payment_status,
 *       notes,
 *       created_at,
 *       customer_name,
 *       business_name
 *     }
 *   ]
 * }
 *
 * Important:
 * The sales list endpoint does NOT return:
 * - reference
 * - paid_amount
 *
 * Therefore, the table must use the fields actually
 * returned by the backend.
 */
export default function Sales() {
  return (
    <EntityList
      title="Sales"
      eyebrow="Truck → customer"
      description="Sales are limited by the backend to the authenticated salesperson's route."

      service={saleService}

      // Backend response contains "sales".
      dataKey="sales"

      // Search only fields that actually exist in the response.
      searchFields={[
        'customer_name',
        'business_name',
        'payment_status',
      ]}

      addTo="/sales/new"
      detailBase="/sales"

      columns={[
        /**
         * Actual sale date.
         *
         * The backend provides sale_date, which is more
         * appropriate here than created_at because this
         * represents when the sale happened.
         */
        {
          key: 'sale_date',
          label: 'Date',
          render: shortDate,
        },

        /**
         * The backend doesn't provide a reference number.
         * Use the sale ID as a simple reference.
         */
        {
          key: 'id',
          label: 'Reference',
          render: (value) => `#${value}`,
        },

        /**
         * Customer name.
         */
        {
          key: 'customer_name',
          label: 'Customer',
        },

        /**
         * Business/shop belonging to the customer.
         */
        {
          key: 'business_name',
          label: 'Business',
        },

        /**
         * Backend field is total_amount, not total.
         */
        {
          key: 'total_amount',
          label: 'Total',
          render: money,
        },

        /**
         * paid_amount is NOT included in the list response,
         * so we do not display it here.
         *
         * Payment details can be shown on the sale details page
         * if the details endpoint provides them.
         */
        {
          key: 'payment_status',
          label: 'Status',
          render: (value) => (
            <StatusBadge value={value} />
          ),
        },
      ]}
    />
  );
}
