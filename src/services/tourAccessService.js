import apiClient from './apiClient';

export async function requestAccess(tourId = 'bastet-temple-tour') {
  const res = await apiClient.post('/api/v1/tour-access/request', { tour_id: tourId });
  return res.data;
}

export async function getMyAccess() {
  const res = await apiClient.get('/api/v1/tour-access/me');
  return res.data;
}

export async function adminListRequests(params = {}) {
  const res = await apiClient.get('/api/v1/admin/tour-access/', { params });
  return res.data;
}

export async function approveRequest(requestId, { durationDays, expiresAt }) {
  const body = {};
  if (durationDays !== undefined) body.duration_days = durationDays;
  if (expiresAt !== undefined) body.expires_at = expiresAt;
  const res = await apiClient.patch(`/api/v1/admin/tour-access/${requestId}/approve`, body);
  return res.data;
}

export async function rejectRequest(requestId, rejectionReason) {
  const res = await apiClient.patch(`/api/v1/admin/tour-access/${requestId}/reject`, {
    rejection_reason: rejectionReason,
  });
  return res.data;
}

export async function revokeRequest(requestId) {
  const res = await apiClient.patch(`/api/v1/admin/tour-access/${requestId}/revoke`);
  return res.data;
}
