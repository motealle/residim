(function () {
  "use strict";

  /* ---------- data ---------- */
  var DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];
  var HOUSEHOLDS = [
    { id: 1, name: "خانواده شما", note: "شما", driver: "var(--d1)" },
    { id: 2, name: "همیار ۱", note: "عضو گروه", driver: "var(--d2)" },
    { id: 3, name: "همیار ۲", note: "عضو گروه", driver: "var(--d3)" },
    { id: 4, name: "همیار ۳", note: "عضو گروه", driver: "var(--d4)" }
  ];
  var PASSENGERS = 3;
  var CREDIT = 100000; // تومان برای هر سفر تکمیل‌شده به انجام‌دهنده
  var SHARE = 25000;   // سهم هر عضو از هر سفر تکمیل‌شده
  var KEY = "residim-03-v1";

  var TRIPS = [];
  DAYS.forEach(function (day, i) {
    ["out", "back"].forEach(function (dir) {
      TRIPS.push({
        id: i + "-" + dir,
        day: day,
        dir: dir,
        label: dir === "out" ? "رفت" : "برگشت",
        time: dir === "out" ? "07:10" : "13:30",
        planned: ((i + (dir === "back" ? 1 : 0)) % 4) + 1
      });
    });
  });

  var STATUS_TEXT = { pending: "هنوز شروع نشده", started: "در مسیر", done: "رسیدیم" };

  /* ---------- helpers ---------- */
  function fa(v) {
    return String(v).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
  }
  function money(n) {
    return fa(String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "٬")) + " تومان";
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function household(id) {
    for (var i = 0; i < HOUSEHOLDS.length; i++) if (HOUSEHOLDS[i].id === id) return HOUSEHOLDS[i];
    return HOUSEHOLDS[0];
  }
  function trip(id) {
    for (var i = 0; i < TRIPS.length; i++) if (TRIPS[i].id === id) return TRIPS[i];
    return null;
  }

  /* ---------- state ---------- */
  function fresh() {
    // داده نمونه: دو سفر اول روز شنبه تکمیل شده تا حساب و ریتم هفته دیده شود
    return {
      theme: "dark",
      records: {
        "0-out": { status: "done", executor: 2, delivered: [true, true, true], empty: true },
        "0-back": { status: "done", executor: 3, delivered: [true, true, true], empty: true }
      }
    };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.records && typeof s.records === "object") return s;
    } catch (e) { /* حافظه در دسترس نیست؛ داده نمونه استفاده می‌شود */ }
    return fresh();
  }
  var state = load();
  var ui = { view: "week", selected: null, changing: null };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast("ذخیره‌سازی این دستگاه در دسترس نیست؛ تغییرات تا بستن صفحه می‌مانند."); }
  }
  function rec(id) {
    var t = trip(id);
    var r = state.records[id];
    if (r) return r;
    return { status: "pending", executor: t.planned, delivered: [false, false, false], empty: false };
  }
  function nextId() {
    for (var i = 0; i < TRIPS.length; i++) if (rec(TRIPS[i].id).status !== "done") return TRIPS[i].id;
    return TRIPS[TRIPS.length - 1].id;
  }
  function selectedId() {
    if (ui.selected && trip(ui.selected)) return ui.selected;
    return nextId();
  }

  /* ---------- actions ---------- */
  function start(id) {
    var r = rec(id);
    if (r.status !== "pending") return;
    state.records[id] = Object.assign({}, r, { status: "started" });
    save(); render();
    toast("راه افتادید. وقتی همه رسیدند، تحویل را ثبت کنید.");
  }
  function toggleDelivered(id, idx, on) {
    var r = rec(id);
    if (r.status !== "started") return;
    var d = r.delivered.slice();
    d[idx] = on;
    state.records[id] = Object.assign({}, r, { delivered: d });
    save(); renderHeroOnly();
  }
  function toggleEmpty(id, on) {
    var r = rec(id);
    if (r.status !== "started") return;
    state.records[id] = Object.assign({}, r, { empty: on });
    save(); renderHeroOnly();
  }
  function complete(id) {
    var r = rec(id);
    var ready = r.status === "started" && r.empty && r.delivered.every(Boolean);
    if (!ready) { toast("برای ثبت، همه مسافران و وضعیت خودرو باید تأیید شوند."); return; }
    state.records[id] = Object.assign({}, r, { status: "done" });
    save(); render();
    toast("رسیدیم. اعتبار این سفر به " + household(r.executor).name + " رسید.");
  }
  function changeDriver(id, hid) {
    var r = rec(id);
    if (r.status !== "pending") return;
    state.records[id] = Object.assign({}, r, { executor: hid });
    ui.changing = null;
    save(); render();
    toast("راننده این نوبت به " + household(hid).name + " تغییر کرد.");
  }

  /* ---------- derived ---------- */
  function totals() {
    var credit = {}, usage = {}, done = 0;
    HOUSEHOLDS.forEach(function (h) { credit[h.id] = 0; usage[h.id] = 0; });
    TRIPS.forEach(function (t) {
      var r = rec(t.id);
      if (r.status !== "done") return;
      done++;
      credit[r.executor] += CREDIT;
      HOUSEHOLDS.forEach(function (h) { usage[h.id] += SHARE; });
    });
    var balance = {};
    HOUSEHOLDS.forEach(function (h) { balance[h.id] = credit[h.id] - usage[h.id]; });
    return { credit: credit, usage: usage, balance: balance, done: done };
  }

  /* ---------- render ---------- */
  function routeSvg(t, r, h) {
    // مبدأ از راست (جایی که راننده حرکت را شروع می‌کند) به مقصد در چپ
    var outbound = t.dir === "out";
    var started = r.status === "started";
    var doneRoute = r.status === "done";
    var origin = outbound ? "خانه" : "مدرسه";
    var destination = outbound ? "مدرسه" : "خانه";
    var lineClass = started || doneRoute ? "line-active" : "line";
    var ring = started ? '<circle class="ring" cx="268" cy="46" r="10"/>' : "";
    return '<svg class="route" viewBox="0 0 320 96" role="img" aria-label="' + esc(origin + " تا " + destination) + '">' +
      '<path class="' + lineClass + '" d="M52 46 H268"/>' +
      '<circle class="stop' + (started || doneRoute ? " stop-on" : "") + '" cx="268" cy="46" r="11"/>' +
      '<circle class="stop' + (doneRoute ? " stop-on" : "") + '" cx="52" cy="46" r="11"/>' +
      ring +
      '<text x="268" y="82" text-anchor="middle">' + esc(origin) + '</text>' +
      '<text x="52" y="82" text-anchor="middle">' + esc(destination) + '</text>' +
      '</svg>';
  }

  function renderHero() {
    var id = selectedId();
    var t = trip(id);
    var r = rec(id);
    var h = household(r.executor);
    var el = document.getElementById("hero");
    el.style.setProperty("--driver", h.driver);

    var head =
      '<div><p class="eyebrow">' + esc(r.status === "done" ? "نوبت کامل شد" : r.status === "started" ? "الان در مسیر هستید" : "نوبت بعدی") + '</p>' +
      '<h2>' + esc(t.day) + ' · ' + esc(t.label) + '</h2>' +
      '<p class="meta">ساعت ' + fa(t.time) + '</p></div>' +
      '<div class="actions"><span class="driver-pill"><i></i>راننده: ' + esc(h.name) + '</span></div>' +
      routeSvg(t, r, h);

    var body = "";
    if (r.status === "pending") {
      body = '<div class="step"><p>وقتی آماده حرکت شدید، همین را بزنید. تا آن موقع برنامه قابل تغییر است.</p>' +
        '<div class="actions"><button class="btn btn-primary" data-action="start" data-trip="' + t.id + '">راه بیفتیم</button>' +
        '<button class="ghost" data-action="change-open" data-trip="' + t.id + '">تغییر راننده</button></div>';
      if (ui.changing === t.id) {
        var opts = HOUSEHOLDS.map(function (x) {
          return '<option value="' + x.id + '"' + (x.id === r.executor ? " selected" : "") + '>' + esc(x.name) + '</option>';
        }).join("");
        body += '<div class="reassign"><label for="driver-pick">راننده جدید</label>' +
          '<select id="driver-pick">' + opts + '</select>' +
          '<button class="btn btn-primary" style="min-height:48px" data-action="change-save" data-trip="' + t.id + '">ذخیره</button>' +
          '<button class="ghost" data-action="change-close">انصراف</button></div>';
      }
      body += '</div>';
    } else if (r.status === "started") {
      var items = "";
      for (var i = 0; i < PASSENGERS; i++) {
        items += '<li><label><input type="checkbox" id="p' + i + '" data-check="' + i + '" data-trip="' + t.id + '"' +
          (r.delivered[i] ? " checked" : "") + '>مسافر ' + fa(i + 1) + ' را تحویل دادم</label></li>';
      }
      var ready = r.delivered.every(Boolean) && r.empty;
      body = '<div class="step"><p>هر مسافر را جدا تأیید کنید. بعد از خالی‌بودن خودرو، نوبت را ثبت کنید.</p>' +
        '<ul class="checks">' + items +
        '<li><label><input type="checkbox" id="car" data-empty="1" data-trip="' + t.id + '"' + (r.empty ? " checked" : "") +
        '>خودرو را خالی دیدم؛ صندلی و صندوق بررسی شد</label></li></ul>' +
        '<div class="actions"><button class="btn btn-primary" data-action="complete" data-trip="' + t.id + '"' + (ready ? "" : " disabled") + '>ثبت تحویل</button>' +
        '<span class="muted">' + (ready ? "همه چیز آماده است." : "مسافران و خودرو باید تأیید شوند.") + '</span></div></div>';
    } else {
      body = '<div class="success"><strong>رسیدیم ✓</strong>' +
        '<p>اعتبار این سفر به ' + esc(h.name) + ' رسید. هر عضو سهم خودش را از این سفر دیده است.</p></div>';
    }

    el.innerHTML = head + body;
  }

  function renderHeroOnly() {
    var focus = document.activeElement && document.activeElement.id;
    renderHero();
    if (focus) { var n = document.getElementById(focus); if (n) n.focus(); }
  }

  function renderWeek() {
    var box = document.getElementById("days");
    var sel = selectedId();
    var html = DAYS.map(function (day, i) {
      var chips = ["out", "back"].map(function (dir) {
        var t = TRIPS[i * 2 + (dir === "out" ? 0 : 1)];
        var r = rec(t.id);
        var h = household(r.executor);
        var mark = r.status === "done" ? "✓" : r.status === "started" ? "●" : "";
        return '<button class="chip is-' + r.status + '" style="--driver:' + h.driver + '" data-action="select" data-trip="' + t.id + '" aria-pressed="' + (sel === t.id) + '">' +
          '<span class="state" aria-hidden="true">' + mark + '</span>' +
          '<strong>' + t.label + ' · ' + fa(t.time) + '</strong>' +
          '<small>' + esc(h.name) + ' · ' + STATUS_TEXT[r.status] + '</small></button>';
      }).join("");
      return '<div class="day"><span class="day-name">' + esc(day) + '</span><div class="chips">' + chips + '</div></div>';
    }).join("");
    box.innerHTML = html;

    var doneCount = totals().done;
    document.getElementById("week-count").textContent = fa(doneCount) + " از " + fa(TRIPS.length) + " نوبت کامل شد";

    document.getElementById("legend").innerHTML = HOUSEHOLDS.slice(1).map(function (h) {
      return '<li><span class="dot" style="--driver:' + h.driver + '"></span>' + esc(h.name) + '</li>';
    }).join("") + '<li><span class="dot" style="--driver:' + HOUSEHOLDS[0].driver + '"></span>' + esc(HOUSEHOLDS[0].name) + '</li>';
  }

  function renderAccount() {
    var tot = totals();
    var mine = tot.balance[1];
    var el = document.getElementById("my-balance");
    el.textContent = (mine > 0 ? "+" : mine < 0 ? "−" : "") + money(mine);
    el.className = "big " + (mine > 0 ? "pos" : mine < 0 ? "neg" : "");
    document.getElementById("my-balance-text").textContent =
      mine > 0 ? "طلب دارید؛ یعنی بیشتر از سهم استفاده‌تان رانندگی کرده‌اید."
      : mine < 0 ? "بدهی دارید؛ یعنی سهم استفاده‌تان از سفرهای دیگران بیشتر بوده است."
      : "حساب شما صاف است.";

    var maxAbs = 1;
    HOUSEHOLDS.forEach(function (h) { maxAbs = Math.max(maxAbs, Math.abs(tot.balance[h.id])); });

    document.getElementById("ledger").innerHTML = HOUSEHOLDS.map(function (h) {
      var b = tot.balance[h.id];
      var width = Math.round((Math.abs(b) / maxAbs) * 100);
      return '<div class="ledger-row" style="--driver:' + h.driver + '">' +
        '<div class="ledger-top"><span>' + esc(h.name) + '</span>' +
        '<span class="' + (b > 0 ? "pos" : b < 0 ? "neg" : "") + '">' + (b > 0 ? "+" : b < 0 ? "−" : "") + money(b) + '</span></div>' +
        '<div class="bar"><i style="width:' + width + '%"></i></div>' +
        '<small>اعتبار ' + money(tot.credit[h.id]) + ' · سهم استفاده ' + money(tot.usage[h.id]) + '</small></div>';
    }).join("");
  }

  function renderGroup() {
    document.getElementById("members").innerHTML = HOUSEHOLDS.map(function (h) {
      return '<li style="--driver:' + h.driver + '"><span class="dot"></span><span>' + esc(h.name) + '<small>' + esc(h.note) + '</small></span></li>';
    }).join("");
  }

  function renderDock() {
    document.querySelectorAll("[data-view-btn]").forEach(function (b) {
      if (b.getAttribute("data-view-btn") === ui.view) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    document.querySelectorAll("[data-view]").forEach(function (s) {
      s.hidden = s.getAttribute("data-view") !== ui.view;
    });
  }

  function render() {
    renderHero();
    renderWeek();
    renderAccount();
    renderGroup();
    renderDock();
    document.documentElement.classList.toggle("light", state.theme === "light");
  }

  /* ---------- feedback ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3600);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var viewBtn = e.target.closest("[data-view-btn]");
    if (viewBtn) {
      ui.view = viewBtn.getAttribute("data-view-btn");
      renderDock();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-trip");
    if (action === "theme") {
      state.theme = state.theme === "light" ? "dark" : "light";
      save(); render();
    } else if (action === "select") {
      ui.selected = id; ui.changing = null; render();
      document.querySelector(".hero").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "start") {
      start(id);
    } else if (action === "complete") {
      complete(id);
    } else if (action === "change-open") {
      ui.changing = id; renderHeroOnly();
    } else if (action === "change-close") {
      ui.changing = null; renderHeroOnly();
    } else if (action === "change-save") {
      var sel = document.getElementById("driver-pick");
      changeDriver(id, Number(sel.value));
    }
  });

  document.addEventListener("change", function (e) {
    var input = e.target;
    if (input.matches && input.matches("[data-check]")) {
      toggleDelivered(input.getAttribute("data-trip"), Number(input.getAttribute("data-check")), input.checked);
    } else if (input.matches && input.matches("[data-empty]")) {
      toggleEmpty(input.getAttribute("data-trip"), input.checked);
    }
  });

  render();
})();
