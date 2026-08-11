import { useState, useEffect, useCallback } from 'react';
import * as service from '../services/tourAccessService';
import { getErrorMessage } from '../utils/errorHelper';
import { useI18n } from '../i18n';

export function useTourAccess() {
  const { t } = useI18n();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccess = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.getMyAccess();
      setAccess(data);
    } catch (err) {
      setError(getErrorMessage(err, t('gate.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const requestAccess = async () => {
    setError('');
    try {
      const data = await service.requestAccess();
      setAccess(data);
      return data;
    } catch (err) {
      const errMsg = getErrorMessage(err, t('gate.requestFailed'));
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  return {
    access,
    loading,
    error,
    requestAccess,
    canAccess: !!access?.can_access,
    effectiveStatus: access?.effective_status || null,
    refetch: fetchAccess,
  };
}

export function useAdminTourAccess(filters = {}) {
  const { t } = useI18n();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.adminListRequests(filters);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, t('gate.loadRequestsFailed')));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), t]);

  const approve = async (requestId, options) => {
    setError('');
    try {
      await service.approveRequest(requestId, options);
      await fetchRequests();
    } catch (err) {
      const errMsg = getErrorMessage(err, t('gate.approveFailed'));
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const reject = async (requestId, reason) => {
    setError('');
    try {
      await service.rejectRequest(requestId, reason);
      await fetchRequests();
    } catch (err) {
      const errMsg = getErrorMessage(err, t('gate.rejectFailed'));
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const revoke = async (requestId) => {
    setError('');
    try {
      await service.revokeRequest(requestId);
      await fetchRequests();
    } catch (err) {
      const errMsg = getErrorMessage(err, t('gate.revokeFailed'));
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    approve,
    reject,
    revoke,
    refetch: fetchRequests,
  };
}
