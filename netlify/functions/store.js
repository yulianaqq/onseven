import { getStore } from '@netlify/blobs';

const STORE_NAME = 'shop-admin';
const STORE_KEY = 'site-data';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

const sanitize = data => {
  const allowed = ['name', 'phone', 'email', 'formEndpoint', 'footer', 'hero', 'adv', 'specs', 'products', 'reviews'];
  return allowed.reduce((clean, key) => {
    if(Object.prototype.hasOwnProperty.call(data, key)) clean[key] = data[key];
    return clean;
  }, {});
};

export default async request => {
  const store = getStore(STORE_NAME);

  if(request.method === 'GET'){
    const data = await store.get(STORE_KEY, { type: 'json' });
    if(!data) return json(404, { ok:false, error:'not_found' });
    return json(200, data);
  }

  if(request.method !== 'POST'){
    return json(405, { ok:false, error:'method_not_allowed' });
  }

  const adminPassword = process.env.STORE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if(request.headers.get('x-admin-password') !== adminPassword){
    return json(401, { ok:false, error:'unauthorized' });
  }

  let data;
  try{
    data = await request.json();
  }catch(error){
    return json(400, { ok:false, error:'bad_json' });
  }

  if(!data || typeof data !== 'object' || Array.isArray(data)){
    return json(400, { ok:false, error:'bad_data' });
  }

  const clean = sanitize(data);
  await store.setJSON(STORE_KEY, clean);
  return json(200, { ok:true });
};
