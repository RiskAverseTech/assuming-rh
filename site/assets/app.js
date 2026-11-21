// Progressive enhancement only: theme toggle, and filter, sort and search on
// the browse page. Every page reads fine with this file missing.
(function () {
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.hidden = false;
    var current = function () {
      return root.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    };
    var label = function () { toggle.textContent = current() === 'dark' ? 'Light theme' : 'Dark theme'; };
    label();
    toggle.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: theme lasts for this page */ }
      label();
    });
  }

  var form = document.querySelector('.filters');
  var table = document.querySelector('table.entries');
  if (!form || !table) return;
  form.hidden = false;
  var tbody = table.tBodies[0];
  var rows = Array.prototype.slice.call(tbody.rows);
  var count = document.querySelector('.result-count');
  var empty = document.querySelector('.empty');
  var wrap = document.querySelector('.table-wrap');
  var keys = ['q', 'status', 'hyp', 'field', 'review'];

  var params = new URLSearchParams(location.search);
  keys.forEach(function (k) {
    var el = form.elements[k];
    if (!el || !params.has(k)) return;
    el.value = params.get(k);
    if (el.tagName === 'SELECT' && el.selectedIndex < 0) el.value = '';
  });

  function apply() {
    var v = {};
    keys.forEach(function (k) { v[k] = form.elements[k].value.trim(); });
    var words = v.q.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (tr) {
      var d = tr.dataset;
      var ok = (!v.status || d.status === v.status) &&
        (!v.hyp || d.hyps.split(' ').indexOf(v.hyp) !== -1) &&
        (!v.field || d.field === v.field) &&
        (!v.review || d.review === v.review) &&
        words.every(function (w) { return d.search.indexOf(w) !== -1; });
      tr.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = shown === rows.length ? rows.length + ' entries' : shown + ' of ' + rows.length + ' entries';
    empty.hidden = shown !== 0;
    wrap.hidden = shown === 0;
    var next = new URLSearchParams();
    keys.forEach(function (k) { if (v[k]) next.set(k, v[k]); });
    var qs = next.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* file: URLs may refuse */ }
  }
  form.addEventListener('input', apply);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('reset', function () { setTimeout(apply, 0); });

  Array.prototype.forEach.call(table.tHead.rows[0].cells, function (th, i) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = th.textContent;
    btn.title = 'Sort by ' + th.textContent.toLowerCase();
    th.textContent = '';
    th.appendChild(btn);
    btn.addEventListener('click', function () {
      var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      Array.prototype.forEach.call(table.tHead.rows[0].cells, function (o) { o.removeAttribute('aria-sort'); });
      th.setAttribute('aria-sort', dir);
      rows.sort(function (a, b) {
        var x = a.cells[i].dataset.sort, y = b.cells[i].dataset.sort;
        var c = x.localeCompare(y, undefined, { numeric: true });
        return dir === 'ascending' ? c : -c;
      });
      rows.forEach(function (tr) { tbody.appendChild(tr); });
    });
  });
  apply();
})();
