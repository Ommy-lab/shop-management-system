import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from './PageHeader';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import StatusBadge from './StatusBadge';
import { errorMessage, unwrap } from '../../utils/data';

export default function RecordDetails({
  title,
  service,
  fields,
  backTo,
  editTo,
  dataKey,
  children,
  loadFromList = false,
}) {
  const { id } = useParams();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * Load the requested record.
   *
   * For most entities, we can call:
   *     GET /api/entity/:id
   *
   * But some backend resources (such as Users) only provide:
   *     GET /api/users
   *
   * When loadFromList=true, we load the complete list and
   * find the record matching the ID from the URL.
   */
  const load = useCallback(async () => {
    if (!id) {
      setError('Record ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (loadFromList) {
        // Load all records instead of calling service.get(id).
        const response = await service.list();

        const body = response.data?.data ?? response.data;

        // Support the different response formats used by the API.
        const records = Array.isArray(body)
          ? body
          : body?.[dataKey] ??
            body?.items ??
            body?.rows ??
            [];

        // Find the record whose ID matches the URL parameter.
        const foundRecord = records.find(
          (item) => String(item.id) === String(id)
        );

        if (!foundRecord) {
          throw new Error(`${title} with ID ${id} was not found.`);
        }

        setRecord(foundRecord);
      } else {
        /*
         * Keep the original behavior for entities that have
         * a GET /api/entity/:id endpoint.
         */
        const response = await service.get(id);
        setRecord(unwrap(response, dataKey));
      }
    } catch (err) {
      setError(errorMessage(err));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [id, service, dataKey, loadFromList, title]);

  // Load the record whenever the ID or loading method changes.
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Record details"
        title={`${title} details`}
        action={
          record && editTo ? (
            <Link
              className="btn btn--primary"
              to={editTo.replace(':id', id)}
            >
              Edit {title}
            </Link>
          ) : null
        }
      />

      <div className="panel">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : (
          <>
            <dl className="details-grid">
              {fields.map((field) => (
                <div key={field.key}>
                  <dt>{field.label}</dt>

                  <dd>
                    {field.render ? (
                      field.render(record?.[field.key], record)
                    ) : field.key === 'status' ? (
                      <StatusBadge value={record?.[field.key]} />
                    ) : (
                      record?.[field.key] ?? '—'
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/*
             * Some detail pages provide additional actions such as
             * Reset Password or Assign Truck.
             */}
            {children?.(record)}

            <div className="form-actions">
              <Link className="btn btn--outline" to={backTo}>
                ← Back
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}