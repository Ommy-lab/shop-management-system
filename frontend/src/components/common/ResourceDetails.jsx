import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from './PageHeader';
import StatusBadge from './StatusBadge';
import ErrorMessage from './ErrorMessage';
import { getApiMessage, money } from '../../utils/data.js';

export default function ResourceDetails({ title, service, path }) {
  const { id } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setError('');

        // Request the individual record from the backend.
        const response = await service.get(id);

        console.log('ResourceDetails - API Response:', response.data);

        const responseData = response.data;

        /*
         * Backends can return different response structures.
         *
         * Examples:
         *
         * { data: { ... } }
         * { product: { ... } }
         * { user: { ... } }
         * { customer: { ... } }
         * { supplier: { ... } }
         *
         * First use "data" when available.
         * Otherwise find the object containing the actual record.
         */
        let record = responseData?.data;

        if (!record && responseData && typeof responseData === 'object') {
          record = Object.values(responseData).find(
            (value) =>
              value &&
              typeof value === 'object' &&
              !Array.isArray(value)
          );
        }

        console.log('ResourceDetails - Record:', record);

        setData(record || {});
      } catch (error) {
        console.error('ResourceDetails - Error:', error);
        setError(getApiMessage(error));
      }
    };

    loadDetails();
  }, [id, service]);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <div className="table-state">Loading details...</div>;
  }

  return (
    <>
      <PageHeader
        title={`${title} Details`}
        action={
          <button
            className="btn btn--secondary"
            onClick={() => nav(path)}
          >
            Back
          </button>
        }
      />

      <div className="details-grid">
        {Object.entries(data).map(([key, value]) => (
          <div className="detail-item" key={key}>
            <span>
              {key
                .replaceAll('_', ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>

            <strong>
              {key === 'status' ? (
                <StatusBadge value={value} />
              ) : [
                  'buying_price',
                  'selling_price',
                  'price',
                  'amount',
                ].includes(key) ? (
                money(value)
              ) : (
                String(value ?? '—')
              )}
            </strong>
          </div>
        ))}
      </div>
    </>
  );
}