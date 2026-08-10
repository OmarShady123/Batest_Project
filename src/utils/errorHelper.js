export function getErrorMessage(err, fallbackMessage = '') {
  if (!err) return fallbackMessage;

  const data = err.response?.data;
  if (data) {
    if (data.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (data.detail.message) return data.detail.message;
    }
    if (data.message) return data.message;
  }

  if (err.message) return err.message;

  return fallbackMessage;
}
