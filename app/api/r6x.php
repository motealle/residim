<?php
/**
 * r6x — three features on top of r6.php, loaded by its router for actions it does not know, and by ads.php / sitemap.php:
 *  1) «آگهی‌های هم‌مسیری»: a public board (guests read, signed-in members message, members of the same gender only).
 *  2) «دارم می‌روم»: a sudden leave from a workplace mesirak → coworkers going the same way now get told, join a short-lived group and chat.
 *  3) «اردوی مدرسه»: a school (paid panel) invites its families; RSVPs become cars by proximity and the mahram rules; each car gets a chat.
 * Temporary groups (tgroups) serve 2 and 3. Nothing here shows a phone number, an exact home or a name to a guest.
 */
declare(strict_types=1);
require_once __DIR__ . '/r6.php';

function x_schema(): void {
    static $done = false; if ($done) return; $done = true; $v = (int)getv('xschema', '0'); if ($v >= 7) return; if ($v === 6) { x_schema7(); return; } if ($v === 5) { x_schema6(); x_schema7(); return; } if ($v === 4) { x_schema5(); x_schema6(); x_schema7(); return; } if ($v === 3) { x_schema4(); x_schema5(); x_schema6(); x_schema7(); x_schema7(); return; } if ($v === 2) { x_schema3(); x_schema4(); x_schema5(); x_schema6(); x_schema7(); x_schema7(); return; } if ($v === 1) { x_schema2(); x_schema3(); x_schema4(); x_schema5(); x_schema6(); x_schema7(); x_schema7(); return; }
    $p = db6(); $K = 'VARCHAR(40)'; $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '';
    foreach ([
        "CREATE TABLE IF NOT EXISTS ads (id $K PRIMARY KEY, no INT UNIQUE, user_id $K, kind VARCHAR(12), role VARCHAR(6), g VARCHAR(1), from_city VARCHAR(40), from_area VARCHAR(60), to_city VARCHAR(40), to_area VARCHAR(60), title VARCHAR(90), body TEXT, at INT, days VARCHAR(20), tm VARCHAR(5), seats INT, share VARCHAR(8), audience VARCHAR(8), contacts TEXT, status VARCHAR(10), pin_until INT DEFAULT 0, views INT DEFAULT 0, msgs INT DEFAULT 0, reports INT DEFAULT 0, bumped INT, created INT, updated INT, expires INT)$my",
        "CREATE TABLE IF NOT EXISTS ad_threads (id $K PRIMARY KEY, ad_id $K, asker $K, owner $K, last INT, owner_rd INT DEFAULT 0, asker_rd INT DEFAULT 0, owner_replied INT DEFAULT 0, blocked INT DEFAULT 0, created INT)$my",
        "CREATE TABLE IF NOT EXISTS ad_msgs (id $K PRIMARY KEY, thread_id $K, from_user $K, text VARCHAR(600), created INT)$my",
        "CREATE TABLE IF NOT EXISTS ad_reports (ad_id $K, user_id $K, reason VARCHAR(20), text VARCHAR(300), created INT, PRIMARY KEY(ad_id, user_id))$my",
        "CREATE TABLE IF NOT EXISTS ad_alerts (id $K PRIMARY KEY, user_id $K, kind VARCHAR(12), from_city VARCHAR(40), to_city VARCHAR(40), created INT)$my",
        "CREATE TABLE IF NOT EXISTS tgroups (id $K PRIMARY KEY, kind VARCHAR(8), ref $K, place_id $K, g VARCHAR(1), owner $K, title VARCHAR(120), at INT, until INT, status VARCHAR(8), created INT)$my",
        "CREATE TABLE IF NOT EXISTS tg_members (group_id $K, profile_id $K, user_id $K, role VARCHAR(6), seats INT, at_site INT DEFAULT 0, created INT, PRIMARY KEY(group_id, profile_id))$my",
        "CREATE TABLE IF NOT EXISTS ordu (id $K PRIMARY KEY, place_id $K, title VARCHAR(120), dest VARCHAR(120), at INT, back VARCHAR(5), meet VARCHAR(120), who VARCHAR(8), cost INT, note VARCHAR(400), deadline INT, status VARCHAR(8), planned INT DEFAULT 0, plan TEXT, created INT)$my",
        "CREATE TABLE IF NOT EXISTS ordu_rsvp (ordu_id $K, profile_id $K, user_id $K, go INT, kids INT, adults_m INT, adults_f INT, role VARCHAR(6), seats INT, grp $K, created INT, updated INT, PRIMARY KEY(ordu_id, profile_id))$my",
        'ALTER TABLE users ADD COLUMN g VARCHAR(1)'] as $s) { try { $p->exec($s); } catch (Throwable $e) {} }
    foreach (['CREATE INDEX ix_ads_live ON ads(status, bumped)', 'CREATE INDEX ix_ads_user ON ads(user_id)', 'CREATE INDEX ix_adt_ad ON ad_threads(ad_id)', 'CREATE INDEX ix_adt_ask ON ad_threads(asker)', 'CREATE INDEX ix_adt_own ON ad_threads(owner)', 'CREATE INDEX ix_adm_t ON ad_msgs(thread_id)',
        'CREATE INDEX ix_tg_place ON tgroups(place_id, status)', 'CREATE INDEX ix_tgm_p ON tg_members(profile_id)', 'CREATE INDEX ix_ordu_pl ON ordu(place_id)'] as $s) { try { $p->exec($s); } catch (Throwable $e) {} }
    foreach (['ads_on' => '1', 'ads_review' => '0', 'leave_on' => '1', 'ordu_on' => '1'] as $k => $v) if (getv($k, null, $p) === null) setv($k, $v, $p);
    if (!getv('x_pepper', null, $p)) setv('x_pepper', bin2hex(random_bytes(16)), $p);
    setv('xschema', '1', $p); x_schema2(); x_schema3(); x_schema4(); x_schema5(); x_schema6(); x_schema7();
}
/** v37: school staff numbers (full access + panel), and the direction of a leave group (home | work). */
function x_schema2(): void { $p = db6(); $K = 'VARCHAR(40)'; $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '';
    foreach (["CREATE TABLE IF NOT EXISTS place_staff (place_id $K, phone VARCHAR(20), role VARCHAR(12), created INT, PRIMARY KEY(place_id, phone))$my", "ALTER TABLE tgroups ADD COLUMN dir VARCHAR(5) DEFAULT 'home'", 'CREATE INDEX ix_staff_ph ON place_staff(phone)'] as $q) { try { $p->exec($q); } catch (Throwable $e) {} }
    setv('xschema', '2', $p); }
/** v38: a trip card and a rating per conversation (safety between strangers), and the school logo. */
function x_schema3(): void { $p = db6(); foreach (['ALTER TABLE ad_threads ADD COLUMN trip TEXT', 'ALTER TABLE ad_threads ADD COLUMN owner_rate INT DEFAULT 0', 'ALTER TABLE ad_threads ADD COLUMN asker_rate INT DEFAULT 0', 'ALTER TABLE places ADD COLUMN logo TEXT'] as $q) { try { $p->exec($q); } catch (Throwable $e) {} } setv('xschema', '3', $p); }
/** v38: the member's own fixed details («اطلاعات من»), used to prefill every form. */
function x_schema4(): void { $p = db6(); try { $p->exec('ALTER TABLE users ADD COLUMN info TEXT'); } catch (Throwable $e) {} setv('xschema', '4', $p); }
/* v6 — profiles.hcell: a ~2 km home grid cell, so «same neighbourhood» is an indexed lookup (townships: Pardis, Pardisan, …) */
function x_schema6(): void { $p = db6(); try { $p->exec('ALTER TABLE profiles ADD COLUMN hcell VARCHAR(16)'); } catch (Throwable $e) {} try { $p->exec('CREATE INDEX ix_prof_hcell ON profiles(hcell)'); } catch (Throwable $e) {}
    foreach (rows("SELECT id, data FROM profiles WHERE kind IN ('work','uni')") as $r) { $d = json_decode((string)$r['data'], true) ?: []; if (isset($d['lat'], $d['lng']) && is_numeric($d['lat']) && (float)$d['lat'] != 0) q('UPDATE profiles SET hcell=? WHERE id=?', [hcell((float)$d['lat'], (float)$d['lng']), $r['id']]); }
    setv('xschema', '6'); }
/* v7 — «نقطه‌ی جمع»: a temporary shared start (hotel, guest house, a 12-unit block, a camp). Made on purpose, joined by link/QR, expires by itself. */
function x_schema7(): void { $p = db6(); $K = 'VARCHAR(40)';
    foreach (["CREATE TABLE IF NOT EXISTS gpts (id $K PRIMARY KEY, code VARCHAR(12) UNIQUE, owner $K, name VARCHAR(60), lat DOUBLE, lng DOUBLE, expires INT, created INT)",
              "CREATE TABLE IF NOT EXISTS gp_members (gp_id $K, user_id $K, created INT, PRIMARY KEY (gp_id, user_id))",
              "CREATE TABLE IF NOT EXISTS gp_posts (id $K PRIMARY KEY, gp_id $K, user_id $K, g VARCHAR(1), dest VARCHAR(60), at INT, role VARCHAR(6), seats INT, created INT)",
              "CREATE TABLE IF NOT EXISTS gp_join (post_id $K, user_id $K, created INT, PRIMARY KEY (post_id, user_id))"] as $sql) try { $p->exec($sql); } catch (Throwable $e) {}
    setv('xschema', '7'); }
function gp_name_of(string $uid): string { $I = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$uid])['info'] ?? ''), true) ?: []; $n = trim((string)($I['first'] ?? '') . ' ' . (string)($I['family'] ?? '')); return $n ?: 'هم‌اقامت'; }
function gp_out(array $gp, string $me): array { $g = user_g($me); $P = [];
    foreach (rows('SELECT * FROM gp_posts WHERE gp_id=? AND at>? ORDER BY at LIMIT 40', [$gp['id'], time() - 1800]) as $r) { if ($g && $r['g'] && $r['g'] !== $g) continue;
        $J = array_column(rows('SELECT user_id FROM gp_join WHERE post_id=?', [$r['id']]), 'user_id'); $P[] = ['id' => $r['id'], 'mine' => $r['user_id'] === $me, 'who' => gp_name_of($r['user_id']), 'dest' => $r['dest'], 'at' => (int)$r['at'], 'at_t' => hhmm((int)$r['at']), 'role' => $r['role'], 'seats' => (int)$r['seats'], 'n' => count($J), 'in' => in_array($me, $J, true)]; }
    return ['code' => $gp['code'], 'name' => $gp['name'], 'lat' => (float)$gp['lat'], 'lng' => (float)$gp['lng'], 'expires' => (int)$gp['expires'], 'owner' => $gp['owner'] === $me, 'members' => (int)(row('SELECT COUNT(*) c FROM gp_members WHERE gp_id=?', [$gp['id']])['c'] ?? 0), 'posts' => $P]; }
function hcell(float $la, float $ln): string { return (int)floor($la * 50) . ':' . (int)floor($ln * 50); }
function hcells(float $la, float $ln): array { $a = (int)floor($la * 50); $b = (int)floor($ln * 50); $o = []; for ($i = -1; $i <= 1; $i++) for ($j = -1; $j <= 1; $j++) $o[] = ($a + $i) . ':' . ($b + $j); return $o; }
/* corridor match — different workplaces, same neighbourhood, same direction: homes ≤2.5 km apart and destinations close
   relative to the trip (≤3 km, or ≤20% of a long commute: a whole township heading into the city finds itself) */
function lv_corr(array $pl, array $d, array $opl, array $od): ?int { $gap = home_gap($d, $od); if ($gap === null || $gap > 2500 || empty($pl['lat']) || empty($opl['lat'])) return null;
    $trip = hav((float)$d['lat'], (float)$d['lng'], (float)$pl['lat'], (float)$pl['lng']); $dd = hav((float)$pl['lat'], (float)$pl['lng'], (float)$opl['lat'], (float)$opl['lng']);
    return $trip >= 2000 && $dd <= max(3000, .2 * $trip) ? $gap : null; }
function x_schema5(): void { $p = db6(); try { $p->exec('ALTER TABLE users ADD COLUMN lv_credits INT DEFAULT 0'); } catch (Throwable $e) {}
    $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '';
    $p->exec("CREATE TABLE IF NOT EXISTS lv_use(user_id VARCHAR(40) NOT NULL, k VARCHAR(16) NOT NULL, at INT NOT NULL, paid INT DEFAULT 0, PRIMARY KEY(user_id, k))$my"); setv('xschema', '5', $p); }
/* «دارم می‌روم» quota: subscribers, sponsored places and paid teams are unlimited; everyone else rides as our guest — 30 trips in the
   first (gift) month, then 20 every 30 days — and after that uses prepaid trip passes (counted in trips, never money: no wallet).
   One trip = one direction on one day, so quitting and re-joining is never charged twice. */
/* v48 — «همین حالا» stays FREE by default (liquidity is the product); the cap+passes machinery only runs if admin turns go_paid on. */
function lv_quota(array $u, array $prof): array { if (leave_allowed($u, $prof) || getv('go_paid', '0') !== '1') return ['unlimited' => true];
    $usr = row('SELECT created, COALESCE(lv_credits,0) c FROM users WHERE id=?', [$u['user_id']]); $first = time() - (int)($usr['created'] ?? 0) < 30 * 86400;
    $free = $first ? (int)getv('leave_free_first', '30') : (int)getv('leave_free', '20');
    $since = $first ? (int)($usr['created'] ?? 0) : time() - 30 * 86400;
    $used = (int)(row('SELECT COUNT(*) n FROM lv_use WHERE user_id=? AND at>=? AND paid=0', [$u['user_id'], $since])['n'] ?? 0);
    return ['unlimited' => false, 'first' => $first, 'free' => $free, 'left' => max(0, $free - $used), 'credits' => (int)($usr['c'] ?? 0), 'price' => (int)getv('leave_trip_price', '10000')]; }
/* neighbouring workplaces/campuses (≤1.5 km): their people leave from practically the same spot, so they may share a ride too */
function lv_places(array $pl): array { $la = (float)$pl['lat']; $ln = (float)$pl['lng']; $o = [$pl['id'] => 0];
    foreach (rows('SELECT id, lat, lng FROM places WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ? AND id<>? LIMIT 80', [$la - .0136, $la + .0136, $ln - .0170, $ln + .0170, $pl['id']]) as $x) { $m = hav($la, $ln, (float)$x['lat'], (float)$x['lng']); if ($m <= 1500) $o[$x['id']] = $m; }
    return $o; }
function home_gap(array $a, array $b): ?int { return isset($a['lat'], $b['lat']) && $a['lat'] && $b['lat'] ? (int)hav((float)$a['lat'], (float)$a['lng'], (float)$b['lat'], (float)$b['lng']) : null; }
function km_t(int $m): string { return $m < 1000 ? fa_d((string)(max(1, (int)round($m / 100)) * 100)) . ' متر' : fa_d(str_replace('.', '٫', (string)round($m / 1000, 1))) . ' کیلومتر'; }
/* a neighbour of the same gender, matching direction, whose home is close: same workplace → same_way (route-aware); a neighbouring one → homes ≤3 km */
function lv_match(array $pl, array $d, array $od, bool $same): ?int { $gap = home_gap($d, $od); if ($gap === null) return null; if ($same) return same_way($pl, $d, $od) ? $gap : null; return $gap <= 3000 ? $gap : null; }
/* wizard → «اطلاعات من»: the latest finished mesirak is the freshest truth for name, home, role and car seats; kids merge by first name */
function info_from_wizard(string $uid, array $d): void { x_schema(); $I = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$uid])['info'] ?? ''), true) ?: [];
    foreach (['family' => 40, 'hood' => 60] as $k => $n) if (!empty($d[$k])) $I[$k] = s1((string)$d[$k], $n);
    if (in_array($d['job'] ?? '', ['teacher', 'cleric', 'academic', 'student', 'medic'], true)) $I['job'] = $d['job'];
    if (($d['job'] ?? '') === 'cleric' && !empty($d['tcode'])) $I['tcode'] = substr(dg((string)$d['tcode']), 0, 12); // wizard → «اطلاعات من»
    if (in_array($d['rel'] ?? '', ['mother', 'father', 'grandma', 'grandpa', 'sister', 'brother'], true)) $I['rel'] = $d['rel'];
    if (isset($d['lat'], $d['lng']) && is_numeric($d['lat']) && is_numeric($d['lng']) && (float)$d['lat'] != 0) { $I['lat'] = round((float)$d['lat'], 6); $I['lng'] = round((float)$d['lng'], 6); }
    if (($d['role'] ?? 'pay') !== 'pay' && (int)($d['seats'] ?? 0) > 0) $I['seats'] = min(8, (int)$d['seats']);
    $ks = array_values(array_filter((array)($d['kids'] ?? []), fn($k) => is_array($k) && trim((string)($k['first'] ?? '')) !== ''));
    if ($ks) { $have = array_values(array_filter((array)($I['kids'] ?? []), fn($h) => !in_array($h['first'] ?? '', array_map(fn($k) => trim((string)$k['first']), $ks), true)));
        $I['kids'] = array_slice(array_merge($have, array_map(fn($k) => ['first' => s1((string)$k['first'], 30), 'g' => in_array($k['g'] ?? '', ['f', 'm'], true) ? $k['g'] : '', 'by' => (int)($k['by'] ?? 0) ?: ''], $ks)), 0, 6); }
    if (!empty($d['pg']) && in_array($d['pg'], ['f', 'm'], true)) set_g($uid, $d['pg']);
    q('UPDATE users SET info=? WHERE id=?', [json_encode($I, JSON_UNESCAPED_UNICODE), $uid]); }
/* route reminders, piggy-backed on traffic (no cron on the host): at most every 5 min, members whose repeated route («اطلاعات من»)
   starts in 10–25 minutes today get one push — once per route per day. Tehran time, Iranian week (Sat=0). */
function bug_outbox(?array $add = null): void { $dir = dirname(__DIR__) . '/storage'; $f = "$dir/bug-outbox.json"; $ack = "$dir/bug-ack.json"; $fp = @fopen($f, 'c+'); if (!$fp) return;
    try { flock($fp, LOCK_EX); $L = json_decode((string)stream_get_contents($fp), true) ?: []; if (is_file($ack)) { $A = array_flip((array)(json_decode((string)@file_get_contents($ack), true) ?: [])); $L = array_values(array_filter($L, fn($r) => !isset($A[$r['id'] ?? '']))); }
        if ($add) $L[] = $add; $L = array_slice($L, -300); ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($L, JSON_UNESCAPED_UNICODE)); } finally { flock($fp, LOCK_UN); fclose($fp); } }
/** v57 quiet pattern watch for admins (once a day): repeated cancels after matching, people blocked by several others, ad floods.
    Users are never told; the admin event feed gets one masked line per pattern so rules can be tuned. No AI service, no data leaves the server. */
function x_anomaly(): void { $day = date('Ymd'); if (getv('anom_day', '') === $day) return; setv('anom_day', $day); $since = time() - 7 * 86400; $out = [];
    $C = []; foreach (rows("SELECT meta FROM events WHERE kind='leave_cancel' AND created>? LIMIT 3000", [$since]) as $r) { $m = json_decode((string)$r['meta'], true) ?: []; if (!empty($m['u'])) $C[$m['u']] = ($C[$m['u']] ?? 0) + 1; }
    foreach ($C as $id => $n) if ($n >= 3) $out[] = ['🔁 لغوِ مکرر پس از جور شدن', $id, $n];
    $B = []; foreach (rows("SELECT data FROM profiles WHERE data LIKE '%\"blocked\"%' LIMIT 5000") as $r) foreach ((array)(pdata($r)['blocked'] ?? []) as $pid) $B[(string)$pid] = ($B[(string)$pid] ?? 0) + 1;
    foreach ($B as $pid => $n) if ($n >= 2 && ($p = row('SELECT user_id FROM profiles WHERE id=?', [$pid]))) $out[] = ['🚫 چند نفر جداگانه مسدودش کرده‌اند', $p['user_id'], $n];
    try { foreach (rows('SELECT user_id, COUNT(*) c FROM ads WHERE created>? GROUP BY user_id HAVING COUNT(*)>=5', [$since]) as $r) $out[] = ['📢 آگهیِ پرتعداد (احتمال کرایه‌کشی)', $r['user_id'], (int)$r['c']]; } catch (Throwable $e) {}
    foreach (array_slice($out, 0, 30) as [$t, $uid, $n]) { $ph = (string)(row('SELECT phone FROM users WHERE id=?', [$uid])['phone'] ?? ''); ev_log('alert', "$t: " . pmask($ph ?: null) . ' (' . fa_d((string)$n) . ' بار در ۷ روز)', ['u' => $uid, 'n' => $n]); } }
function route_tick(): void { if ((int)getv('rt_tick', '0') > time() - 300) return; if (is_file(dirname(__DIR__) . '/storage/bug-ack.json')) try { bug_outbox(); } catch (Throwable $e) {} setv('rt_tick', (string)time()); x_schema(); try { x_anomaly(); } catch (Throwable $e) {}
    $tz = new DateTimeZone('Asia/Tehran'); $now = new DateTime('now', $tz); $hm = (int)$now->format('G') * 60 + (int)$now->format('i'); $dw = ((int)$now->format('w') + 1) % 7; $day = $now->format('Ymd'); $n = 0;
    foreach (rows("SELECT id, info FROM users WHERE info LIKE '%\"routes\"%' LIMIT 3000") as $u) { $I = json_decode((string)$u['info'], true) ?: []; if (!empty($I['remind_off'])) continue;
        $names = ['home' => 'خانه']; foreach ((array)($I['places'] ?? []) as $pl) $names[$pl['id']] = $pl['label'];
        foreach ((array)($I['routes'] ?? []) as $k => $r) { if (empty($r['tm']) || ($r['days'] && !in_array($dw, (array)$r['days'], true))) continue; [$h, $m] = array_map('intval', explode(':', $r['tm'])); $dd = $h * 60 + $m - $hm;
            if ($dd < 10 || $dd > 25 || hit('rt_' . $u['id'] . '_' . $k . '_' . $day, 86400) > 1) continue;
            push_queue([$u['id']], '🚗 ' . ($names[$r['to']] ?? 'مسیر همیشگی') . ' ساعت ' . fa_d($r['tm']), 'از ' . ($names[$r['from']] ?? 'خانه') . '؛ هم‌مسیرهای نزدیک را ببینید یا با یک تپ اعلام کنید.', 'route'); if (++$n >= 200) return; } } }
function lv_key(string $dir): string { return date('Ymd') . '-' . $dir; }
function lv_can(array $u, array $prof, string $dir): void { $Q = lv_quota($u, $prof); if ($Q['unlimited'] || $Q['left'] > 0 || $Q['credits'] > 0) return;
    if (row('SELECT 1 FROM lv_use WHERE user_id=? AND k=?', [$u['user_id'], lv_key($dir)])) return;
    NO('سفرهای مهمانِ این ماه تمام شد؛ با اشتراک نامحدود شوید یا بلیت سفر بگیرید.', 402, 'lvpay'); }
function lv_take(array $u, array $prof, string $dir): void { $Q = lv_quota($u, $prof); if ($Q['unlimited']) return;
    if (row('SELECT 1 FROM lv_use WHERE user_id=? AND k=?', [$u['user_id'], lv_key($dir)])) return;
    $paid = 0; if ($Q['left'] <= 0) { if (q('UPDATE users SET lv_credits=lv_credits-1 WHERE id=? AND lv_credits>0', [$u['user_id']])->rowCount() !== 1) NO('بلیت سفر کافی نیست.', 402, 'lvpay'); $paid = 1; }
    try { q('INSERT INTO lv_use(user_id,k,at,paid) VALUES(?,?,?,?)', [$u['user_id'], lv_key($dir), time(), $paid]); } catch (Throwable $e) { if ($paid) q('UPDATE users SET lv_credits=lv_credits+1 WHERE id=?', [$u['user_id']]); } }

/* ───────── shared helpers ───────── */
const FA_D = ['0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹'];
function fa_d($s): string { return strtr((string)$s, FA_D); }
function en_d(string $s): string { return strtr($s, ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9', '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']); }
function hhmm(int $ts): string { return fa_d(date('G:i', $ts)); }
function s1(string $s, int $n): string { return mb_substr(trim(preg_replace('/\s+/u', ' ', $s)), 0, $n); }
/** Words that turn a ride board into something else (dating, temporary marriage, adult content). Checked on digits-normalised, ZWNJ-free text. */
const X_BAN = ['صیغه', 'دوست دختر', 'دوست پسر', 'دوستیابی', 'دوست یابی', 'همخواب', 'ازدواج موقت', 'شبمانی', 'شب مانی', 'قرار عاشقانه', 'سکس', 'رابطه', 'دوستی خصوصی', 'بدون محرم', 'همخانه', 'هم خانه', 'ماساژ', 'وام', 'شرطبندی', 'شرط بندی', 'کازینو', 'فالوور'];
/** '' when the text is fine, else the reason. Links, handles and (unless allowed) phone numbers are refused: the board is for coordination inside Residim. */
function x_bad(string $t, bool $phoneOk = false): string {
    $n = mb_strtolower(str_replace("\u{200c}", '', en_d($t)));
    if (preg_match('#(https?://|www\.|\.(ir|com|net|org|me|io)\b|t\.me|wa\.me|eitaa|@[a-z0-9_]{3,})#i', $n)) return 'پیوند، آیدی یا نشانی سایت نگذارید؛ گفتگو داخل رسیدیم می‌ماند.';
    if (!$phoneOk && preg_match('/(\d[\s\-.]*){8,}/', $n)) return 'شماره‌ی تلفن را در متن ننویسید؛ پس از پاسخِ طرف مقابل، در گفتگو می‌توانید شماره بدهید.';
    foreach (X_BAN as $w) if (mb_strpos($n, $w) !== false) return 'این متن با قوانین رسیدیم جور نیست. رسیدیم فقط برای هم‌مسیری است.';
    return '';
}
/** The member's gender: declared once (users.g), else read from their mesiraks (the parent / adult member). */
function user_g(string $uid): string { $u = row('SELECT g FROM users WHERE id=?', [$uid]); if ($u && in_array($u['g'] ?? '', ['f', 'm'], true)) return $u['g'];
    foreach (rows('SELECT data FROM profiles WHERE user_id=? AND complete=1', [$uid]) as $p) { $g = (json_decode((string)$p['data'], true) ?: [])['pg'] ?? ''; if (in_array($g, ['f', 'm'], true)) return $g; } return ''; }
function set_g(string $uid, string $g): string { $cur = user_g($uid); if ($cur) return $cur; if (!in_array($g, ['f', 'm'], true)) return ''; q('UPDATE users SET g=? WHERE id=?', [$g, $uid]); return $g; }
function x_premium(string $uid): bool { return is_premium($uid); }
function dg(string $s): string { return preg_replace('/\D/', '', strtr($s, ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9','٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9'])); }
/* plates are kept partial on purpose: the three middle digits + the Iran code are enough to find the car on the day, not to identify its owner */
function plate_part(string $s): string { $d = dg($s); $n = strlen($d); if ($n >= 7) return substr($d, 2, 3) . ' ایران ' . substr($d, -2); if ($n === 5) return substr($d, 0, 3) . ' ایران ' . substr($d, 3); return substr($d, 0, 3); }
function need_phone(array $u): void { if (empty($u['phone'])) NO('برای این کار شماره‌ی موبایل را تأیید کنید.', 403, 'verify'); }
function g_word(string $g): string { return $g === 'm' ? 'آقایان' : 'بانوان'; }
function chash(string $ph): string { return substr(hash('sha256', $ph . '|' . getv('x_pepper', '')), 0, 24); }

/* ───────── 1) ads ───────── */
const AD_KINDS = ['intercity' => 'بین‌شهری', 'daily' => 'رفت‌وآمد روزانه', 'school' => 'مدرسه', 'uni' => 'دانشگاه', 'work' => 'محل کار', 'event' => 'مراسم و سفر کوتاه'];
const AD_SHARE = ['dong' => 'دنگی (تقسیم هزینه)', 'free' => 'رایگان', 'charity' => 'احسانی'];
const AD_DAYS = ['sa' => 'شنبه', 'su' => 'یکشنبه', 'mo' => 'دوشنبه', 'tu' => 'سه‌شنبه', 'we' => 'چهارشنبه', 'th' => 'پنجشنبه', 'fr' => 'جمعه'];
function ad_title(array $a): string { return ($a['role'] === 'driver' ? 'جای خالی' : 'دنبال هم‌مسیر') . ' از ' . $a['from_city'] . ($a['from_area'] ? '، ' . $a['from_area'] : '') . ' به ' . $a['to_city'] . ($a['to_area'] ? '، ' . $a['to_area'] : ''); }
function ad_when(array $a): string {
    if ((int)$a['at']) { $j = jdate_parts((int)$a['at']); return 'یک‌بار: ' . $j . ' ساعت ' . hhmm((int)$a['at']); }
    $d = array_filter(explode(',', (string)$a['days'])); return ($d ? implode('، ', array_map(fn($k) => AD_DAYS[$k] ?? '', $d)) : 'هر روز') . ($a['tm'] ? ' ساعت ' . fa_d($a['tm']) : ''); }
function jdate_parts(int $ts): string { [$gy, $gm, $gd] = array_map('intval', explode('-', date('Y-n-j', $ts))); [$y, $m, $d] = g2j($gy, $gm, $gd);
    $M = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']; return fa_d($d) . ' ' . $M[$m] . ' ' . fa_d($y); }
function ad_out(array $a, bool $full = false): array {
    $o = ['no' => (int)$a['no'], 'kind' => $a['kind'], 'kind_t' => AD_KINDS[$a['kind']] ?? '', 'role' => $a['role'], 'g' => $a['g'], 'g_t' => 'فقط ' . g_word($a['g']), 'from_city' => $a['from_city'], 'from_area' => $a['from_area'], 'to_city' => $a['to_city'], 'to_area' => $a['to_area'],
        'title' => $a['title'] ?: ad_title($a), 'when' => ad_when($a), 'at' => (int)$a['at'], 'days' => $a['days'], 'tm' => $a['tm'], 'seats' => (int)$a['seats'], 'share' => $a['share'], 'share_t' => AD_SHARE[$a['share']] ?? '', 'pin' => (int)$a['pin_until'] > time(),
        'created' => (int)$a['created'], 'bumped' => (int)$a['bumped'], 'status' => $a['status'], 'audience' => $a['audience']] + ($a['audience'] === 'org' && ($op = row('SELECT id, name FROM places WHERE id=?', [substr((string)$a['contacts'], 4)])) ? ['org' => ['name' => $op['name']]] : []);
    if ($full) $o['body'] = (string)$a['body'];
    else $o['snip'] = mb_substr((string)$a['body'], 0, 140);
    return $o; }
/** Live public ads, pinned first then freshest. Filters are exact on kind/gender and "contains" on cities. */
function ads_query(array $f, int $limit = 30, int $offset = 0): array {
    $w = ["status='live'", "audience='public'", 'expires>?']; $a = [time()]; if (getv('ads_scope', 'intercity') === 'intercity') $w[] = 'from_city<>to_city';
    if (!empty($f['k']) && isset(AD_KINDS[$f['k']])) { $w[] = 'kind=?'; $a[] = $f['k']; }
    if (!empty($f['g']) && in_array($f['g'], ['f', 'm'], true)) { $w[] = 'g=?'; $a[] = $f['g']; }
    if (!empty($f['r']) && in_array($f['r'], ['driver', 'rider'], true)) { $w[] = 'role=?'; $a[] = $f['r']; }
    foreach (['from' => 'from_city', 'to' => 'to_city'] as $k => $c) if (!empty($f[$k])) { $w[] = "$c LIKE ?"; $a[] = '%' . s1((string)$f[$k], 40) . '%'; }
    if (!empty($f['q'])) { $w[] = '(title LIKE ? OR body LIKE ? OR from_area LIKE ? OR to_area LIKE ?)'; $qq = '%' . s1((string)$f['q'], 40) . '%'; array_push($a, $qq, $qq, $qq, $qq); }
    $W = implode(' AND ', $w); $n = (int)q("SELECT COUNT(*) FROM ads WHERE $W", $a)->fetchColumn();
    $L = rows("SELECT * FROM ads WHERE $W ORDER BY CASE WHEN pin_until>? THEN 1 ELSE 0 END DESC, bumped DESC LIMIT " . max(1, min(60, $limit)) . ' OFFSET ' . max(0, $offset), array_merge($a, [time()]));
    return ['n' => $n, 'list' => array_map('ad_out', $L)]; }
function ad_by_no(int $no): ?array { return row('SELECT * FROM ads WHERE no=?', [$no]); }
/** Who may see an ad: anyone for public live ones; a «contacts» ad only its owner and signed-in members whose number was chosen. */
function ad_visible(array $a, ?array $u): bool {
    if ($u && $u['user_id'] === $a['user_id']) return true;
    if ($a['status'] !== 'live' || (int)$a['expires'] < time()) return false;
    if ($a['audience'] === 'org') { $oid = substr((string)$a['contacts'], 4); return $u && (bool)row("SELECT 1 FROM profiles WHERE user_id=? AND place_id=? AND complete=1", [$u['user_id'], $oid]); }
    if ($a['audience'] !== 'contacts') return true;
    return $u && !empty($u['phone']) && in_array(chash((string)$u['phone']), json_decode((string)$a['contacts'], true) ?: [], true); }
/** What a stranger may know before meeting: how long the account exists, a verified phone, and how earlier co-travellers rated them. */
function trust_of(string $uid): array { $u = row('SELECT created, phone FROM users WHERE id=?', [$uid]) ?: [];
    $good = (int)q('SELECT (SELECT COUNT(*) FROM ad_threads WHERE owner=? AND asker_rate=1) + (SELECT COUNT(*) FROM ad_threads WHERE asker=? AND owner_rate=1)', [$uid, $uid])->fetchColumn();
    $bad = (int)q('SELECT (SELECT COUNT(*) FROM ad_threads WHERE owner=? AND asker_rate=-1) + (SELECT COUNT(*) FROM ad_threads WHERE asker=? AND owner_rate=-1)', [$uid, $uid])->fetchColumn();
    $c = (int)($u['created'] ?? time()); return ['since' => $c, 'since_t' => jdate_parts($c), 'new' => $c > time() - 7 * 86400, 'verified' => !empty($u['phone']), 'good' => $good, 'bad' => $bad]; }
function ad_limit(string $uid): int { return x_premium($uid) ? 10 : 3; }

/* ───────── 2) «دارم می‌روم» ───────── */
const LEAVE_KINDS = ['work', 'uni'];
function leave_allowed(array $u, array $prof): bool { // a paid feature: own subscription, a sponsoring organisation, or a paid team; everything is open while paid_mode is off
    if (!flag('paid_mode') || x_premium($u['user_id'])) return true;
    $pl = row('SELECT plan_until FROM places WHERE id=?', [$prof['place_id']]); if ($pl && (int)$pl['plan_until'] > time()) return true;
    if ($prof['team_id'] && ($t = row('SELECT * FROM teams WHERE id=?', [$prof['team_id']]))) return in_array(team_plan($t, false)['state'], ['paid', 'school'], true);
    return false; }
/** Same way home: homes close together, or on a similar bearing from the workplace with the nearer one roughly on the way. */
function same_way(array $pl, array $a, array $b): bool {
    if (!isset($a['lat'], $b['lat'])) return false; $P = [(float)$pl['lat'], (float)$pl['lng']];
    $da = hav($P[0], $P[1], (float)$a['lat'], (float)$a['lng']); $db = hav($P[0], $P[1], (float)$b['lat'], (float)$b['lng']); $ab = hav((float)$a['lat'], (float)$a['lng'], (float)$b['lat'], (float)$b['lng']);
    if ($ab <= max(2500, .3 * min($da, $db))) return true;
    $br = fn($d) => atan2(((float)$d['lng'] - $P[1]) * cos(deg2rad($P[0])), (float)$d['lat'] - $P[0]);
    $diff = abs(fmod($br($a) - $br($b) + 3 * M_PI, 2 * M_PI) - M_PI);
    return $diff <= deg2rad(30) && $ab <= .65 * max($da, $db); }
function tg_members(string $gid): array { return rows('SELECT m.*, p.data, p.place_id FROM tg_members m JOIN profiles p ON p.id=m.profile_id WHERE m.group_id=? ORDER BY m.created', [$gid]); }
/** v57 warm, respectful address: حاج‌آقا/حاج‌خانم for clerics, دکتر for academics and medics, else the person's own title. Never invents a degree. */
/** v57 tiny profile photo: icon-size only (≤96 px, ≤ ~3 KB). The browser shrinks it first; the server re-shrinks with GD if needed. */
function av_clean(string $u): string { if ($u === '' || !preg_match('#^data:image/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$#', $u, $m) || strlen($m[2]) > 280000) return '';
    $b = base64_decode($m[2], true); if ($b === false) return ''; $sz = @getimagesizefromstring($b); if (!$sz || $sz[0] < 8 || $sz[1] < 8) return '';
    if (strlen($m[2]) <= 4400 && $sz[0] <= 96 && $sz[1] <= 96 && $m[1] !== 'png') return $u;
    if (!function_exists('imagecreatefromstring')) return ''; $im = @imagecreatefromstring($b); if (!$im) return ''; $s = min($sz[0], $sz[1]);
    $t = imagecreatetruecolor(64, 64); imagecopyresampled($t, $im, 0, 0, (int)(($sz[0] - $s) / 2), (int)(($sz[1] - $s) / 2), 64, 64, $s, $s);
    foreach ([70, 55, 40, 28] as $qq) { ob_start(); imagejpeg($t, null, $qq); $o = base64_encode((string)ob_get_clean()); if (strlen($o) <= 4400) return 'data:image/jpeg;base64,' . $o; } return ''; }
function av_of(?string $uid): string { static $C = []; if (!$uid) return ''; if (!isset($C[$uid])) { $I = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$uid])['info'] ?? ''), true) ?: []; $C[$uid] = (string)($I['av'] ?? ''); } return $C[$uid]; }
/** is this user one of MY chosen co-travellers (from my phone contacts)? */
function pref_has(string $myPid, string $uid): bool { static $P = [], $U = []; if ($uid === '') return false;
    if (!isset($P[$myPid])) { $o = row('SELECT u.info FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.id=?', [$myPid]); $I = json_decode((string)($o['info'] ?? ''), true) ?: []; $P[$myPid] = array_flip(array_column((array)($I['pref'] ?? []), 'phone')); }
    if (!$P[$myPid]) return false; $U[$uid] ??= (string)(row('SELECT phone FROM users WHERE id=?', [$uid])['phone'] ?? ''); return isset($P[$myPid][$U[$uid]]); }
function hon(array $d, string $fb = 'هم‌مسیر'): string { $f = trim((string)($d['family'] ?? '')); if ($f === '') return $fb; $j = (string)($d['job'] ?? '');
    $t = $j === 'cleric' ? (($d['pg'] ?? 'f') === 'm' ? 'حاج‌آقا' : 'حاج‌خانم') : (in_array($j, ['academic', 'medic'], true) ? 'دکتر' : (string)($d['title'] ?? '')); return trim("$t $f"); }
function tg_out(array $g, string $me): array {
    $M = tg_members($g['id']); $car = 0; $ride = 0; $out = [];
    foreach ($M as $m) { $d = json_decode((string)$m['data'], true) ?: []; if ($m['role'] === 'car') $car += (int)$m['seats']; else $ride += max(1, (int)$m['seats']);
        $pl3 = ''; if ($m['role'] === 'car' && $g['kind'] === 'leave') { $UI = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$m['user_id']])['info'] ?? ''), true) ?: []; if (!empty($UI['p3'])) $pl3 = fa_d((string)$UI['p3']) . (!empty($UI['pir']) ? ' ایران ' . fa_d((string)$UI['pir']) : ''); }
        $eta = 0; if ($m['role'] === 'car' && $g['kind'] === 'leave' && ($g['dir'] ?? '') === 'work' && $m['profile_id'] !== $me) { static $VD = []; $VD[$me] ??= pdata(row('SELECT data FROM profiles WHERE id=?', [$me]) ?: ['data' => '{}']); $gp = home_gap($VD[$me], json_decode((string)$m['data'], true) ?: []); if ($gp !== null) $eta = 2 + (int)ceil($gp / 416); }
        $out[] = ['pid' => $m['profile_id'], 'me' => $m['profile_id'] === $me, 'plate' => $pl3, 'eta' => $eta, 'av' => av_of($m['user_id']), 'pref' => $m['profile_id'] !== $me && pref_has($me, (string)$m['user_id']), 'name' => $g['kind'] === 'ordu' ? 'خانواده ' . ($d['family'] ?? '') : hon($d, 'همکار'), 'role' => $m['role'], 'seats' => (int)$m['seats'], 'hood' => (string)($d['hood'] ?? ''), 'at_site' => (int)$m['at_site'], 'owner' => $m['profile_id'] === $g['owner']]; }
    $last = (int)q('SELECT COALESCE(MAX(created),0) FROM msgs WHERE team_id=?', [$g['id']])->fetchColumn();
    return ['id' => $g['id'], 'kind' => $g['kind'], 'dir' => $g['dir'] ?? 'home', 'title' => $g['title'], 'at' => (int)$g['at'], 'at_t' => hhmm((int)$g['at']), 'until' => (int)$g['until'], 'status' => $g['status'], 'members' => $out, 'car_seats' => $car, 'riders' => $ride, 'free' => $car - $ride, 'last_msg' => $last, 'mine' => in_array($me, array_column($M, 'profile_id'), true)]; }
function tg_member(string $gid, string $pid): ?array { return row('SELECT * FROM tg_members WHERE group_id=? AND profile_id=?', [$gid, $pid]); }

/* ───────── 3) school trips (اردو) ───────── */
/** Two families may share a car only if their adults are all one gender and, across families, girls over 8 and boys over 12 never mix; in a kids-only trip a man drives no other family's girl over 8. */
function ordu_car_ok(array $cars, array $fam, string $who): bool {
    $all = array_merge($cars, [$fam]); if (count($all) < 2) return true;
    $am = array_sum(array_column($all, 'am')); $af = array_sum(array_column($all, 'af'));
    if ($who === 'family' && $am > 0 && $af > 0) return false;
    foreach ($all as $i => $x) foreach ($all as $j => $y) { if ($j <= $i) continue; if (!gender_age_ok(array_merge($x['kids'], $y['kids']))) return false; }
    if ($who === 'kids') { $drv = $all[0]; if ($drv['am'] > 0) foreach (array_slice($all, 1) as $o) foreach ($o['kids'] as $k) if ($k['g'] === 'f' && ($k['age'] === null || $k['age'] >= 9)) return false; }
    return true; }
function o_name(string $t): string { return mb_strpos($t, 'اردو') === 0 ? '«' . $t . '»' : 'اردوی «' . $t . '»'; }
function ordu_stats(array $o): array {
    $R = rows('SELECT * FROM ordu_rsvp WHERE ordu_id=?', [$o['id']]); $s = ['answered' => count($R), 'going' => 0, 'kids' => 0, 'adults' => 0, 'drivers' => 0, 'seats' => 0, 'need' => 0, 'self' => 0];
    foreach ($R as $r) { if (!(int)$r['go']) continue; $s['going']++; $s['kids'] += (int)$r['kids']; $s['adults'] += (int)$r['adults_m'] + (int)$r['adults_f'];
        if ($r['role'] === 'car') { $s['drivers']++; $s['seats'] += (int)$r['seats']; } elseif ($r['role'] === 'ride') $s['need'] += (int)$r['kids'] + ($o['who'] === 'family' ? (int)$r['adults_m'] + (int)$r['adults_f'] : 0); else $s['self']++; }
    $s['families'] = (int)q('SELECT COUNT(*) FROM profiles WHERE place_id=? AND complete=1', [$o['place_id']])->fetchColumn(); return $s; }
function ordu_out(array $o, bool $school = false): array {
    $x = ['id' => $o['id'], 'title' => $o['title'], 'dest' => $o['dest'], 'at' => (int)$o['at'], 'date_t' => jdate_parts((int)$o['at']), 'time_t' => hhmm((int)$o['at']), 'back' => fa_d((string)$o['back']), 'meet' => $o['meet'], 'who' => $o['who'], 'cost' => (int)$o['cost'], 'note' => $o['note'], 'deadline' => (int)$o['deadline'], 'status' => $o['status'], 'planned' => (int)$o['planned']];
    if ($school) { $x['stats'] = ordu_stats($o); $x['plan'] = json_decode((string)$o['plan'], true) ?: null; } return $x; }
/** Greedy allocation: the biggest families first, each into the nearest car (by home) with room and allowed company. */
function ordu_allocate(array $o): array {
    $pl = row('SELECT * FROM places WHERE id=?', [$o['place_id']]); $F = [];
    foreach (rows("SELECT r.*, p.data, p.id pid FROM ordu_rsvp r JOIN profiles p ON p.id=r.profile_id WHERE r.ordu_id=? AND r.go=1 AND r.role IN ('car','ride')", [$o['id']]) as $r) {
        $d = json_decode((string)$r['data'], true) ?: []; $kids = array_slice(riders_of(['id' => $r['pid'], 'data' => $r['data']]), 0, max(0, (int)$r['kids']));
        $F[] = ['pid' => $r['pid'], 'role' => $r['role'], 'seats' => (int)$r['seats'], 'need' => (int)$r['kids'] + ($o['who'] === 'family' ? (int)$r['adults_m'] + (int)$r['adults_f'] : 0), 'am' => (int)$r['adults_m'], 'af' => (int)$r['adults_f'], 'kids' => $kids, 'lat' => $d['lat'] ?? null, 'lng' => $d['lng'] ?? null]; }
    $cars = []; foreach ($F as $f) if ($f['role'] === 'car' && $f['seats'] > 0) $cars[] = ['drv' => $f, 'fam' => [$f], 'left' => $f['seats']];
    $R = array_values(array_filter($F, fn($f) => $f['role'] === 'ride' && $f['need'] > 0)); usort($R, fn($a, $b) => $b['need'] <=> $a['need']); $bus = [];
    foreach ($R as $f) { $best = null; $bd = 1e12;
        foreach ($cars as $i => $c) { if ($c['left'] < $f['need'] || !ordu_car_ok($c['fam'], $f, $o['who'])) continue;
            $dd = isset($f['lat'], $c['drv']['lat']) ? hav((float)$f['lat'], (float)$f['lng'], (float)$c['drv']['lat'], (float)$c['drv']['lng']) : 5e5; if ($dd < $bd) { $bd = $dd; $best = $i; } }
        if ($best === null) $bus[] = $f; else { $cars[$best]['fam'][] = $f; $cars[$best]['left'] -= $f['need']; } }
    return ['cars' => $cars, 'bus' => $bus, 'place' => $pl]; }

/* ───────── router ───────── */
function x_route(string $a, array $in): void {
    x_schema();
    switch ($a) {
    /* ── ads ── */
    case 'ads_list': { if (!flag('ads_on')) NO('بخش آگهی‌ها فعلاً بسته است.', 403);
        $r = ads_query($in, 30, max(0, (int)($in['page'] ?? 0)) * 30); YES($r + ['kinds' => AD_KINDS]); }
    case 'ad_get': { $u = auth(false); $ad = ad_by_no((int)($in['no'] ?? 0)); if (!$ad || !ad_visible($ad, $u)) NO('این آگهی نیست یا بسته شده است.', 404);
        if (hit('adv_' . $ad['id'] . '_' . ip_tag(), 21600) === 1) q('UPDATE ads SET views=views+1 WHERE id=?', [$ad['id']]);
        $me = $u ? $u['user_id'] : null; $mine = $me === $ad['user_id']; $g = $me ? user_g($me) : '';
        $th = $me && !$mine ? row('SELECT id FROM ad_threads WHERE ad_id=? AND asker=?', [$ad['id'], $me]) : null;
        YES(['trust' => trust_of($ad['user_id']), 'ad' => ad_out($ad, true) + ($mine ? ['views' => (int)$ad['views'], 'msgs' => (int)$ad['msgs'], 'expires' => (int)$ad['expires']] : []),
            'viewer' => ['in' => (bool)$u, 'phone' => (bool)($u['phone'] ?? false), 'mine' => $mine, 'g' => $g, 'can_msg' => $u && !$mine && ($g === '' || $g === $ad['g']), 'thread' => $th['id'] ?? null, 'premium' => $me ? x_premium($me) : false]]); }
    case 'ad_save': { if (!flag('ads_on')) NO('بخش آگهی‌ها فعلاً بسته است.', 403); $u = auth(); need_phone($u); $me = $u['user_id'];
        $f = fn($k, $n) => s1((string)($in[$k] ?? ''), $n);
        $kind = $f('kind', 12); $role = $f('role', 6); $share = $f('share', 8); $aud = in_array($f('audience', 8), ['contacts', 'org'], true) ? $f('audience', 8) : 'public';
        if (!isset(AD_KINDS[$kind])) NO('نوع آگهی را انتخاب کنید.'); if (!in_array($role, ['driver', 'rider'], true)) NO('بگویید ماشین دارید یا هم‌مسیر می‌خواهید.'); if (!isset(AD_SHARE[$share])) $share = 'dong';
        if (empty($in['adult'])) NO('آگهی فقط برای بزرگسالان (۱۸ سال به بالا) است؛ تأیید کنید.');
        if (empty($in['rules'])) NO('قوانین آگهی را بخوانید و بپذیرید.');
        $g = set_g($me, $f('g', 1)); if (!$g) NO('بگویید آقا هستید یا خانم؛ هم‌مسیری فقط میان هم‌جنس‌هاست.');
        if ($f('g', 1) && $f('g', 1) !== $g) NO('جنسیت این حساب قبلاً ثبت شده و تغییر نمی‌کند؛ اگر اشتباه است به پشتیبانی بگویید.');
        $fc = $f('from_city', 40); $tc = $f('to_city', 40);
        $orgp = null; if ($aud === 'org') { foreach (rows("SELECT p.place_id, pl.plan_tier FROM profiles p JOIN places pl ON pl.id=p.place_id WHERE p.user_id=? AND p.complete=1 AND p.kind IN ('work','uni')", [$me]) as $r) if (!empty($r['plan_tier']) || flag('test_tools')) { $orgp = $r['place_id']; break; }
            if (!$orgp) NO('آگهی سازمانی برای سازمان‌هایی است که «رسیدیم سازمان» دارند؛ از مدیرتان بخواهید فعالش کند.'); }
        if (!$orgp && getv('ads_scope', 'intercity') === 'intercity' && pn_norm($fc) === pn_norm($tc)) NO('مبدأ و مقصد یک شهر است. آگهی فعلاً فقط برای سفر بین دو شهر است (مثل تهران ← کرج)؛ برای داخل شهر «سرویس ثابت» و «همین حالا» در اپ هست، جایی که فقط همکاران و هم‌محله‌ها شما را می‌بینند.'); $fa = $f('from_area', 60); $ta = $f('to_area', 60); $body = s1((string)($in['body'] ?? ''), 600);
        foreach ([$fc, $tc] as $c) if (mb_strlen($c) < 2 || preg_match('/[0-9۰-۹<>]/u', $c)) NO('نام شهرِ مبدأ و مقصد را درست بنویسید.');
        foreach ([$fa, $ta] as $c) if (preg_match('/(پلاک|واحد|طبقه|کوچه\s*[0-9۰-۹])|[0-9۰-۹]{3,}|[<>]/u', $c)) NO('نشانی دقیق ننویسید؛ فقط محله یا نقطه‌ی شناخته‌شده (مثل «میدان ونک»).');
        foreach ([$fa, $ta, $body] as $c) if ($e = x_bad($c)) NO($e);
        $at = (int)($in['at'] ?? 0); $days = implode(',', array_values(array_intersect(array_keys(AD_DAYS), (array)($in['days'] ?? [])))); $tm = preg_match('/^\d{1,2}:\d{2}$/', en_d($f('tm', 5))) ? en_d($f('tm', 5)) : '';
        if ($at && ($at < time() - 3600 || $at > time() + 120 * 86400)) NO('تاریخ سفر باید از امروز تا چهار ماه آینده باشد.'); if (!$at && !$days && !$tm) NO('زمان سفر را بگویید: یک تاریخ، یا روزها و ساعت.');
        $seats = $role === 'driver' ? max(1, min(6, (int)($in['seats'] ?? 1))) : max(1, min(4, (int)($in['seats'] ?? 1)));
        $C = []; if ($aud === 'org') $C = 'org:' . $orgp; elseif ($aud === 'contacts') { foreach (array_slice((array)($in['contacts'] ?? []), 0, 300) as $ph) if ($n = phone_norm((string)$ph)) $C[] = chash($n); $C = array_values(array_unique($C)); if (!$C) NO('دست‌کم یک مخاطب انتخاب کنید یا آگهی را عمومی کنید.'); }
        $old = !empty($in['no']) ? ad_by_no((int)$in['no']) : null; if ($old && $old['user_id'] !== $me) NO('این آگهی مال شما نیست.', 403);
        if (!$old) { if ((int)q("SELECT COUNT(*) FROM ads WHERE user_id=? AND status IN ('live','pending','review') AND expires>?", [$me, time()])->fetchColumn() >= ad_limit($me)) NO(x_premium($me) ? 'حداکثر ۱۰ آگهی فعال.' : 'حداکثر ۳ آگهی فعال؛ آگهی قدیمی را ببندید یا با اشتراک تا ۱۰ آگهی داشته باشید.', 429);
            if (hit('adpost_' . $me, 86400) > 5) NO('امروز آگهی زیادی ثبت کردید؛ فردا دوباره.', 429); }
        $row = ['kind' => $kind, 'role' => $role, 'g' => $g, 'from_city' => $fc, 'from_area' => $fa, 'to_city' => $tc, 'to_area' => $ta, 'at' => $at, 'days' => $days, 'tm' => $tm, 'seats' => $seats, 'share' => $share];
        $title = ad_title($row); $exp = $at ? $at + 86400 : time() + (x_premium($me) ? 60 : 30) * 86400; $st = flag('ads_review') ? 'pending' : 'live';
        if ($old) { q('UPDATE ads SET kind=?, role=?, from_city=?, from_area=?, to_city=?, to_area=?, title=?, body=?, at=?, days=?, tm=?, seats=?, share=?, audience=?, contacts=?, status=?, updated=?, expires=? WHERE id=?',
            [$kind, $role, $fc, $fa, $tc, $ta, $title, $body, $at, $days, $tm, $seats, $share, $aud, is_string($C) ? $C : json_encode($C), in_array($old['status'], ['hidden', 'removed'], true) ? $old['status'] : $st, time(), $exp, $old['id']]); YES(['no' => (int)$old['no']]); }
        for ($i = 0; $i < 4; $i++) { $no = 1001 + (int)q('SELECT COALESCE(MAX(no),1000) FROM ads')->fetchColumn() - 1000 + $i;
            try { q('INSERT INTO ads(id,no,user_id,kind,role,g,from_city,from_area,to_city,to_area,title,body,at,days,tm,seats,share,audience,contacts,status,pin_until,views,msgs,reports,bumped,created,updated,expires) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0,0,?,?,?,?)',
                [uid(), $no, $me, $kind, $role, $g, $fc, $fa, $tc, $ta, $title, $body, $at, $days, $tm, $seats, $share, $aud, is_string($C) ? $C : json_encode($C), $st, time(), time(), time(), $exp]); break; } catch (Throwable $e) { if ($i === 3) throw $e; } }
        ev_log('ad', '📌 آگهی تازه ' . fa_d($no) . ': ' . $title, []);
        if ($st === 'live' && $aud === 'public') { $sent = 0; foreach (rows('SELECT * FROM ad_alerts WHERE (kind=? OR kind=?) AND user_id<>? LIMIT 400', [$kind, '', $me]) as $al) {
            if ($sent >= 50) break; if (($al['from_city'] && mb_strpos($fc, $al['from_city']) === false) || ($al['to_city'] && mb_strpos($tc, $al['to_city']) === false)) continue;
            if (user_g($al['user_id']) !== $g || !x_premium($al['user_id'])) continue; push_queue([$al['user_id']], 'آگهی هم‌مسیری تازه', $title, 'near'); $sent++; } }
        if ($aud === 'contacts') { $hs = $C; foreach (rows('SELECT id, phone FROM users WHERE phone IS NOT NULL AND fake=0 AND id<>? LIMIT 5000', [$me]) as $x) if (in_array(chash((string)$x['phone']), $hs, true) && user_g($x['id']) === $g) push_queue([$x['id']], 'یک آشنا آگهی هم‌مسیری گذاشت', $title, 'near'); }
        YES(['no' => $no, 'status' => $st]); }
    case 'ad_mine': { $u = auth(); $L = rows('SELECT * FROM ads WHERE user_id=? ORDER BY created DESC LIMIT 40', [$u['user_id']]);
        YES(['list' => array_map(fn($x) => ad_out($x) + ['views' => (int)$x['views'], 'msgs' => (int)$x['msgs'], 'expires' => (int)$x['expires'], 'threads' => (int)q('SELECT COUNT(*) FROM ad_threads WHERE ad_id=?', [$x['id']])->fetchColumn()], $L), 'limit' => ad_limit($u['user_id']), 'premium' => x_premium($u['user_id']), 'g' => user_g($u['user_id'])]); }
    case 'ad_close': case 'ad_renew': { $u = auth(); $ad = ad_by_no((int)($in['no'] ?? 0)); if (!$ad || $ad['user_id'] !== $u['user_id']) NO('آگهی پیدا نشد.', 404);
        if ($a === 'ad_close') { q("UPDATE ads SET status='closed', updated=? WHERE id=?", [time(), $ad['id']]); YES(); }
        if (!in_array($ad['status'], ['live', 'closed'], true)) NO('این آگهی در حال بررسی است.');
        $gap = x_premium($u['user_id']) ? 86400 : 7 * 86400; if ((int)$ad['bumped'] > time() - $gap) NO(x_premium($u['user_id']) ? 'هر آگهی روزی یک بار بالا می‌رود.' : 'هر آگهی هفته‌ای یک بار بالا می‌رود؛ با اشتراک، هر روز.', 429);
        $exp = (int)$ad['at'] ? max((int)$ad['expires'], (int)$ad['at'] + 86400) : time() + (x_premium($u['user_id']) ? 60 : 30) * 86400;
        if ((int)$ad['at'] && (int)$ad['at'] < time()) NO('تاریخ این سفر گذشته؛ آگهی تازه بگذارید.');
        q("UPDATE ads SET status='live', bumped=?, expires=?, updated=? WHERE id=?", [time(), $exp, time(), $ad['id']]); YES(); }
    case 'ad_msg': { $u = auth(); need_phone($u); $me = $u['user_id']; $t = s1((string)($in['text'] ?? ''), 500); if (mb_strlen($t) < 2) NO('پیام خالی است.');
        $th = !empty($in['thread']) ? row('SELECT * FROM ad_threads WHERE id=?', [(string)$in['thread']]) : null;
        if ($th) { if (!in_array($me, [$th['owner'], $th['asker']], true)) NO('این گفتگو مال شما نیست.', 403); $ad = row('SELECT * FROM ads WHERE id=?', [$th['ad_id']]); }
        else { $ad = ad_by_no((int)($in['no'] ?? 0)); if (!$ad || !ad_visible($ad, $u) || $ad['user_id'] === $me) NO('به این آگهی نمی‌شود پیام داد.', 404);
            $g = set_g($me, s1((string)($in['g'] ?? ''), 1)); if (!$g) NO('بگویید آقا هستید یا خانم؛ پیام فقط میان هم‌جنس‌ها رد و بدل می‌شود.', 400, 'need_g');
            if ($g !== $ad['g']) NO('این آگهی فقط برای ' . g_word($ad['g']) . ' است.', 403);
            $th = row('SELECT * FROM ad_threads WHERE ad_id=? AND asker=?', [$ad['id'], $me]);
            if (!$th) { if (hit('adth_' . $me, 86400) > (x_premium($me) ? 30 : 8)) NO('امروز با آگهی‌های زیادی گفتگو باز کردید؛ فردا دوباره.', 429);
                $id = uid(); q('INSERT INTO ad_threads(id,ad_id,asker,owner,last,owner_rd,asker_rd,owner_replied,blocked,created) VALUES(?,?,?,?,?,0,0,0,0,?)', [$id, $ad['id'], $me, $ad['user_id'], time(), time()]); $th = row('SELECT * FROM ad_threads WHERE id=?', [$id]); } }
        if (!$ad) NO('آگهی پیدا نشد.', 404); if ((int)$th['blocked']) NO('این گفتگو بسته شده است.', 403);
        if (hit('adm_' . $me, 86400) > 80) NO('پیام‌های امروز زیاد شد.', 429); $last = (int)q('SELECT COALESCE(MAX(created),0) FROM ad_msgs WHERE from_user=?', [$me])->fetchColumn(); if (time() - $last < 3) NO('کمی آرام‌تر 🙂', 429);
        if ($e = x_bad($t, (int)$th['owner_replied'] === 1)) NO($e);
        q('INSERT INTO ad_msgs(id,thread_id,from_user,text,created) VALUES(?,?,?,?,?)', [uid(), $th['id'], $me, $t, time()]);
        $isOwner = $me === $th['owner']; $to = $isOwner ? $th['asker'] : $th['owner'];
        q('UPDATE ad_threads SET last=?, ' . ($isOwner ? 'owner_rd=?, owner_replied=1' : 'asker_rd=?') . ' WHERE id=?', [time(), time(), $th['id']]);
        if (!$isOwner) q('UPDATE ads SET msgs=msgs+1 WHERE id=?', [$ad['id']]);
        push_queue([$to], 'پیام تازه برای آگهی ' . fa_d($ad['no']), mb_substr($t, 0, 90), 'invite');
        $first = !$isOwner && (int)q('SELECT COUNT(*) FROM ad_msgs WHERE thread_id=?', [$th['id']])->fetchColumn() === 1;
        if ($first && x_premium($to) && flag('sms_direct') && sms_ready() && hit('adsms_' . $to, 3600) <= 3) { $tp = row('SELECT phone FROM users WHERE id=? AND fake=0', [$to]); if ($tp && $tp['phone']) try { kave_send($tp['phone'], 'برای آگهی ' . fa_d($ad['no']) . ' شما در رسیدیم پیام آمد.' . "\nresidim.ir/ads/" . $ad['no'], 'ad_msg', $me); } catch (Throwable $e) {} }
        YES(['thread' => $th['id']]); }
    case 'ad_threads': { $u = auth(); $me = $u['user_id']; $o = [];
        foreach (rows('SELECT t.*, a.no, a.title, a.status ast FROM ad_threads t JOIN ads a ON a.id=t.ad_id WHERE t.owner=? OR t.asker=? ORDER BY t.last DESC LIMIT 60', [$me, $me]) as $t) {
            $lm = row('SELECT text, from_user FROM ad_msgs WHERE thread_id=? ORDER BY created DESC LIMIT 1', [$t['id']]); $own = $t['owner'] === $me;
            $o[] = ['id' => $t['id'], 'no' => (int)$t['no'], 'title' => $t['title'], 'own' => $own, 'last' => (int)$t['last'], 'unread' => (int)$t['last'] > (int)($own ? $t['owner_rd'] : $t['asker_rd']) && $lm && $lm['from_user'] !== $me, 'text' => $lm ? mb_substr($lm['text'], 0, 80) : '', 'blocked' => (int)$t['blocked'], 'ad_live' => $t['ast'] === 'live']; }
        YES(['list' => $o]); }
    case 'ad_thread': { $u = auth(); $me = $u['user_id']; $t = row('SELECT * FROM ad_threads WHERE id=?', [(string)($in['id'] ?? '')]); if (!$t || !in_array($me, [$t['owner'], $t['asker']], true)) NO('گفتگو پیدا نشد.', 404);
        $own = $t['owner'] === $me; q('UPDATE ad_threads SET ' . ($own ? 'owner_rd' : 'asker_rd') . '=? WHERE id=?', [time(), $t['id']]); $ad = row('SELECT * FROM ads WHERE id=?', [$t['ad_id']]);
        $peer = $own ? $t['asker'] : $t['owner']; $pp = row('SELECT phone FROM users WHERE id=?', [$peer]);
        YES(['ad' => $ad ? ad_out($ad) : null, 'own' => $own, 'blocked' => (int)$t['blocked'], 'phone_ok' => (int)$t['owner_replied'] === 1, 'trip' => json_decode((string)($t['trip'] ?? ''), true) ?: null,
            'peer' => trust_of($peer) + ['phone' => (int)$t['owner_replied'] === 1 ? pmask((string)($pp['phone'] ?? '')) : ''], 'my_rate' => (int)($own ? $t['owner_rate'] : $t['asker_rate']), 'can_rate' => (int)$t['owner_replied'] === 1 && (!$ad || !(int)$ad['at'] || (int)$ad['at'] < time() + 3600), 'list' => array_map(fn($m) => ['text' => $m['text'], 'at' => (int)$m['created'], 'mine' => $m['from_user'] === $me], rows('SELECT * FROM ad_msgs WHERE thread_id=? ORDER BY created LIMIT 300', [$t['id']]))]); }
    case 'ad_trip': { $u = auth(); $me = $u['user_id']; $t = row('SELECT * FROM ad_threads WHERE id=?', [(string)($in['id'] ?? '')]); if (!$t || !in_array($me, [$t['owner'], $t['asker']], true)) NO('گفتگو پیدا نشد.', 404);
        if (!(int)$t['owner_replied']) NO('کارت سفر بعد از پاسخِ آگهی‌دهنده باز می‌شود.'); $T = json_decode((string)($t['trip'] ?? ''), true) ?: [];
        foreach (['car' => 40, 'color' => 20, 'plate' => 20, 'meet' => 80, 'time' => 20] as $k => $n) if (isset($in[$k])) { $v = $k === 'plate' ? plate_part((string)$in[$k]) : s1((string)$in[$k], $n); if ($e = x_bad($v, true)) NO($e); $T[$k] = $v; }
        $T['by'] = $me === $t['owner'] ? 'owner' : 'asker'; $T['at'] = time(); q('UPDATE ad_threads SET trip=? WHERE id=?', [json_encode($T, JSON_UNESCAPED_UNICODE), $t['id']]);
        q('INSERT INTO ad_msgs(id,thread_id,from_user,text,created) VALUES(?,?,?,?,?)', [uid(), $t['id'], $me, '🧾 کارت سفر به‌روز شد.', time()]); YES(['trip' => $T]); }
    case 'ad_rate': { $u = auth(); $me = $u['user_id']; $t = row('SELECT * FROM ad_threads WHERE id=?', [(string)($in['id'] ?? '')]); if (!$t || !in_array($me, [$t['owner'], $t['asker']], true)) NO('گفتگو پیدا نشد.', 404);
        $own = $me === $t['owner']; if ((int)($own ? $t['owner_rate'] : $t['asker_rate'])) NO('نظرتان را قبلاً ثبت کرده‌اید.'); if (!(int)$t['owner_replied']) NO('هنوز گفتگویی شکل نگرفته است.');
        $v = (int)($in['v'] ?? 0) > 0 ? 1 : -1; q('UPDATE ad_threads SET ' . ($own ? 'owner_rate' : 'asker_rate') . '=? WHERE id=?', [$v, $t['id']]);
        $peer = $own ? $t['asker'] : $t['owner'];
        if ($v < 0) { $why = s1((string)($in['why'] ?? ''), 300); ev_log('report', '⚠️ همسفرِ ناراضی (' . pmask((string)(row('SELECT phone FROM users WHERE id=?', [$peer])['phone'] ?? '')) . '): ' . mb_substr($why, 0, 80), []);
            if (trust_of($peer)['bad'] >= 2) q("UPDATE ads SET status='review' WHERE user_id=? AND status='live'", [$peer]); }
        YES(); }
    case 'ad_block': { $u = auth(); $t = row('SELECT * FROM ad_threads WHERE id=?', [(string)($in['id'] ?? '')]); if (!$t || !in_array($u['user_id'], [$t['owner'], $t['asker']], true)) NO('گفتگو پیدا نشد.', 404);
        q('UPDATE ad_threads SET blocked=? WHERE id=?', [!empty($in['v']) ? 1 : 0, $t['id']]); YES(); }
    case 'ad_report': { $u = auth(); need_phone($u); $ad = ad_by_no((int)($in['no'] ?? 0)); if (!$ad) NO('آگهی پیدا نشد.', 404); if (hit('adrep_' . $u['user_id'], 86400) > 10) NO('گزارش‌های امروز زیاد شد.', 429);
        $why = s1((string)($in['reason'] ?? 'other'), 20); $txt = s1((string)($in['text'] ?? ''), 300);
        try { q('INSERT INTO ad_reports(ad_id,user_id,reason,text,created) VALUES(?,?,?,?,?)', [$ad['id'], $u['user_id'], $why, $txt, time()]); } catch (Throwable $e) { YES(['dup' => true]); }
        $n = (int)q('SELECT COUNT(*) FROM ad_reports WHERE ad_id=?', [$ad['id']])->fetchColumn(); q('UPDATE ads SET reports=? WHERE id=?', [$n, $ad['id']]);
        if ($n >= 3 && $ad['status'] === 'live') q("UPDATE ads SET status='review' WHERE id=?", [$ad['id']]);
        ev_log('report', '⚠️ گزارش آگهی ' . fa_d($ad['no']) . " ($why): " . mb_substr($txt, 0, 60), []); YES(); }
    case 'ad_alerts': { $u = auth(); $me = $u['user_id'];
        if (!empty($in['del'])) q('DELETE FROM ad_alerts WHERE id=? AND user_id=?', [(string)$in['del'], $me]);
        if (!empty($in['add'])) { if (!x_premium($me)) NO('هشدار آگهی تازه، ویژه‌ی اشتراک است.', 402); if ((int)q('SELECT COUNT(*) FROM ad_alerts WHERE user_id=?', [$me])->fetchColumn() >= 5) NO('حداکثر ۵ هشدار.');
            $k = s1((string)($in['kind'] ?? ''), 12); q('INSERT INTO ad_alerts(id,user_id,kind,from_city,to_city,created) VALUES(?,?,?,?,?,?)', [uid(), $me, isset(AD_KINDS[$k]) ? $k : '', s1((string)($in['from'] ?? ''), 40), s1((string)($in['to'] ?? ''), 40), time()]); }
        YES(['list' => rows('SELECT id, kind, from_city, to_city FROM ad_alerts WHERE user_id=? ORDER BY created', [$me]), 'premium' => x_premium($me)]); }
    case 'admin_ads': { need_admin(); $st = s1((string)($in['status'] ?? ''), 10);
        $L = $st ? rows('SELECT * FROM ads WHERE status=? ORDER BY created DESC LIMIT 100', [$st]) : rows('SELECT * FROM ads ORDER BY (reports>0) DESC, created DESC LIMIT 100');
        YES(['list' => array_map(fn($x) => ad_out($x, true) + ['reports' => (int)$x['reports'], 'views' => (int)$x['views'], 'msgs' => (int)$x['msgs'], 'user' => pmask((string)(row('SELECT phone FROM users WHERE id=?', [$x['user_id']])['phone'] ?? ''))], $L),
            'counts' => ['live' => (int)q("SELECT COUNT(*) FROM ads WHERE status='live' AND expires>?", [time()])->fetchColumn(), 'review' => (int)q("SELECT COUNT(*) FROM ads WHERE status IN ('review','pending')")->fetchColumn(), 'all' => (int)q('SELECT COUNT(*) FROM ads')->fetchColumn(), 'threads' => (int)q('SELECT COUNT(*) FROM ad_threads')->fetchColumn()]]); }
    case 'admin_ad_set': { need_admin(); $ad = ad_by_no((int)($in['no'] ?? 0)); if (!$ad) NO('آگهی پیدا نشد.');
        if (isset($in['status']) && in_array($in['status'], ['live', 'hidden', 'removed', 'review'], true)) q('UPDATE ads SET status=?, updated=? WHERE id=?', [$in['status'], time(), $ad['id']]);
        if (isset($in['pin_days'])) q('UPDATE ads SET pin_until=? WHERE id=?', [(int)$in['pin_days'] > 0 ? time() + min(60, (int)$in['pin_days']) * 86400 : 0, $ad['id']]); YES(); }

    /* ── «دارم می‌روم» ── */
    case 'leave_state': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!in_array($me['kind'], LEAVE_KINDS, true) || !$me['place_id']) YES(['on' => false]);
        $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); $d = pdata($me); $g = (string)($d['pg'] ?? 'f'); $mine = []; $near = [];
        $hist = ['work' => 0, 'home' => 0]; $H = (int)date('G'); foreach (rows("SELECT g.dir, g.at FROM tg_members m JOIN tgroups g ON g.id=m.group_id WHERE m.profile_id=? AND g.kind='leave' AND g.at>? LIMIT 80", [$me['id'], time() - 14 * 86400]) as $r) { $h = (int)date('G', (int)$r['at']); if (abs($h - $H) <= 1 && isset($hist[$r['dir']])) $hist[$r['dir']]++; }
        $mates = []; foreach (rows("SELECT m2.profile_id, COUNT(*) c FROM tg_members m JOIN tgroups g ON g.id=m.group_id JOIN tg_members m2 ON m2.group_id=g.id AND m2.profile_id<>m.profile_id WHERE m.profile_id=? AND g.kind='leave' AND g.at>? GROUP BY m2.profile_id HAVING COUNT(*)>=2 ORDER BY c DESC LIMIT 4", [$me['id'], time() - 14 * 86400]) as $r) { $mp = row('SELECT id, data FROM profiles WHERE id=?', [$r['profile_id']]); if ($mp) $mates[] = ['pid' => $mp['id'], 'name' => (string)(pdata($mp)['family'] ?? ''), 'n' => (int)$r['c']]; }
        $NP = lv_places($pl); $ph = implode(',', array_fill(0, count($NP), '?'));
        foreach (rows("SELECT * FROM tgroups WHERE kind='leave' AND place_id IN ($ph) AND status='open' AND until>? ORDER BY at", [...array_keys($NP), time()]) as $gr) {
            if (tg_member($gr['id'], $me['id'])) { $mine[] = tg_out($gr, $me['id']); continue; }
            if ($gr['g'] !== $g) continue; $ow = row('SELECT * FROM profiles WHERE id=?', [$gr['owner']]); if (!$ow || in_array($ow['id'], (array)($d['blocked'] ?? []), true) || in_array($me['id'], (array)(pdata($ow)['blocked'] ?? []), true)) continue;
            $gap = lv_match($pl, $d, pdata($ow), $gr['place_id'] === $me['place_id']); if ($gap === null) continue;
            $o = tg_out($gr, $me['id']); $o['gap'] = $gap; $o['gap_t'] = km_t($gap); if ($gr['place_id'] !== $me['place_id']) $o['from_t'] = (string)(row('SELECT name FROM places WHERE id=?', [$gr['place_id']])['name'] ?? ''); $near[] = $o; }
        if (isset($d['lat']) && is_numeric($d['lat']) && (float)$d['lat'] != 0) { x_schema(); $HC = hcells((float)$d['lat'], (float)$d['lng']); $hp = implode(',', array_fill(0, 9, '?'));
            foreach (rows("SELECT g.* FROM tgroups g JOIN profiles p ON p.id=g.owner WHERE g.kind='leave' AND g.status='open' AND g.until>? AND p.hcell IN ($hp) ORDER BY g.at LIMIT 60", [time(), ...$HC]) as $gr) { if (isset($NP[$gr['place_id']])) continue;
                if (tg_member($gr['id'], $me['id'])) { $mine[] = tg_out($gr, $me['id']); continue; } if ($gr['g'] !== $g) continue;
                $ow = row('SELECT * FROM profiles WHERE id=?', [$gr['owner']]); $opl = row('SELECT * FROM places WHERE id=?', [$gr['place_id']]); if (!$ow || !$opl || in_array($ow['id'], (array)($d['blocked'] ?? []), true) || in_array($me['id'], (array)(pdata($ow)['blocked'] ?? []), true)) continue;
                $gap = lv_corr($pl, $d, $opl, pdata($ow)); if ($gap === null) continue; $o = tg_out($gr, $me['id']); $o['gap'] = $gap; $o['gap_t'] = km_t($gap); $o['from_t'] = (string)$opl['name']; $near[] = $o; } }
        usort($near, fn($a, $b) => $a['gap'] <=> $b['gap']);
        /* v57 «best time»: across the last 3 weeks, at my workplace, same gender and direction — which 10-minute slot most often got 2+ people together. Aggregate only (≥3 matched days), no names. */
        $best = null; $bdir = (int)date('G') < 11 ? 'work' : 'home'; $BK = [];
        foreach (rows("SELECT g.at, COUNT(m.profile_id) c FROM tgroups g JOIN tg_members m ON m.group_id=g.id WHERE g.kind='leave' AND g.place_id=? AND g.g=? AND g.dir=? AND g.at>? GROUP BY g.id HAVING COUNT(m.profile_id)>=2 LIMIT 400", [$me['place_id'], $g, $bdir, time() - 21 * 86400]) as $r) {
            $mm = (int)date('G', (int)$r['at']) * 60 + (int)date('i', (int)$r['at']); $k = intdiv($mm, 10) * 10; $BK[$k] ??= [0, 0]; $BK[$k][0]++; $BK[$k][1] += (int)$r['c']; }
        if ($BK) { uasort($BK, fn($x, $y) => $y[0] <=> $x[0]); $k = array_key_first($BK); if ($BK[$k][0] >= 3) $best = ['t' => sprintf('%02d:%02d', intdiv($k, 60), $k % 60), 'days' => $BK[$k][0], 'avg' => round($BK[$k][1] / $BK[$k][0], 1), 'dir' => $bdir]; }
        YES(['best' => $best, 'hist' => $hist, 'mates' => $mates, 'on' => flag('leave_on'), 'allowed' => leave_allowed($u, $me), 'quota' => lv_quota($u, $me), 'dir' => (int)date('G') < 11 ? 'work' : 'home', 'place' => ['lat' => (float)$pl['lat'], 'lng' => (float)$pl['lng'], 'name' => $pl['name']], 'mine' => $mine, 'near' => array_slice($near, 0, 6), 'hear' => empty($d['leave_off'])]); }
    case 'leave_here': { $u = auth(); $me = row('SELECT * FROM profiles WHERE id=? AND user_id=?', [(string)($in['profile_id'] ?? ''), $u['user_id']]); if (!$me) NO('مسیر پیدا نشد.', 404);
        $gid = (string)($in['group'] ?? ''); $m0 = row('SELECT * FROM tg_members WHERE group_id=? AND profile_id=?', [$gid, $me['id']]); if (!$m0) NO('عضو این گروه نیستید.', 403);
        if (hit('lvhere_' . $gid . '_' . $me['id'], 120) > 1) NO('همین الان خبر دادید 🙂', 429); $UI = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$u['user_id']])['info'] ?? ''), true) ?: [];
        $who = hon(pdata($me)); $pl3 = !empty($UI['p3']) ? ' (پلاک ' . fa_d((string)$UI['p3']) . (!empty($UI['pir']) ? ' ایران ' . fa_d((string)$UI['pir']) : '') . ')' : '';
        foreach (tg_members($gid) as $m) if ($m['profile_id'] !== $me['id']) note($m['profile_id'], "🚗 $who کنار در است$pl3. بدوید، ولی با احتیاط 😄", 'match', $gid);
        YES(); }
    case 'leave_start': case 'leave_join': { if (!flag('leave_on')) NO('«دارم می‌روم» فعلاً خاموش است.', 403); $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? ''));
        if (!$me['complete'] || !in_array($me['kind'], LEAVE_KINDS, true) || !$me['place_id']) NO('«دارم می‌روم» برای مسیر محل کار یا دانشگاه است.');
        lv_can($u, $me, ($in['dir'] ?? '') === 'work' ? 'work' : 'home');
        $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); $d = pdata($me); $g = (string)($d['pg'] ?? 'f');
        $dir = ($in['dir'] ?? '') === 'work' ? 'work' : 'home';
        $role = ($in['role'] ?? '') === 'car' ? 'car' : 'ride'; $seats = $role === 'car' ? max(1, min(4, (int)($in['seats'] ?? 3))) : max(1, min(3, (int)($in['seats'] ?? 1)));
        $from = $dir === 'home' ? [(float)$pl['lat'], (float)$pl['lng']] : [(float)($d['lat'] ?? 0), (float)($d['lng'] ?? 0)];
        // v50: a chosen start point (hotel, relatives, …) on the way to work replaces home for «who is near me» — otherwise we would wake the wrong neighbours
        if ($a === 'leave_start' && $dir === 'work' && !empty($in['from_pick']) && is_numeric($in['lat'] ?? null) && is_numeric($in['lng'] ?? null) && abs((float)$in['lat']) <= 90 && abs((float)$in['lng']) <= 180) { $d['lat'] = (float)$in['lat']; $d['lng'] = (float)$in['lng']; $from = [$d['lat'], $d['lng']]; }
        $site = 0; if (isset($in['lat'], $in['lng']) && is_numeric($in['lat'])) $site = hav($from[0], $from[1], (float)$in['lat'], (float)$in['lng']) <= 600 ? 1 : 0;
        if (!$site && empty($in['confirm'])) NO($dir === 'home' ? 'به نظر در محل کار نیستید.' : 'به نظر در خانه نیستید.', 409, 'offsite');
        foreach (rows("SELECT g.id FROM tgroups g JOIN tg_members m ON m.group_id=g.id WHERE g.kind='leave' AND g.status='open' AND g.until>? AND m.profile_id=?", [time(), $me['id']]) as $x) q('DELETE FROM tg_members WHERE group_id=? AND profile_id=?', [$x['id'], $me['id']]);
        if ($a === 'leave_join') { $gr = row("SELECT * FROM tgroups WHERE id=? AND kind='leave'", [(string)($in['group'] ?? '')]); $okp = $gr && array_key_exists($gr['place_id'], lv_places($pl)); if ($gr && !$okp) { $ow0 = row('SELECT * FROM profiles WHERE id=?', [$gr['owner']]); $opl0 = row('SELECT * FROM places WHERE id=?', [$gr['place_id']]); $okp = $ow0 && $opl0 && lv_corr($pl, $d, $opl0, pdata($ow0)) !== null; }
            if (!$gr || $gr['status'] !== 'open' || (int)$gr['until'] < time() || !$okp || $gr['g'] !== $g) NO('این گروه دیگر باز نیست.', 404);
            $ow = row('SELECT * FROM profiles WHERE id=?', [$gr['owner']]); if (!$ow || in_array($me['id'], (array)(pdata($ow)['blocked'] ?? []), true) || in_array($ow['id'], (array)($d['blocked'] ?? []), true)) NO('این گروه دیگر باز نیست.', 404); $dir = $gr['dir'] ?: 'home'; }
        else { if (hit('leave_' . $me['id'], 86400) > 6) NO('امروز چند بار اعلام رفتن کردید؛ اگر لازم است در گفتگوی گروه بنویسید.', 429);
            $at = time() + max(0, min(90, (int)($in['in_min'] ?? 0))) * 60; $gr = null; $bd = 1e12;
            foreach (rows("SELECT * FROM tgroups WHERE kind='leave' AND place_id=? AND g=? AND status='open' AND until>? AND ABS(at-?)<=1500 AND COALESCE(dir,'home')=?", [$me['place_id'], $g, time(), $at, $dir]) as $c) { $ow = row('SELECT * FROM profiles WHERE id=?', [$c['owner']]);
                if ($ow && same_way($pl, $d, pdata($ow))) { $dd = isset($d['lat']) ? hav((float)$d['lat'], (float)$d['lng'], (float)(pdata($ow)['lat'] ?? 0), (float)(pdata($ow)['lng'] ?? 0)) : 0; if ($dd < $bd) { $bd = $dd; $gr = $c; } } }
            if (!$gr) { $id = 'G' . uid(11); q('INSERT INTO tgroups(id,kind,ref,place_id,g,owner,title,at,until,status,created,dir) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', [$id, 'leave', $me['id'], $me['place_id'], $g, $me['id'], $dir === 'home' ? 'رفتن به خانه از ' . $pl['name'] : 'رفتن به ' . $pl['name'], $at, $at + 5400, 'open', time(), $dir]); $gr = row('SELECT * FROM tgroups WHERE id=?', [$id]); $new = true; } }
        q('INSERT INTO tg_members(group_id,profile_id,user_id,role,seats,at_site,created) VALUES(?,?,?,?,?,?,?)', [$gr['id'], $me['id'], $u['user_id'], $role, $seats, $site, time()]);
        $who = hon($d, 'یک همکار'); $hood = (string)($d['hood'] ?? ''); $rt = $role === 'car' ? 'با ماشین و ' . fa_d($seats) . ' جای خالی' : 'بی‌ماشین';
        q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gr['id'], 'system', "$who $rt به گروه آمد" . ($hood ? " (سمت $hood)" : '') . '.', time()]);
        foreach (tg_members($gr['id']) as $m) if ($m['profile_id'] !== $me['id']) { $md = json_decode((string)$m['data'], true) ?: []; $T = hhmm((int)$gr['at']); $mh = (string)($md['hood'] ?? '');
            // v49 — the sweet moment: someone said yes. Say who, when and where, with a smile.
            $txt = $a === 'leave_join' && $role === 'car' && $m['role'] !== 'car' ? "🎉 $who با ماشین می‌آید، دمشان گرم! ساعت $T" . ($mh ? " سمت $mh" : '') . ' سوارتان می‌کند. کفش‌ها را بپوشید 👟'
                 : ($a === 'leave_join' && $role !== 'car' && $m['role'] === 'car' ? "🎉 $who هم می‌آید! ساعت $T" . ($hood ? " سمت $hood" : '') . ' سوارش کنید؛ یک صندلی را گرم نگه دارید 🙂'
                 : "$who هم ساعت $T می‌رود ($rt). در گروه هماهنگ شوید.");
            note($m['profile_id'], $txt, str_starts_with($txt, '🎉') ? 'match' : 'near', $gr['id']); }
        // our own team chat hears it too (once per direction per day), so teammates who are not in the group still see it
        if (!empty($me['team_id']) && hit('lvteam_' . $me['id'] . $dir, 43200) <= 1) q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $me['team_id'], 'system', "🚪 $who ساعت " . hhmm((int)$gr['at']) . ($dir === 'home' ? ' به خانه می‌رود' : " به {$pl['name']} می‌آید") . " ($rt). هم‌مسیرید؟ از منو «دارم می‌روم» را بزنید.", time()]);
        /* who hears it: the COMPLEMENT of my car status (I drive → people without a car; I have none → people with a car), same gender,
           same direction, home close by (distance stated) — from my workplace and from neighbouring ones (≤1.5 km). Closest first. */
        if (!empty($new)) { $sent = 0; $sms = 0; $pushed = [];
            // my preferred co-travellers (chosen from my contacts) hear it first — same gender, any of their work/uni mesiraks
            $MI = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$u['user_id']])['info'] ?? ''), true) ?: []; $PP = array_column((array)($MI['pref'] ?? []), 'phone');
            if ($PP) { $ph2 = implode(',', array_fill(0, count($PP), '?'));
                foreach (rows("SELECT p.id, p.user_id, p.data FROM profiles p JOIN users u ON u.id=p.user_id WHERE u.phone IN ($ph2) AND p.complete=1 AND p.kind IN ('work','uni') AND p.user_id<>?", [...$PP, $u['user_id']]) as $o) {
                    $od = pdata($o); if (($od['pg'] ?? 'f') !== $g || !empty($od['leave_off']) || in_array($me['id'], (array)($od['blocked'] ?? []), true) || isset($pushed[$o['user_id']])) continue;
                    $t = "⭐ $who (از هم‌سفرهای ترجیحی شما) ساعت " . hhmm((int)$gr['at']) . ($dir === 'home' ? ' به خانه می‌رود' : ' سر کار می‌رود') . ($role === 'car' ? '؛ ' . fa_d($seats) . ' جای خالی دارد.' : '؛ دنبال ماشین است.');
                    note($o['id'], $t, 'near', $gr['id']); $pushed[$o['user_id']] = 1; push_queue([$o['user_id']], '⭐ هم‌سفرِ شما راه افتاد', mb_substr($t, 0, 150), 'near'); $sent++; } } $NP = lv_places($pl); $ph = implode(',', array_fill(0, count($NP), '?')); $C = [];
            foreach (rows("SELECT p.*, u.phone, u.fake ufake FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.place_id IN ($ph) AND p.complete=1 AND p.user_id<>? AND p.kind IN (?,?) LIMIT 1500", [...array_keys($NP), $u['user_id'], 'work', 'uni']) as $o) {
                $od = pdata($o); if (($od['pg'] ?? 'f') !== $g || !empty($od['leave_off']) || in_array($me['id'], (array)($od['blocked'] ?? []), true) || in_array($o['id'], (array)($d['blocked'] ?? []), true)) continue;
                $hasCar = ($od['role'] ?? 'pay') !== 'pay' && (int)($od['seats'] ?? 1) > 0; if ($role === 'car' ? $hasCar && ($od['role'] ?? '') === 'drive' : !$hasCar) continue;
                $gap = lv_match($pl, $d, $od, $o['place_id'] === $me['place_id']); if ($gap === null) continue; $o['_gap'] = $gap; $o['_od'] = $od; $C[] = $o; }
            // v49 corridor: neighbours (≤2.5 km) heading to OTHER workplaces in the same direction — a whole township finds itself
            if (isset($d['lat']) && is_numeric($d['lat']) && (float)$d['lat'] != 0) { x_schema(); $seen = array_flip(array_column($C, 'id')); $HC = hcells((float)$d['lat'], (float)$d['lng']); $hp = implode(',', array_fill(0, 9, '?')); $PLc = [];
                foreach (rows("SELECT p.*, u.phone, u.fake ufake FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.hcell IN ($hp) AND p.complete=1 AND p.user_id<>? AND p.kind IN ('work','uni') LIMIT 600", [...$HC, $u['user_id']]) as $o) {
                    if (isset($seen[$o['id']]) || isset($NP[$o['place_id']])) continue; $od = pdata($o);
                    if (($od['pg'] ?? 'f') !== $g || !empty($od['leave_off']) || in_array($me['id'], (array)($od['blocked'] ?? []), true) || in_array($o['id'], (array)($d['blocked'] ?? []), true)) continue;
                    $hasCar = ($od['role'] ?? 'pay') !== 'pay' && (int)($od['seats'] ?? 1) > 0; if ($role === 'car' ? $hasCar && ($od['role'] ?? '') === 'drive' : !$hasCar) continue;
                    $opl = $PLc[$o['place_id']] ??= row('SELECT id, name, lat, lng FROM places WHERE id=?', [$o['place_id']]); if (!$opl) continue;
                    $gap = lv_corr($pl, $d, $opl, $od); if ($gap === null) continue; $o['_gap'] = $gap; $o['_od'] = $od; $o['_corr'] = 1; $C[] = $o; $seen[$o['id']] = 1; } }
            usort($C, fn($a, $b) => $a['_gap'] <=> $b['_gap']);
            $need = $role === 'car' ? 'بی‌ماشین' : 'ماشین‌دار';
            foreach (array_slice($C, 0, 60) as $o) { $od = $o['_od']; $far = km_t($o['_gap']); $there = $o['place_id'] === $me['place_id'] ? $pl['name'] : $pl['name'] . (!empty($o['_corr']) ? ' (هم‌جهت با مسیر شما)' : ' (نزدیک محل شما)');
                $offer = $role === 'car' ? 'ماشین دارد و ' . fa_d($seats) . ' جا' : 'دنبال ماشین است';
                $txt = $dir === 'home' ? "$who ساعت " . hhmm((int)$gr['at']) . " از $there به خانه می‌رود؛ $offer. خانه‌اش حدود $far از خانه‌ی شماست. شما هم می‌روید؟" : "$who ساعت " . hhmm((int)$gr['at']) . " از خانه به $there می‌آید؛ $offer. خانه‌اش حدود $far از خانه‌ی شماست. شما هم می‌آیید؟";
                note($o['id'], $txt, 'near', $gr['id']); $sent++;
                if (count($pushed) < 40 && !isset($pushed[$o['user_id']]) && hit('lvpush_' . $o['user_id'], 3600) <= 3) { $pushed[$o['user_id']] = 1; push_queue([$o['user_id']], $role === 'car' ? '🚗 جای خالی تا نزدیک خانه‌تان' : '🙋 همکاری دنبال ماشین است', mb_substr($txt, 0, 150), 'near'); }
                if ($sms < 10 && !(int)$o['ufake'] && $o['phone'] && ($od['leave_sms'] ?? 1) && flag('sms_direct') && sms_ready() && x_premium($o['user_id']) && hit('lvsms_' . $o['user_id'], 86400) <= 3) { try { kave_send($o['phone'], ($dir === 'home' ? "همکاری از {$pl['name']} ساعت " . hhmm((int)$gr['at']) . ' به سمت ' . ($hood ?: 'خانه') . ' می‌رود.' : 'همکاری ساعت ' . hhmm((int)$gr['at']) . ' از سمت ' . ($hood ?: 'خانه') . " به {$pl['name']} می‌آید.") . "\nهم‌مسیر شوید: residim.ir", 'leave', $u['user_id']); $sms++; } catch (Throwable $e) {} }
            }
            ev_log('leave', "🚪 «دارم می‌روم» در {$pl['name']}: $sent نفر $need باخبر شدند (" . count($pushed) . ' اعلان)', []); }
        lv_take($u, $me, $dir); YES(['group' => tg_out(row('SELECT * FROM tgroups WHERE id=?', [$gr['id']]), $me['id']), 'quota' => lv_quota($u, $me), 'sent' => (int)($sent ?? 0)]); }
    case 'leave_pref': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $d = pdata($me); $d['leave_off'] = empty($in['on']) ? 1 : 0;
        q('UPDATE profiles SET data=?, updated=? WHERE id=?', [json_encode($d, JSON_UNESCAPED_UNICODE), time(), $me['id']]); YES(['on' => !$d['leave_off']]); }
    /* v52 — «who of my contacts is on Residim?»: the phone sends numbers it already has; we answer only yes/no + same workplace,
       only for the same gender (the only people one may ride with), never a name, rate-limited (3 calls a day, 400 numbers) */
    case 'contacts_match': { if (getv('contacts_on', '1') !== '1') NO('این امکان فعلاً خاموش است.', 403); $u = auth(); need_phone($u); if (hit('cm_' . $u['user_id'], 86400) > 3) NO('امروز چند بار گشتیم؛ فردا دوباره 🙂', 429);
        $g = user_g($u['user_id']); $P = []; foreach (array_slice((array)($in['phones'] ?? []), 0, 400) as $x) { $ph = dg((string)$x); $ph = preg_replace('/^(0098|98)/', '0', $ph); if (preg_match('/^9\d{9}$/', $ph)) $ph = '0' . $ph; if (preg_match('/^09\d{9}$/', $ph) && $ph !== $u['phone']) $P[$ph] = 1; }
        if (!$P) YES(['list' => []]); $myp = array_column(rows("SELECT place_id FROM profiles WHERE user_id=? AND complete=1 AND kind IN ('work','uni')", [$u['user_id']]), 'place_id'); $out = [];
        foreach (array_chunk(array_keys($P), 200) as $ch) { $ph = implode(',', array_fill(0, count($ch), '?'));
            foreach (rows("SELECT id, phone FROM users WHERE phone IN ($ph) AND COALESCE(fake,0)=0", $ch) as $r) { if ($g && user_g($r['id']) && user_g($r['id']) !== $g) continue;
                $org = $myp ? (bool)row('SELECT 1 FROM profiles WHERE user_id=? AND complete=1 AND place_id IN (' . implode(',', array_fill(0, count($myp), '?')) . ')', [$r['id'], ...$myp]) : false; $out[] = ['phone' => $r['phone'], 'org' => $org]; } }
        YES(['list' => $out]); }
    case 'near_count': { $u = auth(); $la = (float)($in['lat'] ?? 0); $ln = (float)($in['lng'] ?? 0); if (!$la || abs($la) > 90 || abs($ln) > 180) YES(['n' => 0]); x_schema();
        $HC = hcells($la, $ln); $n = (int)(row('SELECT COUNT(DISTINCT user_id) c FROM profiles WHERE hcell IN (' . implode(',', array_fill(0, 9, '?')) . ") AND complete=1 AND user_id<>?", [...$HC, $u['user_id']])['c'] ?? 0);
        YES(['n' => $n < 3 ? 0 : ($n > 50 ? 50 : $n)]); } // anonymous and coarse: never below 3, capped at «۵۰+»
    case 'gp_create': case 'gp_get': case 'gp_post': case 'gp_join': case 'gp_leave': case 'gp_mine': { $u = auth(); need_phone($u); x_schema(); $me = $u['user_id'];
        if ($a === 'gp_mine') YES(['list' => array_map(fn($gp) => gp_out($gp, $me), rows('SELECT g.* FROM gpts g JOIN gp_members m ON m.gp_id=g.id WHERE m.user_id=? AND g.expires>? ORDER BY g.created DESC LIMIT 6', [$me, time()]))]);
        if ($a === 'gp_create') { $nm = s1((string)($in['name'] ?? ''), 60); $la = (float)($in['lat'] ?? 0); $ln = (float)($in['lng'] ?? 0); if (mb_strlen($nm) < 3 || !$la || abs($la) > 90 || abs($ln) > 180) NO('نام و جای نقطه را بدهید.');
            if (hit('gpc_' . $me, 86400) > 5) NO('امروز چند نقطه ساختید؛ فردا دوباره 🙂', 429); $days = max(1, min(14, (int)($in['days'] ?? 3)));
            $id = uid(); $code = substr(strtoupper(bin2hex(random_bytes(4))), 0, 7); q('INSERT INTO gpts(id,code,owner,name,lat,lng,expires,created) VALUES(?,?,?,?,?,?,?,?)', [$id, $code, $me, $nm, $la, $ln, time() + $days * 86400, time()]);
            q('INSERT INTO gp_members(gp_id,user_id,created) VALUES(?,?,?)', [$id, $me, time()]); YES(['gp' => gp_out(row('SELECT * FROM gpts WHERE id=?', [$id]), $me)]); }
        $gp = row('SELECT * FROM gpts WHERE code=? AND expires>?', [strtoupper(s1((string)($in['code'] ?? ''), 12)), time()]); if (!$gp) NO('این نقطه‌ی جمع پیدا نشد یا مهلتش تمام شده.', 404);
        if ($a === 'gp_leave') { q('DELETE FROM gp_members WHERE gp_id=? AND user_id=?', [$gp['id'], $me]); YES(); }
        if (!row('SELECT 1 FROM gp_members WHERE gp_id=? AND user_id=?', [$gp['id'], $me])) q('INSERT INTO gp_members(gp_id,user_id,created) VALUES(?,?,?)', [$gp['id'], $me, time()]); // opening the link = joining
        if ($a === 'gp_post') { $dest = s1((string)($in['dest'] ?? ''), 60); if (mb_strlen($dest) < 2) NO('کجا می‌روید؟'); if (hit('gpp_' . $me, 3600) > 6) NO('کمی صبر کنید 🙂', 429);
            $at = time() + 60 * max(0, min(720, (int)($in['in_min'] ?? 0))); $role = ($in['role'] ?? '') === 'car' ? 'car' : 'ride'; $g = user_g($me);
            q('INSERT INTO gp_posts(id,gp_id,user_id,g,dest,at,role,seats,created) VALUES(?,?,?,?,?,?,?,?,?)', [uid(), $gp['id'], $me, $g, $dest, $at, $role, max(1, min(4, (int)($in['seats'] ?? 3))), time()]);
            $to = array_values(array_filter(array_column(rows('SELECT user_id FROM gp_members WHERE gp_id=? AND user_id<>? LIMIT 200', [$gp['id'], $me]), 'user_id'), fn($x) => !$g || !user_g($x) || user_g($x) === $g));
            if ($to) push_queue($to, '📍 ' . $gp['name'], gp_name_of($me) . ' ساعت ' . hhmm($at) . ($role === 'car' ? ' با ماشین' : '') . " به $dest می‌رود؛ هم‌مسیرید؟", 'match');
            YES(['gp' => gp_out($gp, $me)]); }
        if ($a === 'gp_join') { $pp = row('SELECT * FROM gp_posts WHERE id=? AND gp_id=?', [(string)($in['post'] ?? ''), $gp['id']]); if (!$pp || $pp['user_id'] === $me) NO('پیدا نشد.', 404); $g = user_g($me); if ($pp['g'] && $g && $pp['g'] !== $g) NO('هم‌مسیری فقط میان هم‌جنس‌هاست.', 403);
            if (!row('SELECT 1 FROM gp_join WHERE post_id=? AND user_id=?', [$pp['id'], $me])) { q('INSERT INTO gp_join(post_id,user_id,created) VALUES(?,?,?)', [$pp['id'], $me, time()]); push_queue([$pp['user_id']], '🎉 ' . $gp['name'], gp_name_of($me) . ' هم با شما به ' . $pp['dest'] . ' می‌آید (ساعت ' . hhmm((int)$pp['at']) . ').', 'match'); }
            YES(['gp' => gp_out($gp, $me)]); }
        YES(['gp' => gp_out($gp, $me)]); }
    case 'ads_org': { $u = auth(); $P = array_column(rows("SELECT place_id FROM profiles WHERE user_id=? AND complete=1 AND kind IN ('work','uni')", [$u['user_id']]), 'place_id'); if (!$P) YES(['list' => []]);
        $L = rows("SELECT * FROM ads WHERE status='live' AND audience='org' AND expires>? AND contacts IN (" . implode(',', array_fill(0, count($P), '?')) . ') ORDER BY bumped DESC LIMIT 30', [time(), ...array_map(fn($x) => 'org:' . $x, $P)]);
        $g = user_g($u['user_id']); YES(['list' => array_values(array_map(fn($a) => ad_out($a), array_filter($L, fn($a) => !$g || $a['g'] === $g)))]); }
    /* v53 test simulator (flag test_tools): fake colleagues so one person can walk every «همین حالا» path alone */
    case 'test_sim': { if (!flag('test_tools')) NO('ابزار آزمایشی خاموش است.', 403); $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); if (!$pl) NO('اول مسیر محل کار بسازید.');
        // never mix fake colleagues into a place where real colleagues already are — they would see them too
        if (in_array((string)($in['k'] ?? ''), ['near', 'hist', 'car', 'car2', 'ride'], true) && (int)(row('SELECT COUNT(*) c FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.place_id=? AND p.user_id<>? AND p.complete=1 AND COALESCE(p.fake,0)=0 AND COALESCE(u.fake,0)=0', [$me['place_id'], $u['user_id']])['c'] ?? 0) > 0) NO('این محل همکار واقعی دارد؛ آزمایش را در یک مسیرِ آزمایشی جدا انجام دهید تا کسی گیج نشود.');
        $d = pdata($me); $k = (string)($in['k'] ?? ''); $NAMES = ['نسیم', 'سرو', 'نارون', 'آسمان', 'باران', 'افرا', 'نیلوفر', 'کاج'];
        $fake = function (bool $car) use ($me, $pl, $d, $NAMES) { $fid = make_fake($me, $pl, $car); $fp = row('SELECT * FROM profiles WHERE id=?', [$fid]); $fd = pdata($fp);
            $fd['pg'] = $d['pg'] ?? 'f'; $fd['role'] = $car ? 'drive' : 'pay'; $fd['seats'] = $car ? 3 : 0; $fd['family'] = $NAMES[array_rand($NAMES)] . ' (آزمایشی)'; $fd['days'] = [0, 1, 2, 3, 4];
            q('UPDATE profiles SET data=?, complete=1, kind=? WHERE id=?', [json_encode($fd, JSON_UNESCAPED_UNICODE), $me['kind'], $fid]); q('UPDATE users SET g=?, info=? WHERE id=?', [$fd['pg'], json_encode(['p3' => (string)random_int(100, 999), 'pir' => (string)random_int(10, 99)]), $fp['user_id']]);
            try { q('UPDATE profiles SET hcell=? WHERE id=?', [hcell((float)$fd['lat'], (float)$fd['lng']), $fid]); } catch (Throwable $e) {} return row('SELECT * FROM profiles WHERE id=?', [$fid]); };
        $gr = !empty($in['group']) ? row('SELECT * FROM tgroups WHERE id=?', [(string)$in['group']]) : null;
        $joinAs = function (array $fp, string $role) use ($gr, $me) { q('INSERT INTO tg_members(group_id,profile_id,user_id,role,seats,created) VALUES(?,?,?,?,?,?)', [$gr['id'], $fp['id'], $fp['user_id'], $role, $role === 'car' ? 3 : 1, time()]);
            $T = hhmm((int)$gr['at']); $who = hon(pdata($fp)); $h = (string)(pdata($me)['hood'] ?? '');
            note($me['id'], $role === 'car' ? "🎉 $who با ماشین می‌آید، دمشان گرم! ساعت $T" . ($h ? " سمت $h" : '') . ' سوارتان می‌کند. کفش‌ها را بپوشید 👟' : "🎉 $who هم می‌آید! ساعت $T سوارش کنید 🙂", 'match', $gr['id']); };
        if ($k === 'near') { for ($i = 0; $i < 5; $i++) $fake($i < 2); YES(['msg' => '۵ همکار آزمایشی (۲ ماشین‌دار) نزدیک خانه‌تان ساخته شد.']); }
        if (in_array($k, ['car', 'car2', 'ride'], true)) { if (!$gr || !tg_member($gr['id'], $me['id'])) NO('اول «اعلام» کنید؛ این دکمه در کارت «در راه» است.');
            for ($i = 0; $i < ($k === 'car2' ? 2 : 1); $i++) $joinAs($fake($k !== 'ride'), $k === 'ride' ? 'ride' : 'car'); YES(['msg' => 'هم‌مسیر آزمایشی پیوست.']); }
        if ($k === 'here' || $k === 'quit') { if (!$gr) NO('گروهی نیست.'); $fm = row("SELECT m.* FROM tg_members m JOIN profiles p ON p.id=m.profile_id WHERE m.group_id=? AND p.fake=1 ORDER BY m.created LIMIT 1", [$gr['id']]); if (!$fm) NO('اول یک هم‌مسیر آزمایشی بیاورید.');
            $who = hon(pdata(row('SELECT * FROM profiles WHERE id=?', [$fm['profile_id']])));
            if ($k === 'here') { note($me['id'], "🚗 $who کنار در است. بدوید، ولی با احتیاط 😄", 'match', $gr['id']); YES(['msg' => 'راننده‌ی آزمایشی کنار در است.']); }
            q('DELETE FROM tg_members WHERE group_id=? AND profile_id=?', [$gr['id'], $fm['profile_id']]); note($me['id'], "😕 $who نمی‌تواند بیاید (برنامه‌ام عوض شد). اعلامتان هنوز باز است؛ شاید کس دیگری بیاید.", 'near', $gr['id']); YES(['msg' => 'هم‌مسیر آزمایشی انصراف داد.']); }
        if ($k === 'hist') { $mate = $fake(($d['role'] ?? 'pay') === 'pay'); $H = time(); for ($i = 1; $i <= 3; $i++) { $gid = 'G' . uid(11); $at = $H - $i * 86400; $dir = (int)date('G') < 11 ? 'work' : 'home';
                q('INSERT INTO tgroups(id,kind,ref,place_id,g,owner,title,at,until,status,created,dir) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', [$gid, 'leave', $me['id'], $me['place_id'], $d['pg'] ?? 'f', $me['id'], 'سفر آزمایشی', $at, $at + 3600, 'closed', $at, $dir]);
                foreach ([[$me, 'ride'], [$mate, 'car']] as [$pp, $rl]) q('INSERT INTO tg_members(group_id,profile_id,user_id,role,seats,created) VALUES(?,?,?,?,?,?)', [$gid, $pp['id'], $pp['user_id'], $rl, 1, $at]); }
            YES(['msg' => '۳ سفر قبلیِ هم‌ساعت با یک هم‌سفر آزمایشی ثبت شد؛ پیشنهاد «سرویس ثابت» باید بیاید.']); }
        NO('ناشناخته.'); }
    /* v56 — bug reports: stored in the DB and mirrored to app/storage/bug-outbox.json (not web-readable). A GitHub Action pulls the
       outbox over FTPS, opens one issue per report (redacted), and uploads bug-ack.json; acknowledged reports leave the outbox here. */
    case 'bug_report': { $u = auth(false); $who = $u ? $u['user_id'] : ''; $ipk = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'r'), 0, 16);
        if (hit('bug_' . ($who ?: $ipk), 3600) > 8) NO('ممنون! همین الان چند گزارش رسید؛ کمی بعد دوباره 🙏', 429);
        $kind = ($in['kind'] ?? '') === 'auto' ? 'auto' : 'user'; $txt = s1((string)($in['text'] ?? ''), 1500); if ($kind === 'user' && mb_strlen($txt) < 4) NO('چه اتفاقی افتاد؟ یک جمله کافی است.');
        // redact what could identify someone before it ever leaves the server: phone numbers, long digit runs, e-mails
        $red = fn(string $x) => preg_replace(['/(\+?98|0)?9\d{9}/u', '/[۰-۹0-9]{7,}/u', '/[\w.+-]+@[\w-]+\.[\w.]+/u'], ['[شماره]', '[عدد]', '[ایمیل]'], $x);
        $R = ['id' => 'BR' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 7)), 'at' => gmdate('c'), 'kind' => $kind, 'text' => $red($txt), 'page' => s1((string)($in['page'] ?? ''), 80), 'ver' => s1((string)($in['ver'] ?? ''), 20),
              'ua' => s1((string)($in['ua'] ?? ''), 160), 'err' => $red(s1((string)($in['err'] ?? ''), 1800)), 'who' => $who ? substr(hash('sha256', $who . 'bug'), 0, 10) : 'guest'];
        try { q('CREATE TABLE IF NOT EXISTS bug_reports (id VARCHAR(12) PRIMARY KEY, at VARCHAR(30), body TEXT, sent INT DEFAULT 0)'); q('INSERT INTO bug_reports(id,at,body) VALUES(?,?,?)', [$R['id'], $R['at'], json_encode($R, JSON_UNESCAPED_UNICODE)]); } catch (Throwable $e) {}
        bug_outbox($R); YES(['id' => $R['id']]); }
    case 'leave_board': case 'leave_pick': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $gr = row('SELECT * FROM tgroups WHERE id=?', [(string)($in['group'] ?? '')]); if (!$gr || !tg_member($gr['id'], $me['id'])) NO('گروه پیدا نشد.', 404);
        if ($a === 'leave_board') { q("UPDATE tgroups SET status='full' WHERE id=? AND status='open'", [$gr['id']]); YES(['closed' => true]); } // boarded: nobody new can join a trip that already left
        $pick = (string)($in['pick'] ?? ''); $M = tg_members($gr['id']); $mine = array_values(array_filter($M, fn($m) => $m['profile_id'] === $me['id']))[0] ?? null; if (!$mine || $mine['role'] === 'car') NO('انتخاب راننده با مسافر است.', 403);
        if (!array_filter($M, fn($m) => $m['profile_id'] === $pick && $m['role'] === 'car')) NO('این راننده در گروه نیست.', 404);
        foreach ($M as $m) if ($m['role'] === 'car' && $m['profile_id'] !== $pick) { q('DELETE FROM tg_members WHERE group_id=? AND profile_id=?', [$gr['id'], $m['profile_id']]); note($m['profile_id'], 'ممنون از لطفتان 🙏 این بار با راننده‌ی دیگری هماهنگ شد؛ دفعه‌ی بعد با هم!', 'near', $gr['id']); }
        note($pick, '✅ انتخابتان کردند! ساعت ' . hhmm((int)$gr['at']) . ' منتظرتان هستند؛ در گفتگو هماهنگ کنید.', 'match', $gr['id']); YES(['group' => tg_out(row('SELECT * FROM tgroups WHERE id=?', [$gr['id']]), $me['id'])]); }
    case 'leave_quit': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $gr = row('SELECT * FROM tgroups WHERE id=?', [(string)($in['group'] ?? '')]); if (!$gr || !tg_member($gr['id'], $me['id'])) NO('گروه پیدا نشد.', 404);
        q('DELETE FROM tg_members WHERE group_id=? AND profile_id=?', [$gr['id'], $me['id']]); $left = tg_members($gr['id']);
        $WHY = ['late' => 'دیرم شد', 'plan' => 'برنامه‌ام عوض شد', 'other' => 'با کس دیگری می‌روم', 'sick' => 'حالم خوب نیست']; $why = $WHY[(string)($in['why'] ?? '')] ?? '';
        if ($why) ev_log('leave_cancel', $why, ['g' => $gr['id'], 'u' => $u['user_id']]);
        if ($left && empty($in['done'])) { $who = hon(pdata($me)); foreach ($left as $m) note($m['profile_id'], "😕 $who نمی‌تواند بیاید" . ($why ? " ($why)" : '') . '. اعلامتان هنوز باز است؛ شاید کس دیگری بیاید.', 'near', $gr['id']); }
        if (!$left || !empty($in['done'])) q("UPDATE tgroups SET status='closed' WHERE id=?", [$gr['id']]); elseif ($gr['owner'] === $me['id']) q('UPDATE tgroups SET owner=? WHERE id=?', [$left[0]['profile_id'], $gr['id']]);
        if ($left && empty($in['done'])) q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gr['id'], 'system', 'یک نفر از گروه رفت.', time()]); YES(); }
    case 'tg_chat': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $gr = row('SELECT * FROM tgroups WHERE id=?', [(string)($in['group'] ?? '')]); if (!$gr || !tg_member($gr['id'], $me['id'])) NO('گروه پیدا نشد.', 404);
        $t = s1((string)($in['text'] ?? ''), 400);
        if ($t !== '') { if ($gr['status'] !== 'open' && $gr['kind'] === 'leave') NO('گروه بسته شده است.'); $last = (int)q('SELECT COALESCE(MAX(created),0) FROM msgs WHERE profile_id=?', [$me['id']])->fetchColumn(); if (time() - $last < 2) NO('کمی آرام‌تر 🙂', 429);
            if ($e = x_bad($t, true)) NO($e); q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gr['id'], $me['id'], $t, time()]);
            $d = pdata($me); $who = hon($d, ''); foreach (tg_members($gr['id']) as $m) if ($m['profile_id'] !== $me['id']) push_queue(fam_users($m['profile_id']), $gr['title'], "$who: " . mb_substr($t, 0, 80), 'team'); }
        $L = []; foreach (rows('SELECT m.*, p.data pdata FROM msgs m LEFT JOIN profiles p ON p.id=m.profile_id WHERE m.team_id=? ORDER BY m.created DESC LIMIT 80', [$gr['id']]) as $m) { $dd = json_decode((string)$m['pdata'], true) ?: [];
            $L[] = ['text' => $m['text'], 'at' => (int)$m['created'], 'mine' => $m['profile_id'] === $me['id'], 'sys' => $m['profile_id'] === 'system', 'who' => $m['profile_id'] === 'system' ? 'رسیدیم' : (trim(($dd['title'] ?? '') . ' ' . ($dd['family'] ?? '')) ?: 'عضو')]; }
        usort($L, fn($x, $y) => [$x['at'], $x['sys'] ? 0 : 1] <=> [$y['at'], $y['sys'] ? 0 : 1]);
        YES(['group' => tg_out($gr, $me['id']), 'list' => $L]); }

    /* ── اردو (school panel side: token; family side: auth) ── */
    case 'school_ordu': { if (!flag('ordu_on')) NO('اردو فعلاً خاموش است.', 403); $pl = school_by_token((string)($in['token'] ?? '')); $paid = (int)($pl['plan_until'] ?? 0) > time();
        $op = (string)($in['op'] ?? 'list');
        if ($op !== 'list' && !$paid) NO('اردوی خانوادگی و دانش‌آموزی ویژه‌ی اشتراک مدرسه است.', 402);
        if ($op === 'save') { $t = s1((string)($in['title'] ?? ''), 120); $dest = s1((string)($in['dest'] ?? ''), 120); $at = (int)($in['at'] ?? 0);
            if (mb_strlen($t) < 3 || mb_strlen($dest) < 2) NO('نام اردو و مقصد را بنویسید.'); if ($at < time() || $at > time() + 200 * 86400) NO('تاریخ اردو باید در آینده باشد.');
            foreach ([$t, $dest, (string)($in['note'] ?? '')] as $c) if ($e = x_bad($c, true)) NO($e);
            $who = ($in['who'] ?? '') === 'family' ? 'family' : 'kids'; $dl = (int)($in['deadline'] ?? 0) ?: $at - 86400; $id = (string)($in['id'] ?? '');
            $f = [$t, $dest, $at, preg_match('/^\d{1,2}:\d{2}$/', en_d((string)($in['back'] ?? ''))) ? en_d((string)$in['back']) : '', s1((string)($in['meet'] ?? ''), 120), $who, max(0, min(50000000, (int)($in['cost'] ?? 0))), s1((string)($in['note'] ?? ''), 400), min($dl, $at)];
            if ($id && ($o = row('SELECT * FROM ordu WHERE id=? AND place_id=?', [$id, $pl['id']]))) q('UPDATE ordu SET title=?, dest=?, at=?, back=?, meet=?, who=?, cost=?, note=?, deadline=? WHERE id=?', array_merge($f, [$o['id']]));
            else { if ((int)q("SELECT COUNT(*) FROM ordu WHERE place_id=? AND status='open' AND at>?", [$pl['id'], time()])->fetchColumn() >= 3) NO('حداکثر ۳ اردوی باز هم‌زمان.');
                $id = uid(); q('INSERT INTO ordu(id,place_id,title,dest,at,back,meet,who,cost,note,deadline,status,planned,plan,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0,NULL,?)', array_merge([$id, $pl['id']], $f, ['open', time()]));
                $n = 0; foreach (rows('SELECT id FROM profiles WHERE place_id=? AND complete=1', [$pl['id']]) as $r) { note($r['id'], '🎒 ' . $pl['name'] . ': ' . o_name($t) . ' – ' . jdate_parts($at) . '. می‌آیید؟ ماشین دارید؟ در رسیدیم پاسخ دهید.', 'team', $id); $n++; }
                ev_log('school', '🎒 ' . o_name($t) . " برای $n خانواده‌ی {$pl['name']} اعلام شد", []); } }
        if ($op === 'close') q("UPDATE ordu SET status='closed' WHERE id=? AND place_id=?", [(string)($in['id'] ?? ''), $pl['id']]);
        if ($op === 'plan') { $o = row('SELECT * FROM ordu WHERE id=? AND place_id=?', [(string)($in['id'] ?? ''), $pl['id']]); if (!$o) NO('اردو پیدا نشد.', 404); if ((int)$o['at'] < time()) NO('تاریخ اردو گذشته است.');
            foreach (rows("SELECT id FROM tgroups WHERE kind='ordu' AND ref=?", [$o['id']]) as $g0) { q('DELETE FROM tg_members WHERE group_id=?', [$g0['id']]); q('DELETE FROM msgs WHERE team_id=?', [$g0['id']]); q('DELETE FROM tgroups WHERE id=?', [$g0['id']]); }
            q('UPDATE ordu_rsvp SET grp=NULL WHERE ordu_id=?', [$o['id']]); $A = ordu_allocate($o); $k = 0; $cars = [];
            foreach ($A['cars'] as $c) { $k++; $gid = 'G' . uid(11); $dn = pdata(row('SELECT * FROM profiles WHERE id=?', [$c['drv']['pid']]))['family'] ?? '';
                q('INSERT INTO tgroups(id,kind,ref,place_id,g,owner,title,at,until,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)', [$gid, 'ordu', $o['id'], $pl['id'], '', $c['drv']['pid'], 'ماشین ' . fa_d($k) . ' – ' . o_name($o['title']), (int)$o['at'], (int)$o['at'] + 2 * 86400, 'open', time()]);
                foreach ($c['fam'] as $i => $f) { $ur = row('SELECT user_id FROM profiles WHERE id=?', [$f['pid']]); q('INSERT INTO tg_members(group_id,profile_id,user_id,role,seats,at_site,created) VALUES(?,?,?,?,?,0,?)', [$gid, $f['pid'], $ur['user_id'] ?? '', $i ? 'ride' : 'car', $i ? $f['need'] : $f['seats'], time() + $i]);
                    q('UPDATE ordu_rsvp SET grp=? WHERE ordu_id=? AND profile_id=?', [$gid, $o['id'], $f['pid']]);
                    note($f['pid'], $i ? '🎒 ' . o_name($o['title']) . ": با ماشین خانواده $dn می‌روید. گفتگوی ماشین باز شد." : '🎒 ' . o_name($o['title']) . ': ' . fa_d(count($c['fam']) - 1) . ' خانواده با ماشین شما می‌آیند. گفتگوی ماشین باز شد.', 'team', $gid); }
                q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gid, 'system', 'این گروهِ ماشین ' . fa_d($k) . ' برای ' . o_name($o['title']) . ' است. ساعت و جای سوار شدن را همین‌جا هماهنگ کنید. 🌷', time()]);
                $cars[] = ['n' => $k, 'families' => count($c['fam']), 'seats' => $c['drv']['seats'], 'used' => $c['drv']['seats'] - $c['left']]; }
            $bus = array_sum(array_column($A['bus'], 'need')); $plan = ['at' => time(), 'cars' => $cars, 'bus_people' => $bus, 'bus_families' => count($A['bus'])];
            q('UPDATE ordu SET planned=?, plan=? WHERE id=?', [time(), json_encode($plan, JSON_UNESCAPED_UNICODE), $o['id']]);
            foreach ($A['bus'] as $f) note($f['pid'], '🎒 ' . o_name($o['title']) . ": برایتان جای ماشین پیدا نشد؛ مدرسه برای شما سرویس یا اتوبوس هماهنگ می‌کند.", 'team', $o['id']); }
        YES(['paid' => $paid, 'list' => array_map(fn($o) => ordu_out($o, true), rows('SELECT * FROM ordu WHERE place_id=? ORDER BY at DESC LIMIT 12', [$pl['id']]))]); }
    case 'school_staff': { $pl = school_by_token((string)($in['token'] ?? '')); $paid = (int)($pl['plan_until'] ?? 0) > time(); $op = (string)($in['op'] ?? 'list');
        if ($op !== 'list' && !$paid) NO('دسترسیِ کادر مدرسه ویژه‌ی اشتراک مدرسه است.', 402);
        if ($op === 'add') { $ph = phone_norm((string)($in['phone'] ?? '')); if (!$ph) NO('شماره‌ی موبایل درست نیست.'); if ((int)q('SELECT COUNT(*) FROM place_staff WHERE place_id=?', [$pl['id']])->fetchColumn() >= 5) NO('حداکثر ۵ شماره‌ی کادر.');
            $role = in_array($in['role'] ?? '', ['admin', 'staff'], true) ? $in['role'] : 'staff'; try { q('INSERT INTO place_staff(place_id,phone,role,created) VALUES(?,?,?,?)', [$pl['id'], $ph, $role, time()]); } catch (Throwable $e) { q('UPDATE place_staff SET role=? WHERE place_id=? AND phone=?', [$role, $pl['id'], $ph]); }
            ev_log('school', '👥 شماره‌ی کادر برای ' . $pl['name'] . ' ثبت شد', []); }
        if ($op === 'del') q('DELETE FROM place_staff WHERE place_id=? AND phone=?', [$pl['id'], phone_norm((string)($in['phone'] ?? '')) ?: '-']);
        YES(['paid' => $paid, 'list' => array_map(fn($r) => ['phone' => pmask($r['phone']), 'raw' => $r['phone'], 'role' => $r['role']], rows('SELECT * FROM place_staff WHERE place_id=? ORDER BY created', [$pl['id']]))]); }
    case 'my_info': { $u = auth(); $me = $u['user_id']; $I = json_decode((string)(row('SELECT info FROM users WHERE id=?', [$me])['info'] ?? ''), true) ?: [];
        if (!empty($in['save'])) { $f = fn($k, $n) => s1((string)($in[$k] ?? ''), $n);
            unset($I['plate']);
            if (array_key_exists('av', $in)) { $I['av'] = av_clean((string)$in['av']); if ($in['av'] !== '' && $I['av'] === '') NO('این عکس پذیرفته نشد؛ یک عکس دیگر بفرستید.'); unset($in['av']); }
            if (array_key_exists('rel', $in)) { $I['rel'] = in_array($in['rel'], ['mother', 'father', 'grandma', 'grandpa', 'sister', 'brother', 'other'], true) ? $in['rel'] : ''; $I['rel_t'] = $I['rel'] === 'other' ? mb_substr(trim((string)($in['rel_t'] ?? '')), 0, 30) : ''; unset($in['rel'], $in['rel_t']); }
            if (array_key_exists('job', $in)) { $I['job'] = in_array($in['job'], ['teacher', 'cleric', 'academic', 'student', 'medic', 'other'], true) ? $in['job'] : ''; unset($in['job']); }
            if (array_key_exists('tcode', $in)) $I['tcode'] = substr(dg((string)$in['tcode']), 0, 12);
            if (array_key_exists('p3', $in)) $I['p3'] = substr(dg((string)$in['p3']), 0, 3);
            if (array_key_exists('pir', $in)) $I['pir'] = substr(dg((string)$in['pir']), 0, 2);
            if (isset($in['kids']) && is_array($in['kids'])) { $jy = (int)date('Y') - (date('md') >= '0321' ? 621 : 622); $I['kids'] = array_values(array_filter(array_map(fn($k) => ['first' => s1((string)($k['first'] ?? ''), 30), 'g' => in_array($k['g'] ?? '', ['f', 'm'], true) ? $k['g'] : '', 'by' => (($b = (int)dg((string)($k['by'] ?? ''))) >= $jy - 30 && $b <= $jy) ? $b : ''], array_slice($in['kids'], 0, 6)), fn($k) => $k['first'] !== '')); }
            foreach (['family' => 40, 'first' => 30, 'city' => 40, 'hood' => 60, 'car' => 40, 'color' => 20] as $k => $n) if (array_key_exists($k, $in)) { $v = $f($k, $n); if ($e = x_bad($v, true)) NO($e); $I[$k] = $v; }
            if (isset($in['lat'], $in['lng']) && is_numeric($in['lat']) && is_numeric($in['lng']) && abs((float)$in['lat']) <= 90) { $I['lat'] = round((float)$in['lat'], 5); $I['lng'] = round((float)$in['lng'], 5); }
            if (array_key_exists('seats', $in)) $I['seats'] = max(0, min(6, (int)$in['seats']));
            /* endpoints: named places with a real location (home is separate); routes join two endpoints with a time and weekdays */
            $ok_ll = fn($a, $b) => is_numeric($a) && is_numeric($b) && abs((float)$a) <= 90 && abs((float)$b) <= 180 && ((float)$a != 0 || (float)$b != 0);
            if (isset($in['places']) && is_array($in['places'])) $I['places'] = array_values(array_filter(array_map(fn($x) => ['id' => preg_match('/^[a-z0-9]{3,12}$/', (string)($x['id'] ?? '')) ? (string)$x['id'] : substr(md5(uniqid('', true)), 0, 8),
                'label' => s1((string)($x['label'] ?? ''), 30), 'kind' => in_array($x['kind'] ?? '', ['work', 'edu', 'gym', 'family', 'shop', 'other'], true) ? $x['kind'] : 'other',
                'lat' => $ok_ll($x['lat'] ?? null, $x['lng'] ?? null) ? round((float)$x['lat'], 6) : null, 'lng' => $ok_ll($x['lat'] ?? null, $x['lng'] ?? null) ? round((float)$x['lng'], 6) : null], array_slice($in['places'], 0, 8)), fn($x) => $x['label'] !== '')); $PM = (int)getv('places_max', '6'); if (isset($in['places']) && $PM > 0 && count((array)($I['places'] ?? [])) > $PM) NO('حداکثر ' . fa_d((string)$PM) . ' جای شخصی؛ یکی را بردارید تا جای تازه بنشیند. (خانه و محل کار جدا حساب می‌شوند.)');
            if (isset($in['routes']) && is_array($in['routes'])) $I['routes'] = array_values(array_filter(array_map(fn($r) => ['from' => s1((string)($r['from'] ?? ''), 40), 'to' => s1((string)($r['to'] ?? ''), 40),
                'tm' => preg_match('/^([01]?\d|2[0-3]):[0-5]\d$/', en_d((string)($r['tm'] ?? ''))) ? en_d((string)$r['tm']) : '', 'days' => array_values(array_unique(array_filter(array_map('intval', (array)($r['days'] ?? [])), fn($d) => $d >= 0 && $d <= 6)))], array_slice($in['routes'], 0, 8)), fn($r) => $r['from'] !== '' && $r['to'] !== '' && $r['from'] !== $r['to']));
            if (array_key_exists('job_t', $in)) $I['job_t'] = s1((string)$in['job_t'], 40);
            if (array_key_exists('halo', $in)) $I['halo'] = !empty($in['halo']);
            if (isset($in['pref']) && is_array($in['pref'])) { $seen = []; $I['pref'] = array_values(array_filter(array_map(function ($c) use (&$seen) { $ph = dg((string)($c['phone'] ?? '')); if (!preg_match('/^09\d{9}$/', $ph) || isset($seen[$ph])) return null; $seen[$ph] = 1; return ['name' => s1((string)($c['name'] ?? ''), 30), 'phone' => $ph]; }, array_slice($in['pref'], 0, 30)))); }
            if (isset($in['trust']) && is_array($in['trust'])) { $tp = dg((string)($in['trust']['phone'] ?? '')); $I['trust'] = ['name' => s1((string)($in['trust']['name'] ?? ''), 30), 'phone' => preg_match('/^09\d{9}$/', $tp) ? $tp : '']; }
            if (!empty($in['g'])) set_g($me, s1((string)$in['g'], 1));
            q('UPDATE users SET info=? WHERE id=?', [json_encode($I, JSON_UNESCAPED_UNICODE), $me]); }
        YES(['info' => $I + ['g' => user_g($me)]]); }
    case 'school_logo': { $pl = school_by_token((string)($in['token'] ?? '')); if ((int)($pl['plan_until'] ?? 0) < time()) NO('لوگو ویژه‌ی اشتراک مدرسه است.', 402);
        $d = (string)($in['data'] ?? ''); if ($d === '') { q('UPDATE places SET logo=NULL WHERE id=?', [$pl['id']]); YES(); }
        if (!preg_match('#^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$#', $d, $m) || strlen($m[2]) > 160000) NO('تصویر PNG یا JPG تا حدود ۱۰۰ کیلوبایت بفرستید.');
        $raw = base64_decode($m[2], true); $info = $raw ? @getimagesizefromstring($raw) : false; if (!$info || $info[0] > 1024 || $info[1] > 1024) NO('تصویر خراب است یا بزرگ‌تر از ۱۰۲۴ پیکسل.');
        q('UPDATE places SET logo=? WHERE id=?', [$d, $pl['id']]); YES(['logo' => '/app/api/logo.php?p=' . $pl['id'] . '&v=' . substr(md5($d), 0, 8)]); }
    case 'staff_panel': { $u = auth(); need_phone($u); $r = row('SELECT pl.* FROM place_staff s JOIN places pl ON pl.id=s.place_id WHERE s.phone=? AND s.place_id=? AND s.role=?', [$u['phone'], (string)($in['place_id'] ?? ''), 'admin']);
        if (!$r || !$r['dash_token']) NO('دسترسی پنل این مدرسه برای شماره‌ی شما تعریف نشده است.', 403); ev_log('school', '🔑 ورود کادر به پنل ' . $r['name'], []); YES(['url' => '/schools/#panel/' . $r['dash_token']]); }
    case 'ordu_mine': { $u = auth(); $out = [];
        foreach (rows('SELECT o.*, p.id pid, p.data pdata FROM ordu o JOIN profiles p ON p.place_id=o.place_id WHERE p.user_id=? AND p.complete=1 AND o.status=? AND o.at>?', [$u['user_id'], 'open', time() - 86400]) as $o) {
            $r = row('SELECT * FROM ordu_rsvp WHERE ordu_id=? AND profile_id=?', [$o['id'], $o['pid']]); $g = $r && $r['grp'] ? row('SELECT * FROM tgroups WHERE id=?', [$r['grp']]) : null;
            $out[] = ordu_out($o) + ['profile_id' => $o['pid'], 'kids_n' => count((array)((json_decode((string)$o['pdata'], true) ?: [])['kids'] ?? [])), 'rsvp' => $r ? ['go' => (int)$r['go'], 'kids' => (int)$r['kids'], 'am' => (int)$r['adults_m'], 'af' => (int)$r['adults_f'], 'role' => $r['role'], 'seats' => (int)$r['seats']] : null, 'group' => $g ? tg_out($g, $o['pid']) : null]; }
        YES(['list' => $out]); }
    case 'ordu_rsvp': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $o = row('SELECT * FROM ordu WHERE id=?', [(string)($in['id'] ?? '')]);
        if (!$o || $o['place_id'] !== $me['place_id'] || $o['status'] !== 'open') NO('این اردو باز نیست.', 404); if ((int)$o['deadline'] && (int)$o['deadline'] < time()) NO('مهلت پاسخ به این اردو تمام شده است.');
        $go = !empty($in['go']) ? 1 : 0; $role = in_array($in['role'] ?? '', ['car', 'ride', 'self'], true) ? $in['role'] : 'self';
        $v = [$go, max(0, min(6, (int)($in['kids'] ?? 0))), max(0, min(4, (int)($in['am'] ?? 0))), max(0, min(4, (int)($in['af'] ?? 0))), $role, $role === 'car' ? max(1, min(6, (int)($in['seats'] ?? 2))) : 0];
        if ($go && $v[1] + $v[2] + $v[3] === 0) NO('بگویید چند نفر می‌آیند.');
        if (row('SELECT 1 FROM ordu_rsvp WHERE ordu_id=? AND profile_id=?', [$o['id'], $me['id']])) q('UPDATE ordu_rsvp SET go=?, kids=?, adults_m=?, adults_f=?, role=?, seats=?, updated=? WHERE ordu_id=? AND profile_id=?', array_merge($v, [time(), $o['id'], $me['id']]));
        else q('INSERT INTO ordu_rsvp(ordu_id,profile_id,user_id,go,kids,adults_m,adults_f,role,seats,grp,created,updated) VALUES(?,?,?,?,?,?,?,?,?,NULL,?,?)', array_merge([$o['id'], $me['id'], $u['user_id']], $v, [time(), time()]));
        YES(); }
    }
}

/* ── v46 · place names by quiet consensus ──────────────────────────────────────────────────────────────────────────
   No new table, no voting UI: every member's own label for a shared place (profiles.label) IS their vote, and it stays
   private — each person keeps seeing their own name. Only the PUBLIC name (map, «همین‌جاست؟», ads, invites) follows
   the consensus. Generic words («محل کار»، «دانشگاه») are not votes. Spelling variants cluster (Persian-normalised,
   edit-distance ≥ 80% or containment). Change only with a clear majority (≥3 people, ≥50%) and a 2-vote lead over the
   current name, so it never flickers. Places an owner has claimed (verified / panel / plan) are never renamed. */
function pn_norm(string $s): string {
    $s = strtr($s, ['ي' => 'ی', 'ى' => 'ی', 'ك' => 'ک', 'ة' => 'ه', 'ۀ' => 'ه', 'أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', "\u{200C}" => ' ', 'ـ' => '',
        '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9']);
    $s = preg_replace('/[^\p{L}\p{N} ]+/u', ' ', mb_strtolower($s)); return trim(preg_replace('/\s+/u', ' ', $s));
}
function pn_sim(string $a, string $b): float {
    if ($a === $b) return 1.0; $A = mb_str_split($a); $B = mb_str_split($b); $n = count($A); $m = count($B); if (!$n || !$m) return 0.0;
    if ((mb_strpos($a, $b) !== false || mb_strpos($b, $a) !== false) && min($n, $m) / max($n, $m) >= .6) return .85;
    $pr = range(0, $m); for ($i = 1; $i <= $n; $i++) { $cu = [$i]; for ($j = 1; $j <= $m; $j++) $cu[$j] = min($pr[$j] + 1, $cu[$j - 1] + 1, $pr[$j - 1] + ($A[$i - 1] === $B[$j - 1] ? 0 : 1)); $pr = $cu; }
    return 1 - $pr[$m] / max($n, $m);
}
const PN_GENERIC = ['مسیرک', 'محل کار', 'کار', 'سر کار', 'سرکار', 'شرکت', 'اداره', 'دانشگاه', 'دانشکده', 'خانه', 'مدرسه', 'مهد', 'مسیر', 'باشگاه', 'work', 'office', 'uni'];
function place_consensus(string $pid): ?string {
    $pl = row('SELECT * FROM places WHERE id=?', [$pid]); if (!$pl || (int)($pl['verified'] ?? 0) || !empty($pl['dash_token']) || !empty($pl['plan_tier'])) return null;
    $V = []; foreach (rows('SELECT user_id, label FROM profiles WHERE place_id=? AND complete=1 AND COALESCE(fake,0)=0', [$pid]) as $r) {
        $t = trim(preg_replace('/\s+/u', ' ', (string)$r['label'])); $n = pn_norm($t); if (mb_strlen($n) < 3 || in_array($n, PN_GENERIC, true)) continue; $V[$r['user_id']] = [$t, $n]; }
    if (count($V) < 3) return null; $C = [];
    foreach ($V as [$t, $n]) { $k = null; foreach ($C as $i => $c) if (pn_sim($n, $c['n']) >= .8) { $k = $i; break; }
        if ($k === null) { $C[] = ['n' => $n, 'cnt' => 0, 'f' => []]; $k = count($C) - 1; } $C[$k]['cnt']++; $C[$k]['f'][$t] = ($C[$k]['f'][$t] ?? 0) + 1; }
    usort($C, fn($a, $b) => $b['cnt'] <=> $a['cnt']); $W = $C[0]; arsort($W['f']); $F = (string)array_key_first($W['f']);
    $cur = pn_norm((string)$pl['name']); if ($cur === pn_norm($F)) return null; $nc = 0; $inW = pn_sim($cur, $W['n']) >= .8;
    foreach ($C as $c) if (pn_sim($cur, $c['n']) >= .8) { $nc = $c['cnt']; break; }
    $ok = $inW ? ($W['f'][$F] >= 3 && $W['f'][$F] >= (int)($W['f'][trim((string)$pl['name'])] ?? 0) + 2)
               : ($W['cnt'] >= 3 && $W['cnt'] * 2 >= count($V) && $W['cnt'] >= $nc + 2);
    if (!$ok) return null; q('UPDATE places SET name=? WHERE id=?', [mb_substr($F, 0, 160), $pid]); return $F;
}
