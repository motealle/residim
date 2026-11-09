<?php
/**
 * «آگهی‌های هم‌مسیری» — server-rendered so search engines read every ad (residim.ir/ads, /ads/1234).
 * Guests see only what is safe: cities, a neighbourhood, time, seats, cost-sharing and «فقط بانوان/آقایان». Never a phone, a name or an exact address.
 * Posting, messaging and «my ads» run in /assets/ads.js against r6.php with the member's own token.
 */
declare(strict_types=1);
require_once __DIR__ . '/r6x.php';
x_schema();
header('X-Content-Type-Options: nosniff');
const SITE = 'https://residim.ir';
function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function ago(int $t): string { $d = max(0, time() - $t); if ($d < 3600) return fa_d(max(1, intdiv($d, 60))) . ' دقیقه پیش'; if ($d < 86400) return fa_d(intdiv($d, 3600)) . ' ساعت پیش'; return fa_d(intdiv($d, 86400)) . ' روز پیش'; }
function qs(array $f): string { $f = array_filter($f, fn($v) => $v !== '' && $v !== null && $v !== 0); return $f ? '?' . http_build_query($f) : ''; }
const ROUTES = [['تهران', 'مشهد'], ['تهران', 'قم'], ['تهران', 'اصفهان'], ['تهران', 'شیراز'], ['تهران', 'کرج'], ['تهران', 'رشت'], ['تهران', 'تبریز'], ['قم', 'تهران'], ['اصفهان', 'تهران'], ['مشهد', 'تهران'], ['کرج', 'تهران'], ['تهران', 'کربلا']];
const FAQ = [['رسیدیم تاکسی یا آژانس است؟', 'نه. رسیدیم اپ حمل‌ونقل نیست و راننده و ماشین ندارد. فقط هم‌مسیرها را به هم معرفی می‌کند. چطور بروید، با ماشین شخصی، تاکسیِ دارای مجوز یا سرویس، تصمیم و مسئولیت خودتان است.'],
    ['هزینه چطور حساب می‌شود؟', 'هر آگهی یکی از این سه است: دنگی (تقسیم هزینه‌ی بنزین و عوارض، بی‌سود)، رایگان، یا احسانی. رسیدیم پولی جابه‌جا نمی‌کند و از سفر سهمی برنمی‌دارد.'],
    ['از کجا بدانم امن است؟', 'هر آگهی سابقه‌ی آگهی‌دهنده را نشان می‌دهد: تاریخ عضویت، شماره‌ی تأییدشده و تعداد همسفرانِ راضی. حساب‌های تازه برچسب «حساب تازه» دارند. پیش از حرکت «کارت سفر» (ماشین، پلاک، جای سوار شدن) را پر کنید و برای یک آشنا بفرستید. هم‌مسیری فقط میان هم‌جنس‌هاست و آگهی فقط برای بزرگسالان است. پیام دادن به شماره‌ی تأییدشده نیاز دارد. شماره و نشانیِ کسی در آگهی نمی‌آید و تا آگهی‌دهنده پاسخ ندهد، کسی نمی‌تواند شماره بفرستد. آگهیِ مشکوک را گزارش کنید؛ با سه گزارش، خودکار پنهان می‌شود.'],
    ['همسفرِ آشنا یعنی چه؟', 'می‌توانید آگهی را فقط به مخاطبانی نشان دهید که خودتان از گوشی انتخاب می‌کنید؛ مثلاً همکاران یا اقوام. شماره‌ها رمزنگاری‌شده نگه داشته می‌شوند و آگهی برای دیگران دیده نمی‌شود.'],
    ['آگهی گذاشتن رایگان است؟', 'بله. تا ۳ آگهیِ فعال رایگان است. با اشتراک رسیدیم این‌ها هم اضافه می‌شود: تا ۱۰ آگهی، بالا بردنِ روزانه، هشدار آگهیِ تازه در مسیر شما، پیامکِ پیامِ تازه و آمار بازدید.']];

if (!flag('ads_on')) { http_response_code(404); header('Content-Type: text/html; charset=utf-8'); echo '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>آگهی‌ها – رسیدیم</title></head><body style="font-family:Tahoma;text-align:center;padding:60px 16px"><h1>بخش آگهی‌ها فعلاً بسته است.</h1><p><a href="/">بازگشت به رسیدیم</a></p></body></html>'; exit; }
$no = (int)($_GET['no'] ?? 0); $u = auth(false);
$f = ['k' => (string)($_GET['k'] ?? ''), 'from' => s1((string)($_GET['from'] ?? ''), 40), 'to' => s1((string)($_GET['to'] ?? ''), 40), 'g' => (string)($_GET['g'] ?? ''), 'r' => (string)($_GET['r'] ?? ''), 'q' => s1((string)($_GET['q'] ?? ''), 40)];
$pg = max(0, min(50, (int)($_GET['p'] ?? 0)));
$ld = []; $robots = 'index,follow,max-image-preview:large'; $status = 200; $body = '';

if ($no) {
    $ad = ad_by_no($no);
    if (!$ad || in_array($ad['status'], ['hidden', 'removed', 'pending', 'review'], true)) { $status = 404; $title = 'آگهی پیدا نشد'; $desc = 'این آگهی وجود ندارد یا برداشته شده است.'; $robots = 'noindex,follow'; $canon = SITE . '/ads/'; }
    elseif ($ad['audience'] === 'contacts') { $title = 'آگهیِ هم‌مسیریِ خصوصی'; $desc = 'این آگهی فقط برای آشنایانِ آگهی‌دهنده است.'; $robots = 'noindex,nofollow'; $canon = SITE . '/ads/' . $no; $private = true; }
    else {
        $A = ad_out($ad, true); $gone = $ad['status'] !== 'live' || (int)$ad['expires'] < time(); if ($gone) { $status = 410; $robots = 'noindex,follow'; }
        $title = $A['title'] . ' – ' . $A['kind_t'] . ' – ' . $A['g_t']; $desc = mb_substr($A['when'] . '. ' . ($A['role'] === 'driver' ? fa_d($A['seats']) . ' جای خالی. ' : '') . $A['share_t'] . '. ' . ($A['body'] ?: 'هم‌مسیرِ ' . $A['from_city'] . ' به ' . $A['to_city'] . ' را در رسیدیم پیدا کنید.'), 0, 158);
        $canon = SITE . '/ads/' . $no;
        if (!$gone && hit('adv_' . $ad['id'] . '_' . ip_tag(), 21600) === 1) q('UPDATE ads SET views=views+1 WHERE id=?', [$ad['id']]);
        $trip = ['@context' => 'https://schema.org', '@type' => 'Trip', 'name' => $A['title'], 'description' => $desc, 'url' => $canon, 'itinerary' => ['@type' => 'ItemList', 'itemListElement' => [['@type' => 'ListItem', 'position' => 1, 'item' => ['@type' => 'City', 'name' => $A['from_city']]], ['@type' => 'ListItem', 'position' => 2, 'item' => ['@type' => 'City', 'name' => $A['to_city']]]]]];
        if ($A['at']) $trip['departureTime'] = date('c', $A['at']);
        $ld[] = $trip;
        $ld[] = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => [['@type' => 'ListItem', 'position' => 1, 'name' => 'رسیدیم', 'item' => SITE . '/'], ['@type' => 'ListItem', 'position' => 2, 'name' => 'آگهی‌های هم‌مسیری', 'item' => SITE . '/ads/'], ['@type' => 'ListItem', 'position' => 3, 'name' => $A['from_city'] . ' به ' . $A['to_city'], 'item' => SITE . '/ads/' . qs(['from' => $A['from_city'], 'to' => $A['to_city']])], ['@type' => 'ListItem', 'position' => 4, 'name' => 'آگهی ' . fa_d($no)]]];
        $sim = ads_query(['from' => $A['from_city'], 'to' => $A['to_city'], 'g' => $A['g']], 6)['list']; $sim = array_values(array_filter($sim, fn($x) => $x['no'] !== $no));
        $body = '<nav class="crumb" aria-label="مسیر"><a href="/">رسیدیم</a> › <a href="/ads/">آگهی‌ها</a> › <a href="/ads/' . h(qs(['from' => $A['from_city'], 'to' => $A['to_city']])) . '">' . h($A['from_city'] . ' به ' . $A['to_city']) . '</a></nav>'
            . '<article class="ad-d" data-no="' . $no . '" data-g="' . h($A['g']) . '">' . ($gone ? '<p class="gone">این آگهی بسته شده یا زمانش گذشته است. آگهی‌های مشابه پایین صفحه‌اند.</p>' : '')
            . '<div class="ad-tags"><span class="t k-' . h($A['kind']) . '">' . h($A['kind_t']) . '</span><span class="t g">' . h($A['g_t']) . '</span><span class="t">' . ($A['role'] === 'driver' ? '🚗 ' . fa_d($A['seats']) . ' جای خالی' : '🙋 ' . fa_d($A['seats']) . ' نفر، دنبال جا') . '</span><span class="t s">' . h($A['share_t']) . '</span>' . ($A['pin'] ? '<span class="t pin">ویژه</span>' : '') . '</div>'
            . '<h1>' . h($A['title']) . '</h1><div class="route"><div><small>مبدأ</small><b>' . h($A['from_city']) . '</b>' . ($A['from_area'] ? '<span>' . h($A['from_area']) . '</span>' : '') . '</div><i aria-hidden="true"></i><div><small>مقصد</small><b>' . h($A['to_city']) . '</b>' . ($A['to_area'] ? '<span>' . h($A['to_area']) . '</span>' : '') . '</div></div>'
            . '<p class="when">🕒 ' . h($A['when']) . '</p>' . ($A['body'] ? '<p class="body">' . nl2br(h($A['body'])) . '</p>' : '')
            . (function () use ($ad) { $T = trust_of($ad['user_id']); return '<p class="trust">🛡 شماره‌ی تأییدشده · عضو از ' . h($T['since_t']) . ($T['good'] ? ' · <b>' . fa_d($T['good']) . ' همسفرِ راضی</b>' : '') . ($T['new'] ? ' · <span class="newacc">حساب تازه است؛ با احتیاط بیشتر</span>' : '') . '</p>'; })()
            . '<p class="meta">ثبت: ' . ago((int)$ad['created']) . ((int)$ad['bumped'] > (int)$ad['created'] + 600 ? ' · به‌روز: ' . ago((int)$ad['bumped']) : '') . ' · شماره‌ی آگهی ' . fa_d($no) . '</p>'
            . ($gone ? '' : '<div class="ad-act" id="ad-act"><button class="btn pri" data-do="msg">پیام به آگهی‌دهنده</button><button class="btn ghost" data-do="share">فرستادن برای دیگران</button></div><div id="ad-thread"></div>')
            . '<div class="safe"><b>🛡 سفرِ امن با غریبه</b><ul><li>اول در همین گفتگو آشنا شوید و «کارت سفر» را پر کنید: ماشین، رنگ، پلاک و جای سوار شدن.</li><li>کارت سفر را پیش از حرکت برای یک آشنا بفرستید.</li><li>جای سوار شدن شلوغ و شناخته‌شده باشد، نه درِ خانه. بیعانه نفرستید.</li><li>اگر چیزی درست نبود، سوار نشوید. در خطر: پلیس ۱۱۰، اورژانس ۱۱۵.</li></ul><small>گفتگوها نگه‌داری می‌شوند و در صورت شکایت، طبق قانون در اختیار مراجع قضایی قرار می‌گیرند. <button class="link" data-do="report">گزارش این آگهی</button></small></div></article>'
            . ($sim ? '<section class="sim"><h2>آگهی‌های مشابه</h2><div class="cards">' . implode('', array_map('card', $sim)) . '</div></section>' : '');
    }
}
function card(array $a): string { $drv = $a['role'] === 'driver';
    return '<a class="card ad-c' . ($a['pin'] ? ' pin' : '') . '" href="/ads/' . $a['no'] . '"><div class="ad-tags"><span class="t k-' . h($a['kind']) . '">' . h($a['kind_t']) . '</span><span class="t g">' . h($a['g_t']) . '</span>' . ($a['pin'] ? '<span class="t pin">ویژه</span>' : '') . '<span class="role ' . ($drv ? 'd' : 'r') . '">' . ($drv ? 'جا دارد' : 'دنبال جا') . '</span></div>'
    . '<div class="rt"><span class="pt"><b>' . h($a['from_city']) . '</b>' . ($a['from_area'] ? '<small>' . h($a['from_area']) . '</small>' : '') . '</span><span class="pt e"><b>' . h($a['to_city']) . '</b>' . ($a['to_area'] ? '<small>' . h($a['to_area']) . '</small>' : '') . '</span></div>'
    . '<span class="when"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' . h($a['when']) . '</span>'
    . '<span class="foot"><span>' . ($drv ? '<b>' . fa_d($a['seats']) . '</b> جای خالی' : 'مسافر') . ' · ' . h($a['share_t']) . '</span><small>' . ago($a['bumped'] ?: $a['created']) . '</small></span></a>'; }

if (!$no) {
    $R = ads_query($f, 30, $pg * 30); $kt = AD_KINDS[$f['k']] ?? '';
    $where = $f['from'] && $f['to'] ? 'از ' . $f['from'] . ' به ' . $f['to'] : ($f['from'] ? 'از ' . $f['from'] : ($f['to'] ? 'به ' . $f['to'] : ''));
    $h1 = $where ? 'هم‌مسیر و همسفر ' . $where : ($kt ? 'آگهی هم‌مسیری ' . $kt : 'آگهی‌های هم‌مسیری و همسفر');
    $title = $h1 . ($kt && $where ? ' – ' . $kt : '') . ($pg ? ' – صفحه‌ی ' . fa_d($pg + 1) : '') . ' | رسیدیم';
    $desc = ($where ? "آگهی‌های همسفر و هم‌مسیرِ $where" : 'همسفرِ بین‌شهری، هم‌مسیرِ مدرسه و محل کار و دانشگاه، و همسفرِ آشنا') . '؛ دنگی، رایگان یا احسانی، فقط میان هم‌جنس‌ها. ' . ($R['n'] ? fa_d($R['n']) . ' آگهی فعال.' : 'آگهی رایگان بگذارید.');
    $canon = SITE . '/ads/' . qs(['k' => $f['k'], 'from' => $f['from'], 'to' => $f['to'], 'p' => $pg ?: null]);
    if ($f['q'] || $f['g'] || $f['r'] || ($R['n'] === 0 && ($where || $kt))) $robots = 'noindex,follow';
    if ($R['list']) { $lm = max(array_map(fn($x) => $x['bumped'] ?: $x['created'], $R['list'])); header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lm) . ' GMT'); }
    $ld[] = ['@context' => 'https://schema.org', '@type' => 'ItemList', 'name' => $h1, 'numberOfItems' => $R['n'], 'itemListElement' => array_map(fn($x, $i) => ['@type' => 'ListItem', 'position' => $i + 1 + $pg * 30, 'url' => SITE . '/ads/' . $x['no'], 'name' => $x['title']], $R['list'], array_keys($R['list']))];
    $ld[] = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => array_merge([['@type' => 'ListItem', 'position' => 1, 'name' => 'رسیدیم', 'item' => SITE . '/'], ['@type' => 'ListItem', 'position' => 2, 'name' => 'آگهی‌های هم‌مسیری', 'item' => SITE . '/ads/']], $where || $kt ? [['@type' => 'ListItem', 'position' => 3, 'name' => $h1]] : [])];
    if (!$where && !$kt && !$pg) { $ld[] = ['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => array_map(fn($x) => ['@type' => 'Question', 'name' => $x[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $x[1]]], FAQ)];
        $ld[] = ['@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => 'رسیدیم', 'url' => SITE . '/', 'potentialAction' => ['@type' => 'SearchAction', 'target' => SITE . '/ads/?q={q}', 'query-input' => 'required name=q']]; }
    $top = rows("SELECT from_city, to_city, COUNT(*) n FROM ads WHERE status='live' AND audience='public' AND expires>? GROUP BY from_city, to_city ORDER BY n DESC LIMIT 12", [time()]);
    $routes = array_slice(array_values(array_unique(array_merge(array_map(fn($r) => $r['from_city'] . '|' . $r['to_city'], $top), array_map(fn($r) => $r[0] . '|' . $r[1], ROUTES)))), 0, 16);
    $kinds = '<a href="/ads/' . h(qs(['from' => $f['from'], 'to' => $f['to']])) . '" ' . (!$f['k'] ? 'aria-current="page"' : '') . '>همه</a>' . implode('', array_map(fn($k, $t) => '<a href="/ads/' . h(qs(['k' => $k, 'from' => $f['from'], 'to' => $f['to']])) . '" ' . ($f['k'] === $k ? 'aria-current="page"' : '') . '><i aria-hidden="true">' . (['intercity' => '🛣', 'daily' => '🔁', 'school' => '🎒', 'uni' => '🎓', 'work' => '💼', 'event' => '🎉'][$k] ?? '•') . '</i>' . h($t) . '</a>', array_keys(AD_KINDS), AD_KINDS));
    $body = '<section class="ads-hero"><div class="wrap"><span class="kick">آگهی‌های هم‌مسیری</span><h1>' . h($h1) . '</h1><p class="lead">' . ($where ? 'هم‌مسیرهای ' . h($where) . '، دنگی و فقط میان هم‌جنس‌ها. هر آگهی با جزئیاتِ امن: شهر، محله، ساعت و جای خالی.' : 'سفر بین‌شهری، رفت‌وآمد روزانه، مدرسه، دانشگاه و همسفرِ آشنا. جای خالیِ ماشین‌تان را بگذارید یا هم‌مسیرتان را پیدا کنید. دنگی، رایگان یا احسانی؛ فقط میان هم‌جنس‌ها.') . '</p>'
        . '<form class="find" action="/ads/" method="get" role="search"><input type="hidden" name="k" value="' . h($f['k']) . '"><label class="fr"><span>از</span><input name="from" value="' . h($f['from']) . '" placeholder="شهر مبدأ" list="cities" autocomplete="off"></label><button type="button" class="swap" data-do="swap" aria-label="جابه‌جاییِ مبدأ و مقصد">⇅</button><label class="to"><span>به</span><input name="to" value="' . h($f['to']) . '" placeholder="شهر مقصد" list="cities" autocomplete="off"></label>'
        . '<label class="sel"><span>برای</span><select name="g"><option value="">همه</option><option value="f"' . ($f['g'] === 'f' ? ' selected' : '') . '>بانوان</option><option value="m"' . ($f['g'] === 'm' ? ' selected' : '') . '>آقایان</option></select></label><button class="btn pri go">جست‌وجو</button></form>'
        . '<div class="acts"><button class="btn gold" data-do="new">+ ثبت آگهی رایگان</button><button class="btn ghost" data-do="me">آگهی‌ها و پیام‌های من</button></div>'
        . '<ul class="pledge"><li><b>فقط هم‌جنس‌ها</b> آگهی را می‌بینند</li><li><b>بی‌شماره</b>؛ گفتگو درون رسیدیم</li><li><b>بی‌سود</b>؛ دنگی، رایگان یا احسانی</li></ul></div></section>'
        . '<div class="wrap"><nav class="kinds" aria-label="نوع آگهی">' . $kinds . '</nav>'
        . '<p class="count">' . ($R['n'] ? fa_d($R['n']) . ' آگهیِ فعال' . ($R['list'] ? ' · تازه‌ترین: ' . ago(max(array_map(fn($x) => $x['bumped'] ?: $x['created'], $R['list']))) : '') : '') . '</p>'
        . ($R['list'] ? '<div class="cards">' . implode('', array_map('card', $R['list'])) . '</div>' : '<div class="empty"><svg viewBox="0 0 160 70" aria-hidden="true"><path d="M14 54 C50 54 50 18 86 18 S130 40 146 22" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round"/><circle cx="14" cy="54" r="7" fill="#1DBF73"/><path d="M146 6c-6 0-10 4-10 9 0 7 10 16 10 16s10-9 10-16c0-5-4-9-10-9z" fill="#FFC93C"/><circle cx="146" cy="15" r="3" fill="#04140B"/></svg><b>' . ($where || $kt ? 'هنوز آگهی‌ای در این مسیر نیست.' : 'هنوز آگهی‌ای نیست.') . '</b><p>اولین نفر باشید. آگهی که بگذارید، هم‌مسیرهای هم‌جنسِ همین مسیر می‌بینند و در رسیدیم پیام می‌دهند.</p><button class="btn pri" data-do="new">ثبت آگهی رایگان</button></div>')
        . ($R['n'] > ($pg + 1) * 30 || $pg ? '<nav class="pager">' . ($pg ? '<a href="/ads/' . h(qs($f + ['p' => $pg - 1 ?: null])) . '" rel="prev">→ صفحه‌ی قبل</a>' : '') . ($R['n'] > ($pg + 1) * 30 ? '<a href="/ads/' . h(qs($f + ['p' => $pg + 1])) . '" rel="next">صفحه‌ی بعد ←</a>' : '') . '</nav>' : '')
        . '<section class="routes"><h2>مسیرهای پرجست‌وجو</h2><div>' . implode('', array_map(function ($r) { [$a, $b] = explode('|', $r); return '<a href="/ads/' . h(qs(['from' => $a, 'to' => $b])) . '">' . h($a) . ' ← ' . h($b) . '</a>'; }, $routes)) . '</div></section>'
        . (!$where && !$kt ? '<section class="faq"><h2>پرسش‌های پرتکرار</h2>' . implode('', array_map(fn($x) => '<details><summary>' . h($x[0]) . '</summary><p>' . h($x[1]) . '</p></details>', FAQ)) . '</section>' : '')
        . '<section class="why"><div><b>🛡 امن، بی‌داده‌ی حساس</b><span>نه شماره، نه نشانی، نه نام. فقط هم‌جنس‌ها به هم پیام می‌دهند.</span></div><div><b>💚 بی‌سود</b><span>دنگی، رایگان یا احسانی. رسیدیم پول جابه‌جا نمی‌کند.</span></div><div><b>👥 همسفرِ آشنا</b><span>آگهی را فقط به مخاطبانِ انتخابیِ خودتان نشان دهید.</span></div></section></div>'
        . '<datalist id="cities">' . implode('', array_map(fn($c) => '<option value="' . h($c) . '">', ['تهران', 'مشهد', 'اصفهان', 'کرج', 'شیراز', 'تبریز', 'قم', 'اهواز', 'کرمانشاه', 'رشت', 'ارومیه', 'زاهدان', 'همدان', 'کرمان', 'یزد', 'اراک', 'اردبیل', 'بندرعباس', 'قزوین', 'زنجان', 'گرگان', 'ساری', 'سنندج', 'خرم‌آباد', 'بوشهر', 'بیرجند', 'ایلام', 'شهرکرد', 'سمنان', 'یاسوج', 'کاشان', 'کربلا', 'نجف'])) . '</datalist>';
}
if (!empty($private)) $body = '<article class="ad-d" id="ad-private" data-no="' . $no . '"><p class="lead">این آگهی فقط برای آشنایانِ آگهی‌دهنده است. اگر شماره‌ی شما را انتخاب کرده‌اند، وارد شوید تا ببینید.</p><button class="btn pri" data-do="login">ورود</button></article>';
if ($status === 404) $body = '<div class="wrap empty"><b>این آگهی پیدا نشد.</b><p>شاید برداشته شده باشد. آگهی‌های فعال را ببینید.</p><a class="btn pri" href="/ads/">همه‌ی آگهی‌ها</a></div>';
http_response_code($status);
header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: public, max-age=120');
$V = '44';
?><!doctype html>
<html lang="fa-IR" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= h($title) ?></title>
<meta name="description" content="<?= h($desc) ?>">
<meta name="robots" content="<?= $robots ?>">
<link rel="canonical" href="<?= h($canon) ?>">
<meta name="theme-color" content="#04140B">
<meta property="og:type" content="website"><meta property="og:site_name" content="رسیدیم"><meta property="og:locale" content="fa_IR">
<meta property="og:title" content="<?= h($title) ?>"><meta property="og:description" content="<?= h($desc) ?>"><meta property="og:url" content="<?= h($canon) ?>"><meta property="og:image" content="<?= SITE ?>/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/icon.svg?v=<?= $V ?>" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/icon-192.png">
<link rel="preload" href="/assets/vazirmatn.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/ads.css?v=<?= $V ?>">
<?php foreach ($ld as $j) echo '<script type="application/ld+json">' . json_encode($j, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . "</script>\n"; ?>
</head>
<body>
<header class="bar"><div class="wrap"><a class="brand" href="/"><img src="/assets/icon.svg?v=<?= $V ?>" alt="" width="36" height="36"><span>رسیدیم<small>آگهی‌های هم‌مسیری</small></span></a>
<nav aria-label="پیوندها"><a href="/ads/">آگهی‌ها</a><a href="/stories/">قصه‌ها</a><a href="/schools/">مدارس</a></nav><button class="btn pri sm" data-do="new">+ آگهی</button></div></header>
<main><?= $no && $status !== 404 && empty($private) ? '<div class="wrap">' . $body . '</div>' : $body ?></main>
<footer><div class="wrap"><span>رسیدیم فقط هم‌مسیرها را به هم معرفی می‌کند و اپ حمل‌ونقل نیست؛ رفت‌وآمد با تصمیم و مسئولیت خود کاربران است. آگهی فقط برای بزرگسالان و هم‌مسیری فقط میان هم‌جنس‌هاست.</span><span><a href="/ads/">آگهی‌ها</a> · <a href="/pricing/">تعرفه‌ها</a> · <a href="/">ورود به اپ</a></span></div></footer>
<div class="dlg" id="dlg" hidden></div><div class="toast" id="toast" role="status"></div>
<?php if (!$no): ?><button class="fab" data-do="new" aria-label="ثبت آگهی رایگان">+ ثبت آگهی</button><?php endif; ?>
<script src="/assets/ads.js?v=<?= $V ?>" defer></script>
</body>
</html>
