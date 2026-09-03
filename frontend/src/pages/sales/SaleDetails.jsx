import { Link, useParams } from 'react-router-dom';

import RecordDetails from '../../components/common/RecordDetails';
import saleService from '../../services/saleService';

import { money, shortDate } from '../../utils/data';


/**
 * SaleDetails
 *
 * Displays the details of a single sale.
 *
 * Backend response:
 *
 * {
 *   success: true,
 *   sale: {
 *     id,
 *     truck_id,
 *     customer_id,
 *     salesperson_id,
 *     sale_date,
 *     total_amount,
 *     payment_status,
 *     notes,
 *     created_at,
 *     updated_at,
 *     customer_name,
 *     business_name,
 *     phone,
 *     location,
 *     items: [...]
 *   }
 * }
 *
 * Important:
 * The backend does NOT currently return:
 * - reference
 * - paid_amount
 * - remaining_balance
 *
 * Therefore this component only displays values that actually
 * exist in the API response.
 */
export default function SaleDetails() {
  const { id } = useParams();

  return (
    <RecordDetails
      title="Sale"
      service={saleService}
      dataKey="sale"
      backTo="/sales"

      fields={[
        /**
         * The backend does not have a "reference" field.
         * Use the sale ID as the reference.
         */
        {
          key: 'id',
          label: 'Reference',
          render: (value) => `#${value}`,
        },

        /**
         * Use sale_date because it represents when the sale
         * actually occurred.
         */
        {
          key: 'sale_date',
          label: 'Date',
          render: shortDate,
        },

        /**
         * Customer information.
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
         * Customer phone number.
         */
        {
          key: 'phone',
          label: 'Phone',
        },

        /**
         * Customer location.
         */
        {
          key: 'location',
          label: 'Location',
        },

        /**
         * Backend field is total_amount, not total.
         */
        {
          key: 'total_amount',
          label: 'Sale total',
          render: money,
        },

        /**
         * Payment status is provided directly by the backend.
         */
        {
          key: 'payment_status',
          label: 'Status',
        },

        /**
         * Notes can be null, so RecordDetails should handle
         * the missing value gracefully.
         */
        {
          key: 'notes',
          label: 'Notes',
        },
      ]}
    >
      {(record) => (
        <>
          {/* ---------------------------------------------------
              SOLD PRODUCTS
              --------------------------------------------------- */}

          <div className="nested-records">
            <h3>Sold products</h3>

            {Array.isArray(record?.items) &&
            record.items.length > 0 ? (
              record.items.map((item, index) => (
                <div key={item.id || index}>

                  {/* Product name */}
                  <span>
                    {item.product_name}
                  </span>

                  {/* Quantity × selling price */}
                  <span>
                    {item.quantity} ×{' '}
                    {money(item.selling_price)}
                  </span>

                  {/* Line subtotal */}
                  <strong>
                    {money(item.subtotal)}
                  </strong>

                </div>
              ))
            ) : (
              <p>No products were recorded for this sale.</p>
            )}
          </div>


          {/* ---------------------------------------------------
              PAYMENT ACTIONS
              --------------------------------------------------- */}

          <div className="inline-actions">

            {/* Open payment form for this sale */}
            <Link
              className="btn btn--primary"
              to={`/sales/${id}/payment`}
            >
              Record payment
            </Link>

            {/* View previous payments */}
            <Link
              className="btn btn--outline"
              to={`/sales/${id}/payments`}
            >
              Payment history
            </Link>

          </div>
        </>
      )}
    </RecordDetails>
  );
}
