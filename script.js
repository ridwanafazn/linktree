(() => {
  'use strict';

  const root = document.documentElement;
  const BAR = { light: '#b7c2da', dark: '#0f1320' };

  /* ---------- Theme (runs immediately, before first paint) ---------- */
  const store = {
    get() {
      try {
        const v = localStorage.getItem('theme');
        return v === 'light' || v === 'dark' ? v : null;
      } catch { return null; }
    },
    set(v) {
      try { localStorage.setItem('theme', v); } catch { /* private mode: ignore */ }
    },
  };

  const mql = matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (t) => {
    root.dataset.theme = t;
    const meta = document.getElementById('theme-color');
    if (meta) meta.setAttribute('content', BAR[t]);
  };

  applyTheme(store.get() || (mql.matches ? 'dark' : 'light'));

  // Follow the system until the visitor picks a theme themselves
  mql.addEventListener?.('change', (e) => {
    if (!store.get()) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------- Everything else waits for the DOM ---------- */
  const init = () => {
    const $ = (sel) => document.querySelector(sel);
    const toast = $('#toast');
    const sheet = $('#sheet');
    const canNativeShare = !!navigator.share && matchMedia('(pointer: coarse)').matches;
    let timer;
    let current = null; // { url, title } of the link whose dots were pressed

    const say = (msg) => {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('show'), 1800);
    };

    const copy = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch { /* fall through to legacy path */ }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
      return ok;
    };

    const nativeShare = async (data) => {
      try {
        await navigator.share(data);
      } catch (e) {
        if (e.name !== 'AbortError') say('Could not share');
      }
    };

    /* Theme toggle */
    $('#theme').addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set(next);
    });

    /* Share this whole page (top-right button) */
    $('#share').addEventListener('click', async () => {
      const data = { title: document.title, url: location.href };
      if (canNativeShare) return nativeShare(data);
      say((await copy(data.url)) ? 'Link copied' : 'Could not copy link');
    });

    /* Share one link (three-dot button on each card) */
    const pvIco = $('#pv-ico');
    const pvTitle = $('#pv-title');
    const pvUrl = $('#pv-url');
    const preview = $('#preview');
    const moreLi = $('#t-more-li');
    if (canNativeShare) moreLi.hidden = false;

    const openSheet = (link) => {
      const a = link.querySelector('.main');
      const url = a.href;
      const title = a.querySelector('.title').textContent.trim();
      current = { url, title };

      pvIco.innerHTML = a.querySelector('.ico').innerHTML;
      pvTitle.textContent = title;
      pvUrl.textContent = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      preview.style.setProperty('--c', getComputedStyle(link).getPropertyValue('--c').trim());

      const u = encodeURIComponent(url);
      const t = encodeURIComponent(title);
      $('#t-x').href = `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
      $('#t-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
      $('#t-wa').href = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
      $('#t-in').href = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;

      sheet.showModal();
    };

    document.querySelector('.links').addEventListener('click', (e) => {
      const btn = e.target.closest('.more');
      if (btn) openSheet(btn.closest('.link'));
    });

    $('#t-copy').addEventListener('click', async () => {
      const ok = await copy(current.url);
      sheet.close();
      say(ok ? 'Link copied' : 'Could not copy link');
    });

    $('#t-more').addEventListener('click', () => {
      sheet.close();
      nativeShare(current);
    });

    // Close: X button, tap on the dimmed backdrop, or Esc (built into <dialog>)
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet || e.target.closest('[data-close]')) sheet.close();
    });

    // Close after picking a social app (they open in a new tab)
    sheet.querySelectorAll('a.t').forEach((a) => a.addEventListener('click', () => sheet.close()));

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();