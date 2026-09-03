import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageHeader from './PageHeader';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

import { useToast } from '../../context/ToastContext';
import { errorMessage, unwrap } from '../../utils/data';

/*
 * Renders the correct form control based on the field definition.
 */
const control = (field, value, onChange) => {
  const common = {
    label: field.label,
    name: field.name,
    value: value ?? '',
    required: field.required,
    onChange: (e) => onChange(field.name, e.target.value),
  };

  if (field.type === 'select') {
    return (
      <FormSelect
        key={field.name}
        {...common}
        options={field.options}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <FormTextarea
        key={field.name}
        {...common}
        rows={4}
      />
    );
  }

  return (
    <FormInput
      key={field.name}
      {...common}
      type={field.type || 'text'}
      min={field.min}
      step={field.step}
      placeholder={field.placeholder}
    />
  );
};

export default function EntityForm({
  title,
  service,
  fields,
  backTo,
  dataKey,
  initial = {},
  loadFromList = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  /*
   * Keep the initial values stable.
   *
   * This prevents an object such as { status: 'ACTIVE' }
   * from being treated as a new dependency on every render.
   */
  const initialRef = useRef(initial);

  const [form, setForm] = useState(initialRef.current);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /*
   * Load existing data when editing.
   */
  useEffect(() => {
    /*
     * If there is no ID, this is the CREATE page.
     * No existing record needs to be loaded.
     */
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadRecord = async () => {
      setLoading(true);
      setError('');

      try {
        let record;

        if (loadFromList) {
          /*
           * Some backend resources do not provide:
           *
           * GET /resource/:id
           *
           * Users are one example.
           *
           * Instead we call:
           *
           * GET /users
           *
           * and find the requested record locally.
           */
          const response = await service.list();

          const body = response.data?.data ?? response.data;

          /*
           * Support different API response structures.
           *
           * For users:
           *
           * {
           *   success: true,
           *   users: [...]
           * }
           */
          const records = Array.isArray(body)
            ? body
            : body?.[dataKey] ??
              body?.items ??
              body?.rows ??
              [];

          /*
           * Find the record whose ID matches the URL.
           */
          record = records.find(
            (item) => String(item.id) === String(id)
          );

          if (!record) {
            throw new Error(`${title} not found`);
          }
        } else {
          /*
           * Normal entities can continue using:
           *
           * GET /resource/:id
           */
          const response = await service.get(id);

          record = unwrap(response, dataKey);
        }

        /*
         * Don't update state if the component was unmounted
         * while the API request was still running.
         */
        if (!cancelled) {
          setForm({
            ...initialRef.current,
            ...record,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRecord();

    /*
     * Prevent state updates after the component is unmounted.
     */
    return () => {
      cancelled = true;
    };
  }, [
    id,
    service,
    dataKey,
    loadFromList,
    title,
  ]);

  /*
   * Update one field in the form.
   */
  const change = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * Create or update the record.
   */
  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      if (id) {
        /*
         * EDIT:
         *
         * PUT /api/users/:id
         */
        await service.update(id, form);
      } else {
        /*
         * CREATE:
         *
         * POST /api/users
         */
        await service.create(form);
      }

      notify(
        `${title} ${id ? 'updated' : 'created'} successfully.`,
        'success'
      );

      navigate(backTo);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={id ? 'Edit record' : 'New record'}
        title={`${id ? 'Edit' : 'Add'} ${title}`}
        description="Complete the required business details below."
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <form
          className="panel form-card"
          onSubmit={submit}
        >
          <ErrorMessage message={error} />

          <div className="form-grid">
            {fields.map((field) =>
              control(
                field,
                form[field.name],
                change
              )
            )}
          </div>

          <div className="form-actions">
            <Link
              className="btn btn--ghost"
              to={backTo}
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : `Save ${title}`}
            </button>
          </div>
        </form>
      )}
    </>
  );
}