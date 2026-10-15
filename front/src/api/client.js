export async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: payload,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.code || 'REQUEST_FAILED');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}
