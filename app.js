const ADMIN_PASSWORD = 'admin123';
const STORE_VERSION = 'defaults-2026-05-27';
const DEFAULT_FORM_ENDPOINT = 'https://formspree.io/f/mzdwllqn';
const SHARED_API_URL = '/.netlify/functions/store';
const SHARED_DATA_URL = 'data.json';
const DEFAULT_REVIEW_IMAGES = ['assets/review-1.jpg', 'assets/review-2.jpg', 'assets/review-3.jpg'];
let adminUnlocked = false;
let selProd = '';
let adminPassword = '';

let S = {
  name:'Магазин',
  phone:'+380 00 000 00 00',
  email:'',
  formEndpoint:DEFAULT_FORM_ENDPOINT,
  footer:'© 2026 Магазин · Усі права захищені',
  hero:{t1:'Ідеальний товар для вас',t2:'',img:'',op:'116 грн/шт',np:'49 грн/шт',stock:'150'},
  adv:['Термін служби від десяти років та вище','Висока вологостійкість','Стійкий до механічних пошкоджень','Не деформується','Швидкий монтаж'],
  specs:['Характеристики: заповніть через панель керування'],
  products:[{id:1,name:'Товар 1',desc:'Опис товару',op:'116 грн',np:'49 грн',badge:'-40%',img:''}],
  reviews:[
    {id:1,name:'Андрій, 32 роки',date:'сьогодні',text:'Дуже задоволений покупкою! Якість чудова, доставка швидка.',img:''},
    {id:2,name:'Ольга, 28 років',date:'1 день тому',text:'Замовляла вже вдруге - не розчарували. Менеджер швидко зв’язався.',img:''},
    {id:3,name:'Михайло, 45 років',date:'3 дні тому',text:'Відмінна якість. Виглядає краще ніж на фото, дуже задоволений!',img:''}
  ]
};

const $ = id => document.getElementById(id);
const v = id => $(id).value;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

function mergeStore(data){
  if(!data || typeof data !== 'object') return;
  S = {...S, ...data};
  S.hero = {...S.hero, ...(data.hero || {})};
  S.adv = Array.isArray(data.adv) ? data.adv : S.adv;
  S.specs = Array.isArray(data.specs) ? data.specs : S.specs;
  S.products = Array.isArray(data.products) ? data.products : S.products;
  S.products = S.products.map(product => ({
    ...product,
    img: DEFAULT_REVIEW_IMAGES.includes(product.img) ? '' : product.img
  }));
  S.reviews = Array.isArray(data.reviews) ? data.reviews : S.reviews;
  S.reviews = S.reviews.map((review, index) => ({
    ...review,
    img: review.img || DEFAULT_REVIEW_IMAGES[index] || ''
  }));
  if(!S.formEndpoint) S.formEndpoint = DEFAULT_FORM_ENDPOINT;
}

function load(){
  try{
    if(localStorage.getItem('ls_store_version') !== STORE_VERSION){
      localStorage.removeItem('ls_store');
      localStorage.setItem('ls_store_version', STORE_VERSION);
      return;
    }
    const data = localStorage.getItem('ls_store');
    if(data) mergeStore(JSON.parse(data));
  }catch(e){}
  if(!S.formEndpoint) S.formEndpoint = DEFAULT_FORM_ENDPOINT;
}

function save(){
  localStorage.setItem('ls_store', JSON.stringify(S));
  saveShared();
}

function loadShared(){
  if(location.protocol === 'file:') return Promise.resolve();
  return fetch(SHARED_API_URL + '?v=' + Date.now(), {cache:'no-store'})
    .then(response => {
      if(response.ok) return response.json();
      return fetch(SHARED_DATA_URL + '?v=' + Date.now(), {cache:'no-store'})
        .then(fallback => fallback.ok ? fallback.json() : null);
    })
    .then(data => {
      mergeStore(data);
      localStorage.setItem('ls_store', JSON.stringify(S));
    })
    .catch(() => {});
}

function saveShared(){
  if(location.protocol === 'file:') return;
  if(!adminUnlocked || !adminPassword) return;
  fetch(SHARED_API_URL, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Admin-Password':adminPassword
    },
    body:JSON.stringify(S)
  })
    .then(async response => {
      if(response.ok) return;
      let details = '';
      try{
        const result = await response.json();
        details = result.error ? ': ' + result.error : '';
      }catch(e){}
      if(response.status === 404) throw new Error('Netlify Function не знайдена');
      if(response.status === 401) throw new Error('пароль адмінки не збігається');
      throw new Error('Netlify Function помилка ' + response.status + details);
    })
    .catch(error => {
      toast('⚠️ Збережено тільки у цьому браузері. ' + error.message);
    });
}

function openPass(){
  $('pass-input').value = '';
  $('pass-error').style.display = 'none';
  $('pass-overlay').classList.add('open');
  setTimeout(() => $('pass-input').focus(), 120);
}

function closePass(){
  $('pass-overlay').classList.remove('open');
}

function checkPass(){
  if($('pass-input').value === ADMIN_PASSWORD){
    adminUnlocked = true;
    adminPassword = $('pass-input').value;
    $('admin-toggle').hidden = false;
    closePass();
    openAdmin();
    toast('✅ Доступ відкрито!');
    return;
  }

  $('pass-error').style.display = 'block';
  $('pass-input').value = '';
  $('pass-input').focus();
  const box = $('pass-box');
  box.style.animation = 'shake .4s';
  setTimeout(() => box.style.animation = '', 400);
}

function openAdmin(){
  if(!adminUnlocked){
    openPass();
    return;
  }
  $('admin-panel').classList.add('open');
  fillAdmin();
}

function closeAdmin(){
  $('admin-panel').classList.remove('open');
}

function logoutAdmin(){
  adminUnlocked = false;
  adminPassword = '';
  $('admin-toggle').hidden = true;
  closeAdmin();
}

function render(){
  $('hlogo').textContent = S.name;
  $('hphone').textContent = S.phone;
  $('hphone').href = 'tel:' + S.phone.replace(/\s/g,'');
  document.title = S.name;

  $('hero-title').textContent = S.hero.t1 + (S.hero.t2 ? ' ' + S.hero.t2 : '');
  $('hero-img').src = S.hero.img || 'https://placehold.co/600x400/e8f5e9/2e7d32?text=Фото+товару';
  $('hero-op').textContent = S.hero.op;
  $('hero-np').textContent = S.hero.np;
  $('hero-stock-val').textContent = S.hero.stock;
  $('stock-note-val').textContent = S.hero.stock;

  $('adv-list').innerHTML = S.adv.filter(x => x.trim()).map(x => `<li>${esc(x)}</li>`).join('');
  const specs = S.specs.filter(x => x.trim());
  $('specs-box').innerHTML = specs.map(x => {
    const parts = x.split(':');
    return `<div><strong>${esc(parts[0].trim())}:</strong> ${esc(parts.slice(1).join(':').trim())}</div>`;
  }).join('');

  $('cat-grid').innerHTML = S.products.map((p, i) => `
    <article class="prod-card">
      <img src="${esc(p.img || 'https://placehold.co/400x400/e8f5e9/2e7d32?text=' + encodeURIComponent(p.name))}" alt="${esc(p.name)}" onerror="this.src='https://placehold.co/400x400/e8f5e9/2e7d32?text=Фото'">
      <div class="prod-body">
        ${p.badge ? `<div class="prod-badge">${esc(p.badge)}</div>` : ''}
        <div class="prod-name">${esc(p.name)}</div>
        ${p.desc ? `<div class="prod-desc">${esc(p.desc)}</div>` : ''}
        <div class="prod-prices">
          <div class="prod-old">${esc(p.op)}</div>
          <div class="prod-new">${esc(p.np)}</div>
        </div>
        <button class="btn-order" data-product-index="${i}">Оформити замовлення</button>
      </div>
    </article>`).join('');

  $('reviews-list').innerHTML = S.reviews.map(r => {
    const initial = esc((r.name.trim()[0] || '?').toUpperCase());
    return `<div class="review">
      <div class="rev-ava">${r.img ? `<img src="${esc(r.img)}" alt="${esc(r.name)}" onerror="this.remove();this.parentElement.textContent='${initial}'">` : initial}</div>
      <div class="rev-info">
        <div class="rev-name">${esc(r.name)}</div>
        <div class="rev-meta">${esc(r.date)}</div>
        <div class="rev-stars">★★★★★</div>
        <div class="rev-text">${esc(r.text)}</div>
      </div>
    </div>`;
  }).join('');

  $('o-prod').innerHTML = '<option value="">- Оберіть товар -</option>' + S.products.map(p => `<option value="${esc(p.name)}">${esc(p.name)} - ${esc(p.np)}</option>`).join('');
  $('footer-text').textContent = S.footer;
  renderAdminLists();
}

function renderAdminLists(){
  $('pal').innerHTML = S.products.map((p, i) => `
    <div class="pai">
      <img src="${esc(p.img || 'https://placehold.co/48x48/e8f5e9/2e7d32?text=Ф')}" alt="">
      <div class="pai-info"><div class="pai-name">${esc(p.name)}</div><div class="pai-price">${esc(p.np)} / ${esc(p.op)}</div></div>
      <button class="pai-del" data-delete-product="${i}">🗑</button>
    </div>`).join('') || '<p style="font-size:12px;color:#aaa">Немає товарів</p>';

  $('ral').innerHTML = S.reviews.map((r, i) => `
    <div class="pai">
      <div class="rev-ava" style="width:40px;height:40px;font-size:15px;flex-shrink:0">${r.img ? `<img src="${esc(r.img)}" alt="">` : esc(r.name[0] || '?')}</div>
      <div class="pai-info"><div class="pai-name">${esc(r.name)}</div><div class="pai-price">${esc(r.date)}</div></div>
      <button class="pai-del" data-delete-review="${i}">🗑</button>
    </div>`).join('') || '<p style="font-size:12px;color:#aaa">Немає відгуків</p>';
}

function fillAdmin(){
  $('s-name').value = S.name;
  $('s-phone').value = S.phone;
  $('s-form-endpoint').value = S.formEndpoint || '';
  $('s-footer').value = S.footer;
  $('h-t1').value = S.hero.t1;
  $('h-t2').value = S.hero.t2;
  $('h-img').value = S.hero.img || '';
  $('h-op').value = S.hero.op;
  $('h-np').value = S.hero.np;
  $('h-stock').value = S.hero.stock;
  $('a-list').value = S.adv.join('\n');
  $('a-specs').value = S.specs.join('\n');
  renderAdminLists();
}

function tab(id){
  document.querySelectorAll('.ap-tc').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.ap-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === id));
  $(id).classList.add('active');
}

function saveShop(){
  S.name = v('s-name') || S.name;
  S.phone = v('s-phone') || S.phone;
  S.formEndpoint = v('s-form-endpoint').trim() || DEFAULT_FORM_ENDPOINT;
  S.footer = v('s-footer') || S.footer;
  save(); render(); toast('✅ Збережено!');
}

function saveHero(){
  S.hero.t1 = v('h-t1') || S.hero.t1;
  S.hero.t2 = v('h-t2');
  S.hero.img = v('h-img');
  S.hero.op = v('h-op') || S.hero.op;
  S.hero.np = v('h-np') || S.hero.np;
  S.hero.stock = v('h-stock') || S.hero.stock;
  save(); render(); toast('✅ Банер збережено!');
}

function saveAdv(){
  S.adv = v('a-list').split('\n').map(x => x.trim()).filter(Boolean);
  S.specs = v('a-specs').split('\n').map(x => x.trim()).filter(Boolean);
  save(); render(); toast('✅ Переваги збережено!');
}

function addProd(){
  const name = v('p-name').trim();
  if(!name){ toast('⚠️ Введіть назву'); return; }
  S.products.push({id:Date.now(),name,desc:v('p-desc'),op:v('p-op') || '-',np:v('p-np') || '-',badge:v('p-badge'),img:v('p-img')});
  ['p-name','p-desc','p-op','p-np','p-badge','p-img'].forEach(id => $(id).value = '');
  save(); render(); toast('✅ Товар додано!');
}

function delProd(i){
  if(!confirm('Видалити товар «' + S.products[i].name + '»?')) return;
  S.products.splice(i, 1);
  save(); render(); toast('🗑 Видалено');
}

function addRev(){
  const name = v('r-name').trim();
  const text = v('r-text').trim();
  if(!name || !text){ toast('⚠️ Заповніть ім’я та текст'); return; }
  S.reviews.unshift({id:Date.now(),name,date:v('r-date') || 'сьогодні',text,img:v('r-img')});
  ['r-name','r-date','r-text','r-img'].forEach(id => $(id).value = '');
  save(); render(); toast('✅ Відгук додано!');
}

function delRev(i){
  if(!confirm('Видалити відгук?')) return;
  S.reviews.splice(i, 1);
  save(); render(); toast('🗑 Видалено');
}

function openModalByIndex(index){
  const product = S.products[index];
  if(!product) return;
  selProd = product.name;
  $('mprod').textContent = 'Товар: ' + product.name;
  $('mok').style.display = 'none';
  $('mfields').style.display = 'block';
  $('m-name').value = '';
  $('m-phone').value = '';
  $('m-comment').value = '';
  $('qmodal').classList.add('open');
}

function closeModal(){
  $('qmodal').classList.remove('open');
}

function submitModal(){
  const name = v('m-name').trim();
  const phone = v('m-phone').trim();
  if(!name || !phone){ alert('Введіть ім’я та телефон'); return; }
  sendOrder({name,phone,product:selProd,comment:v('m-comment'),city:''});
  $('mfields').style.display = 'none';
  $('mok').style.display = 'block';
  setTimeout(closeModal, 2500);
}

function submitForm(){
  const name = v('o-name').trim();
  const phone = v('o-phone').trim();
  if(!name || !phone){ alert('Введіть ім’я та телефон'); return; }
  sendOrder({name,phone,product:v('o-prod'),city:v('o-city'),comment:v('o-comment')});
  $('ofields').style.display = 'none';
  $('form-ok').style.display = 'block';
}

function sendOrder(d){
  const orders = JSON.parse(localStorage.getItem('ls_orders') || '[]');
  orders.unshift({...d,time:new Date().toLocaleString('uk-UA')});
  localStorage.setItem('ls_orders', JSON.stringify(orders.slice(0, 100)));

  if(S.formEndpoint){
    sendFormspreeOrder(d);
    return;
  }

  if(!S.email){
    toast('⚠️ Email або Formspree endpoint не вказано');
    return;
  }

  fetch('send_order.php', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      to:S.email,
      shop:S.name,
      name:d.name,
      phone:d.phone,
      product:d.product || '',
      city:d.city || '',
      comment:d.comment || '',
      page:location.href
    })
  })
    .then(response => response.json())
    .then(result => {
      if(!result.ok) throw new Error(result.error || 'send_error');
      toast('✅ Замовлення надіслано на пошту');
    })
    .catch(() => {
      toast('⚠️ Не вдалося надіслати пошту. Перевірте SMTP або хостинг');
    });
}

function sendFormspreeOrder(d){
  fetch(S.formEndpoint, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      Accept:'application/json'
    },
    body:JSON.stringify({
      shop:S.name,
      name:d.name,
      phone:d.phone,
      product:d.product || '',
      city:d.city || '',
      comment:d.comment || '',
      page:location.href,
      time:new Date().toLocaleString('uk-UA')
    })
  })
    .then(response => {
      if(!response.ok) throw new Error('formspree_error');
      toast('✅ Замовлення надіслано на пошту');
    })
    .catch(() => {
      toast('⚠️ Не вдалося надіслати. Перевірте Formspree endpoint');
    });
}

function toast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.opacity = '0', 2500);
}

function bindEvents(){
  $('pass-btn').addEventListener('click', checkPass);
  $('pass-cancel').addEventListener('click', closePass);
  $('pass-input').addEventListener('keydown', e => { if(e.key === 'Enter') checkPass(); });
  $('admin-toggle').addEventListener('click', openAdmin);
  document.querySelector('.ap-close').addEventListener('click', logoutAdmin);
  document.querySelector('.modal-x').addEventListener('click', closeModal);
  $('submit-modal').addEventListener('click', submitModal);
  $('submit-form').addEventListener('click', submitForm);
  $('save-shop').addEventListener('click', saveShop);
  $('save-hero').addEventListener('click', saveHero);
  $('save-adv').addEventListener('click', saveAdv);
  $('add-prod').addEventListener('click', addProd);
  $('add-rev').addEventListener('click', addRev);

  document.querySelectorAll('.ap-tab').forEach(btn => btn.addEventListener('click', () => tab(btn.dataset.tab)));
  document.addEventListener('click', e => {
    const productIndex = e.target.closest('[data-product-index]')?.dataset.productIndex;
    const deleteProduct = e.target.closest('[data-delete-product]')?.dataset.deleteProduct;
    const deleteReview = e.target.closest('[data-delete-review]')?.dataset.deleteReview;
    if(productIndex !== undefined) openModalByIndex(Number(productIndex));
    if(deleteProduct !== undefined) delProd(Number(deleteProduct));
    if(deleteReview !== undefined) delRev(Number(deleteReview));
  });

  let logoClicks = 0;
  let logoTimer;
  $('hlogo').addEventListener('click', () => {
    logoClicks += 1;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => logoClicks = 0, 1500);
    if(logoClicks >= 5){
      logoClicks = 0;
      openPass();
    }
  });

  document.addEventListener('keydown', e => {
    if(e.ctrlKey && e.altKey && (e.code === 'KeyA' || e.key.toLowerCase() === 'a')) openPass();
  });

  const params = new URLSearchParams(location.search);
  if(params.get('admin') === '1' || location.hash === '#admin') openPass();
}

load();
loadShared().then(() => {
  render();
  bindEvents();
});
