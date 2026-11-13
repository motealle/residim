/* v64 «open in the phone's own browser»: messengers (ایتا، بله، روبیکا، تلگرام، اینستاگرام، واتس‌اپ…) open links in a built-in browser
   where location and notifications do not work. On Android we hand the same address to Chrome (or the phone's default browser) once per
   visit; if that is not possible, or on iPhone, a friendly screen explains the one tap needed. The real app (ResidimApp) is never touched. */
(function () {
  try {
    var ua = navigator.userAgent || '', L = location;
    if (/ResidimApp/.test(ua) || /[?&]inapp=0/.test(L.search)) return;
    var and = /Android/i.test(ua), ios = /iPhone|iPad|iPod/i.test(ua);
    var named = /(Eitaa|Bale|Rubika|Soroush|Telegram|Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp|Snapchat|Twitter|MicroMessenger|GSA\/)/i.test(ua);
    var inApp = named || (and && /; wv\)/.test(ua)) || (ios && !/Safari\//.test(ua) && /Mobile\//.test(ua));
    if (!inApp) return;
    var host = L.host + L.pathname + L.search + L.hash, url = L.href;
    var chrome = 'intent://' + host + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url + (L.search ? '&' : '?') + 'ib=1') + ';end';
    var any = 'intent://' + host + '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
    var tried = false; try { tried = sessionStorage.getItem('ib-tried') === '1'; sessionStorage.setItem('ib-tried', '1'); } catch (e) {}
    if (and && !tried && !/[?&]ib=1/.test(L.search)) { setTimeout(function () { L.href = chrome; }, 60); }
    var show = function () {
      if (document.getElementById('inapp')) return;
      var d = document.createElement('div'); d.id = 'inapp'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
      d.innerHTML = '<div class="ia-card"><div class="ia-e" aria-hidden="true">🧭</div><b>رسیدیم را در مرورگرِ گوشی باز کنید</b>'
        + '<p>این‌جا مرورگرِ داخلیِ پیام‌رسان است و <b>موقعیت مکانی و اعلان‌ها</b> در آن کار نمی‌کند؛ بدون این‌ها هم‌مسیر پیدا نمی‌شود.</p>'
        + (and ? '<a class="ia-b" href="' + chrome + '">باز کردن در Chrome</a><a class="ia-b ia-l" href="' + any + '">باز کردن در مرورگر دیگر</a>'
               : '<p class="ia-s">از منوی <b>⋯</b> یا <b>⤴︎</b> همین صفحه، «<b>باز کردن در Safari</b>» یا «Open in Browser» را بزنید.</p>')
        + '<button class="ia-b ia-l" type="button" id="ia-copy">کپی لینک</button><button class="ia-x" type="button" id="ia-stay">فعلاً همین‌جا ادامه می‌دهم</button></div>';
      document.body.appendChild(d);
      document.getElementById('ia-stay').onclick = function () { d.remove(); };
      document.getElementById('ia-copy').onclick = function () { var b = this; var ok = function () { b.textContent = 'کپی شد؛ در مرورگر بچسبانید ✓'; };
        try { navigator.clipboard.writeText(url).then(ok, function () { prompt('لینک را کپی کنید:', url); }); } catch (e) { prompt('لینک را کپی کنید:', url); } };
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(show, and && !tried ? 1200 : 0); }); else setTimeout(show, and && !tried ? 1200 : 0);
  } catch (e) {}
})();
