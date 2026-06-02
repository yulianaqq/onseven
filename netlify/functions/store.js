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

export const handler = async event => {
  const store = getStore(STORE_NAME);

  if(event.httpMethod === 'GET'){
    const data = await store.get(STORE_KEY, { type: 'json' });
    if(!data) return json(404, { ok:false, error:'not_found' });
    return json(200, data);
  }

  if(event.httpMethod !== 'POST'){
    return json(405, { ok:false, error:'method_not_allowed' });
  }

  const adminPassword = process.env.STORE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if(event.headers['x-admin-password'] !== adminPassword){
    return json(401, { ok:false, error:'unauthorized' });
  }

  let data;
  try{
    data = JSON.parse(event.body || '{}');
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
