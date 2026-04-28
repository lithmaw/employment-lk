function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'applications';

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
    storageBucket,
  };
}

function getSupabaseHeaders(extra = {}) {
  const { serviceRoleKey } = getSupabaseConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra,
  };
}

async function supabaseRequest(path, options = {}) {
  const { url } = getSupabaseConfig();
  const res = await fetch(`${url}${path}`, options);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Supabase request failed with status ${res.status}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function mapOrderToRow(data) {
  return {
    order_id: data.orderId,
    name: data.name,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    status: data.status,
    created_at: data.createdAt || null,
    paid_at: data.paidAt || null,
    ref_number: data.refNumber || null,
  };
}

function mapOrderFromRow(row) {
  if (!row) return null;
  return {
    orderId: row.order_id,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    refNumber: row.ref_number,
  };
}

function mapApplicationToRow(data) {
  return {
    order_id: data.orderId,
    ref_number: data.refNumber,
    first_name: data.firstName,
    last_name: data.lastName,
    address: data.address,
    city: data.city,
    province: data.province,
    postal: data.postal || '',
    dob: data.dob || '',
    gender: data.gender || '',
    nic: data.nic,
    phone: data.phone,
    passport_number: data.passportNumber,
    passport_country: data.passportCountry || 'Sri Lanka',
    passport_issue: data.passportIssue || '',
    passport_expiry: data.passportExpiry,
    job_category: data.jobCategory,
    passport_url: data.passportUrl,
    birth_cert_url: data.cvUrl || data.birthCertUrl,
    nic_url: data.nicUrl,
    photo_url: data.photoUrl,
    extra_urls: Array.isArray(data.extraUrls) ? data.extraUrls : [],
    submitted_at: data.submittedAt,
    status: data.status,
  };
}

async function createOrder(data) {
  const row = mapOrderToRow(data);
  await supabaseRequest('/rest/v1/orders', {
    method: 'POST',
    headers: getSupabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(row),
  });
  return data;
}

async function getOrder(orderId) {
  const result = await supabaseRequest(`/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}&select=*`, {
    headers: getSupabaseHeaders(),
  });
  return mapOrderFromRow(result?.[0] || null);
}

async function updateOrder(orderId, data) {
  const row = mapOrderToRow({ orderId, ...data });
  delete row.order_id;

  await supabaseRequest(`/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: getSupabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify(row),
  });
}

async function createApplication(data) {
  const row = mapApplicationToRow(data);
  await supabaseRequest('/rest/v1/applications', {
    method: 'POST',
    headers: getSupabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(row),
  });
  return data;
}

async function uploadFileToSupabase(fileBuffer, mimeType, fileName, orderId) {
  const { storageBucket } = getSupabaseConfig();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `applications/${orderId}/${Date.now()}-${safeName}`;

  await supabaseRequest(`/storage/v1/object/${storageBucket}/${objectPath}`, {
    method: 'POST',
    headers: getSupabaseHeaders({
      'Content-Type': mimeType,
      'x-upsert': 'false',
    }),
    body: fileBuffer,
  });

  return {
    fileUrl: `supabase://${storageBucket}/${objectPath}`,
    storagePath: objectPath,
    bucket: storageBucket,
  };
}

module.exports = {
  createOrder,
  getOrder,
  updateOrder,
  createApplication,
  uploadFileToSupabase,
};
