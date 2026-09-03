import { useCallback, useEffect, useState } from 'react';

import { asList, errorMessage, unwrap } from '../utils/data';

export function useList(loader, key) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setRows(asList(await loader(), key));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loader, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    rows,
    loading,
    error,
    reload,
    setRows,
  };
}

/*
 * Loads an endpoint that returns both:
 *
 * {
 *   sale: {...},
 *   payments: [...]
 * }
 *
 * This is useful for pages where we need the list AND
 * summary information belonging to that list.
 */
export function useListWithSummary(loader, listKey, summaryKey) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await loader();

      // Extract the list from the API response.
      setRows(asList(response, listKey));

      // Extract the summary object from the same response.
      setSummary(unwrap(response, summaryKey));
    } catch (err) {
      setError(errorMessage(err));
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [loader, listKey, summaryKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    rows,
    summary,
    loading,
    error,
    reload,
  };
}

export function useDetail(loader, id, key) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setRecord(unwrap(await loader(id), key));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loader, id, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    record,
    loading,
    error,
    reload,
  };
}
