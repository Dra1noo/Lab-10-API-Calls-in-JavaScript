// Demar-style: keep it simple, lil bit chatty, nothing too fancy.

// DOM grabs
const btnFetch = document.getElementById('btnFetch');   // fetch GET #1
const btnXHR   = document.getElementById('btnXHR');     // XHR  GET #2
const btnAll   = document.getElementById('btnAll');     // bonus GET list

const output   = document.getElementById('output');

const titleEl  = document.getElementById('title');
const bodyEl   = document.getElementById('body');
const idEl     = document.getElementById('postId');

const btnCreate = document.getElementById('btnCreate'); // POST via fetch
const btnUpdate = document.getElementById('btnUpdate'); // PUT via XHR
const btnDelete = document.getElementById('btnDelete'); // bonus DELETE
const formResult = document.getElementById('formResult');

const BASE = 'https://jsonplaceholder.typicode.com';

// tiny helpers
const html = (strings, ...vals) =>
  strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');

function renderCard(target, data, label='Result'){
  target.innerHTML = html`
    <div class="msg">
      <h3>${label}</h3>
      <p><strong>id:</strong> ${data.id ?? '—'}</p>
      <p><strong>title:</strong> ${escapeHtml(data.title ?? '')}</p>
      <p><strong>body:</strong> ${escapeHtml(data.body ?? '')}</p>
    </div>
  `;
}

function renderList(target, items){
  const five = items.slice(0,5);
  target.innerHTML = five.map(p => html`
    <div class="msg" style="margin-bottom:10px">
      <h3>Post #${p.id}</h3>
      <p><strong>${escapeHtml(p.title)}</strong></p>
      <p>${escapeHtml(p.body)}</p>
    </div>
  `).join('');
}

function renderError(target, type, message, status){
  // type: 'network' | 'invalid' | 'server'
  const classes = type === 'network' ? 'error' :
                  type === 'invalid' ? 'warning' : 'server';

  const title = type === 'network' ? 'Network error' :
                type === 'invalid' ? 'Invalid input' : `Server error${status ? ' ('+status+')' : ''}`;

  target.innerHTML = html`
    <div class="msg ${classes}">
      <h3>${title}</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[s]
  ));
}

/* -----------------------------
   Task 1: GET using fetch()
--------------------------------*/
btnFetch.addEventListener('click', async () => {
  output.textContent = 'Loading…';
  try {
    const res = await fetch(`${BASE}/posts/1`);
    if(!res.ok){
      // 4xx / 5xx -> server error bucket
      const text = await res.text().catch(()=>'');
      return renderError(output, 'server', text || 'Request failed', res.status);
    }
    const data = await res.json();
    renderCard(output, data, 'fetch() → /posts/1');
  } catch (err) {
    // network bucket (offline, blocked, CORS, etc.)
    renderError(output, 'network', err.message || 'Please check your connection');
  }
});

/* ------------------------------------
   Task 2: GET using XMLHttpRequest
-------------------------------------*/
btnXHR.addEventListener('click', () => {
  output.textContent = 'Loading…';

  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${BASE}/posts/2`);
  xhr.responseType = 'json';

  xhr.onload = () => {
    if(xhr.status >= 200 && xhr.status < 300){
      renderCard(output, xhr.response, 'XMLHttpRequest → /posts/2');
    } else {
      renderError(output, 'server', xhr.responseText || 'Request failed', xhr.status);
    }
  };

  xhr.onerror = () => {
    // usually status 0 → network-ish
    renderError(output, 'network', 'Could not reach the server (XHR).');
  };

  xhr.send();
});

/* ------------------------------------
   Bonus: fetch a few posts
-------------------------------------*/
btnAll.addEventListener('click', async () => {
  output.textContent = 'Loading…';
  try{
    const res = await fetch(`${BASE}/posts`);
    if(!res.ok){
      const txt = await res.text().catch(()=> '');
      return renderError(output, 'server', txt || 'Failed to fetch posts', res.status);
    }
    const list = await res.json();
    renderList(output, list);
  }catch(err){
    renderError(output, 'network', err.message || 'Please check your connection');
  }
});

/* ------------------------------------
   Task 3: POST using fetch()
-------------------------------------*/
btnCreate.addEventListener('click', async () => {
  const title = titleEl.value.trim();
  const body  = bodyEl.value.trim();

  if(!title || !body){
    return renderError(formResult, 'invalid', 'Title and Body can’t be empty.');
  }

  formResult.textContent = 'Sending…';

  try{
    const res = await fetch(`${BASE}/posts`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json; charset=UTF-8' },
      body: JSON.stringify({ title, body, userId: 1 })
    });

    if(!res.ok){
      const txt = await res.text().catch(()=> '');
      return renderError(formResult, 'server', txt || 'Failed to create post', res.status);
    }

    const data = await res.json();
    renderCard(formResult, data, 'POST created (fetch)');
  }catch(err){
    renderError(formResult, 'network', err.message || 'Please check your connection');
  }
});

/* ------------------------------------
   Task 4: PUT using XMLHttpRequest
-------------------------------------*/
btnUpdate.addEventListener('click', () => {
  const id    = Number(idEl.value);
  const title = titleEl.value.trim();
  const body  = bodyEl.value.trim();

  if(!id || id < 1){
    return renderError(formResult, 'invalid', 'Please enter a valid Post ID (positive number).');
  }
  if(!title || !body){
    return renderError(formResult, 'invalid', 'Title and Body are required to update.');
  }

  formResult.textContent = 'Updating…';

  const xhr = new XMLHttpRequest();
  xhr.open('PUT', `${BASE}/posts/${id}`);
  xhr.setRequestHeader('Content-Type','application/json; charset=UTF-8');

  xhr.onload = () => {
    if(xhr.status >= 200 && xhr.status < 300){
      try{
        const data = JSON.parse(xhr.responseText);
        renderCard(formResult, data, `PUT updated (XHR) → /posts/${id}`);
      }catch(parseErr){
        renderError(formResult, 'server', 'Update succeeded but response parse failed.');
      }
    } else {
      renderError(formResult, 'server', xhr.responseText || 'Failed to update', xhr.status);
    }
  };

  xhr.onerror = () => {
    renderError(formResult, 'network', 'Could not reach the server (XHR).');
  };

  xhr.send(JSON.stringify({ id, title, body, userId: 1 }));
});

/* ------------------------------------
   Bonus: DELETE using fetch()
-------------------------------------*/
btnDelete.addEventListener('click', async () => {
  const id = Number(idEl.value);
  if(!id || id < 1){
    return renderError(formResult, 'invalid', 'Valid Post ID required to delete.');
  }

  formResult.textContent = 'Deleting…';

  try{
    const res = await fetch(`${BASE}/posts/${id}`, { method:'DELETE' });
    // JSONPlaceholder returns an empty object with 200/204-ish behavior
    if(!res.ok){
      const txt = await res.text().catch(()=> '');
      return renderError(formResult, 'server', txt || 'Failed to delete', res.status);
    }
    formResult.innerHTML = html`
      <div class="msg">
        <h3>Deleted (bonus)</h3>
        <p>Post with id <strong>${id}</strong> deleted (mock).</p>
      </div>
    `;
  }catch(err){
    renderError(formResult, 'network', err.message || 'Please check your connection');
  }
});
