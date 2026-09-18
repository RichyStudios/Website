import { test } from 'node:test';
import assert from 'node:assert/strict';

const origin = 'http://localhost:3000';
async function api(path, data, cookie = '') {
  const response = await fetch(`${origin}/api/store/${path}`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(data === undefined ? {} : { 'Content-Type': 'application/json', Origin: origin }),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return { status: response.status, body: await response.json() };
}

test('owner can create, preview, publish, and update a four-file browser game', async () => {
  const login = await fetch(`${origin}/signin-with-chatgpt?return_to=/admin`, { redirect: 'manual' });
  const cookie = login.headers.get('set-cookie')?.split(';')[0] || '';
  assert.equal(login.status, 302);
  assert.ok(cookie);

  const suffix = Date.now().toString(36);
  const game = {
    title: `QA Game ${suffix}`,
    description: 'A temporary integration-test game.',
    category: 'Puzzle',
    thumbnail: '/hero.png',
    html: '<button id="play">Play</button>',
    css: 'button { color: rebeccapurple; }',
    javascript: "document.querySelector('#play').dataset.ready = 'yes';",
    python: "from js import document\ndocument.body.dataset.python = 'ready'",
    published: false,
  };

  const created = await api('admin/game', game, cookie);
  assert.equal(created.status, 200);
  assert.ok(created.body.id);
  assert.ok(!(await api('games')).body.games.some((item) => item.id === created.body.id));

  const admin = await api('admin', undefined, cookie);
  const draft = admin.body.games.find((item) => item.id === created.body.id);
  assert.equal(draft.python, game.python);

  const published = await api('admin/game', { ...draft, published: true }, cookie);
  assert.equal(published.status, 200);
  const publicGames = await api('games');
  const live = publicGames.body.games.find((item) => item.id === created.body.id);
  assert.equal(live.title, game.title);
  assert.equal(live.html, game.html);
  assert.equal(live.css, game.css);
  assert.equal(live.javascript, game.javascript);
  assert.equal(live.python, game.python);

  const hiddenAgain = await api('admin/game', { ...live, published: false, created_at: draft.created_at }, cookie);
  assert.equal(hiddenAgain.status, 200);
  assert.ok(!(await api('games')).body.games.some((item) => item.id === created.body.id));
});
