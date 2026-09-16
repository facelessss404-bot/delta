const storageUrl = () => String(process.env.SUPABASE_URL || '').replace(/\/$/, '');

const config = () => {
  const url = storageUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  return { url, key };
};

const encodedKey = (key) => key.split('/').map(encodeURIComponent).join('/');
const request = async (path, options = {}) => {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...options.headers },
  });
  if (!response.ok) throw new Error(`Supabase Storage request failed (${response.status}): ${await response.text()}`);
  return response;
};

const uploadBuffer = ({ bucket, key, buffer, contentType }) => request(
  `/object/${encodeURIComponent(bucket)}/${encodedKey(key)}`,
  { method: 'POST', headers: { 'Content-Type': contentType, 'x-upsert': 'false' }, body: buffer },
);

const downloadObject = ({ bucket, key }) => request(`/object/${encodeURIComponent(bucket)}/${encodedKey(key)}`);

const readObjectPrefix = async ({ bucket, key, bytes = 4096 }) => {
  const response = await request(`/object/${encodeURIComponent(bucket)}/${encodedKey(key)}`, {
    headers: { Range: `bytes=0-${Math.max(0, bytes - 1)}` },
  });
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || '' };
};

const removeObject = ({ bucket, key }) => request(`/object/${encodeURIComponent(bucket)}`, {
  method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [key] }),
});

const createSignedUpload = async ({ bucket, key }) => {
  const response = await request(`/object/upload/sign/${encodeURIComponent(bucket)}/${encodedKey(key)}`, { method: 'POST' });
  const data = await response.json();
  if (!data.url || !data.token) throw new Error('Supabase Storage did not return a valid signed upload URL.');
  return { uploadUrl: `${storageUrl()}/storage/v1${data.url}`, uploadToken: data.token };
};

const headObject = ({ bucket, key }) => request(`/object/${encodeURIComponent(bucket)}/${encodedKey(key)}`, { method: 'HEAD' });

const createSignedDownload = async ({ bucket, key, expiresIn = 300 }) => {
  const response = await request(`/object/sign/${encodeURIComponent(bucket)}/${encodedKey(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn }),
  });
  const data = await response.json();
  if (!data.signedURL) throw new Error('Supabase Storage did not return a valid signed viewing URL.');
  return `${storageUrl()}/storage/v1${data.signedURL}`;
};

module.exports = { uploadBuffer, downloadObject, removeObject, createSignedUpload, createSignedDownload, headObject, readObjectPrefix };
