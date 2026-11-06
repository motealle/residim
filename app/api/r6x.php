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
    static $done = false; if ($done) return; $done = true; $v = (int)getv('xschema', '0'); if ($v >= 5) return; if ($v === 4) { x_schema5(); return; } if ($v === 3) { x_schema4(); x_schema5(); return; } if ($v === 2) { x_schema3(); x_schema4(); x_schema5(); return; } if ($v === 1) { x_schema2(); x_schema3(); x_schema4(); return; }
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
    setv('xschema', '1', $p); x_schema2(); x_schema3(); x_schema4(); x_schema5();
}
/** v37: school staff numbers (full access + panel), and the direction of a leave group (home | work). */
function x_schema2(): void { $p = db6(); $K = 'VARCHAR(40)'; $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '';
    foreach (["CREATE TABLE IF NOT EXISTS place_staff (place_id $K, phone VARCHAR(20), role VARCHAR(12), created INT, PRIMARY KEY(place_id, phone))$my", "ALTER TABLE tgroups ADD COLUMN dir VARCHAR(5) DEFAULT 'home'", 'CREATE INDEX ix_staff_ph ON place_staff(phone)'] as $q) { try { $p->exec($q); } catch (Throwable $e) {} }
    setv('xschema', '2', $p); }
/** v38: a trip card and a rating per conversation (safety between strangers), and the school logo. */
function x_schema3(): void { $p = db6(); foreach (['ALTER TABLE ad_threads ADD COLUMN trip TEXT', 'ALTER TABLE ad_threads ADD COLUMN owner_rate INT DEFAULT 0', 'ALTER TABLE ad_threads ADD COLUMN asker_rate INT DEFAULT 0', 'ALTER TABLE places ADD COLUMN logo TEXT'] as $q) { try { $p->exec($q); } catch (Throwable $e) {} } setv('xschema', '3', $p); }
/** v38: the member's own fixed details («اطلاعات من»), used to prefill every form. */
function x_schema4(): void { $p = db6(); try { $p->exec('ALTER TABLE users ADD COLUMN info TEXT'); } catch (Throwable $e) {} setv('xschema', '4', $p); }
function x_schema5(): void { $p = db6(); try { $p->exec('ALTER TABLE users ADD COLUMN lv_credits INT DEFAULT 0'); } catch (Throwable $e) {}
    $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '';
    $p->exec("CREATE TABLE IF NOT EXISTS lv_use(user_id VARCHAR(40) NOT NULL, k VARCHAR(16) NOT NULL, at INT NOT NULL, paid INT DEFAULT 0, PRIMARY KEY(user_id, k))$my"); setv('xschema', '5', $p); }
/* «دارم می‌روم» quota: subscribers, sponsored places and paid teams are unlimited; everyone else rides as our guest — 30 trips in the
   first (gift) month, then 20 every 30 days — and after that uses prepaid trip passes (counted in trips, never money: no wallet).
   One trip = one direction on one day, so quitting and re-joining is never charged twice. */
function lv_quota(array $u, array $prof): array { if (leave_allowed($u, $prof)) return ['unlimited' => true];
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
        'created' => (int)$a['created'], 'bumped' => (int)$a['bumped'], 'status' => $a['status'], 'audience' => $a['audience']];
    if ($full) $o['body'] = (string)$a['body'];
    else $o['snip'] = mb_substr((string)$a['body'], 0, 140);
    return $o; }
/** Live public ads, pinned first then freshest. Filters are exact on kind/gender and "contains" on cities. */
function ads_query(array $f, int $limit = 30, int $offset = 0): array {
    $w = ["status='live'", "audience='public'", 'expires>?']; $a = [time()];
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
function tg_out(array $g, string $me): array {
    $M = tg_members($g['id']); $car = 0; $ride = 0; $out = [];
    foreach ($M as $m) { $d = json_decode((string)$m['data'], true) ?: []; if ($m['role'] === 'car') $car += (int)$m['seats']; else $ride += max(1, (int)$m['seats']);
        $out[] = ['pid' => $m['profile_id'], 'me' => $m['profile_id'] === $me, 'name' => $g['kind'] === 'ordu' ? 'خانواده ' . ($d['family'] ?? '') : (trim(($d['title'] ?? '') . ' ' . ($d['family'] ?? '')) ?: 'همکار'), 'role' => $m['role'], 'seats' => (int)$m['seats'], 'hood' => (string)($d['hood'] ?? ''), 'at_site' => (int)$m['at_site'], 'owner' => $m['profile_id'] === $g['owner']]; }
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
        $kind = $f('kind', 12); $role = $f('role', 6); $share = $f('share', 8); $aud = $f('audience', 8) === 'contacts' ? 'contacts' : 'public';
        if (!isset(AD_KINDS[$kind])) NO('نوع آگهی را انتخاب کنید.'); if (!in_array($role, ['driver', 'rider'], true)) NO('بگویید ماشین دارید یا هم‌مسیر می‌خواهید.'); if (!isset(AD_SHARE[$share])) $share = 'dong';
        if (empty($in['adult'])) NO('آگهی فقط برای بزرگسالان (۱۸ سال به بالا) است؛ تأیید کنید.');
        if (empty($in['rules'])) NO('قوانین آگهی را بخوانید و بپذیرید.');
        $g = set_g($me, $f('g', 1)); if (!$g) NO('بگویید آقا هستید یا خانم؛ هم‌مسیری فقط میان هم‌جنس‌هاست.');
        if ($f('g', 1) && $f('g', 1) !== $g) NO('جنسیت این حساب قبلاً ثبت شده و تغییر نمی‌کند؛ اگر اشتباه است به پشتیبانی بگویید.');
        $fc = $f('from_city', 40); $tc = $f('to_city', 40); $fa = $f('from_area', 60); $ta = $f('to_area', 60); $body = s1((string)($in['body'] ?? ''), 600);
        foreach ([$fc, $tc] as $c) if (mb_strlen($c) < 2 || preg_match('/[0-9۰-۹<>]/u', $c)) NO('نام شهرِ مبدأ و مقصد را درست بنویسید.');
        foreach ([$fa, $ta] as $c) if (preg_match('/(پلاک|واحد|طبقه|کوچه\s*[0-9۰-۹])|[0-9۰-۹]{3,}|[<>]/u', $c)) NO('نشانی دقیق ننویسید؛ فقط محله یا نقطه‌ی شناخته‌شده (مثل «میدان ونک»).');
        foreach ([$fa, $ta, $body] as $c) if ($e = x_bad($c)) NO($e);
        $at = (int)($in['at'] ?? 0); $days = implode(',', array_values(array_intersect(array_keys(AD_DAYS), (array)($in['days'] ?? [])))); $tm = preg_match('/^\d{1,2}:\d{2}$/', en_d($f('tm', 5))) ? en_d($f('tm', 5)) : '';
        if ($at && ($at < time() - 3600 || $at > time() + 120 * 86400)) NO('تاریخ سفر باید از امروز تا چهار ماه آینده باشد.'); if (!$at && !$days && !$tm) NO('زمان سفر را بگویید: یک تاریخ، یا روزها و ساعت.');
        $seats = $role === 'driver' ? max(1, min(6, (int)($in['seats'] ?? 1))) : max(1, min(4, (int)($in['seats'] ?? 1)));
        $C = []; if ($aud === 'contacts') { foreach (array_slice((array)($in['contacts'] ?? []), 0, 300) as $ph) if ($n = phone_norm((string)$ph)) $C[] = chash($n); $C = array_values(array_unique($C)); if (!$C) NO('دست‌کم یک مخاطب انتخاب کنید یا آگهی را عمومی کنید.'); }
        $old = !empty($in['no']) ? ad_by_no((int)$in['no']) : null; if ($old && $old['user_id'] !== $me) NO('این آگهی مال شما نیست.', 403);
        if (!$old) { if ((int)q("SELECT COUNT(*) FROM ads WHERE user_id=? AND status IN ('live','pending','review') AND expires>?", [$me, time()])->fetchColumn() >= ad_limit($me)) NO(x_premium($me) ? 'حداکثر ۱۰ آگهی فعال.' : 'حداکثر ۳ آگهی فعال؛ آگهی قدیمی را ببندید یا با اشتراک تا ۱۰ آگهی داشته باشید.', 429);
            if (hit('adpost_' . $me, 86400) > 5) NO('امروز آگهی زیادی ثبت کردید؛ فردا دوباره.', 429); }
        $row = ['kind' => $kind, 'role' => $role, 'g' => $g, 'from_city' => $fc, 'from_area' => $fa, 'to_city' => $tc, 'to_area' => $ta, 'at' => $at, 'days' => $days, 'tm' => $tm, 'seats' => $seats, 'share' => $share];
        $title = ad_title($row); $exp = $at ? $at + 86400 : time() + (x_premium($me) ? 60 : 30) * 86400; $st = flag('ads_review') ? 'pending' : 'live';
        if ($old) { q('UPDATE ads SET kind=?, role=?, from_city=?, from_area=?, to_city=?, to_area=?, title=?, body=?, at=?, days=?, tm=?, seats=?, share=?, audience=?, contacts=?, status=?, updated=?, expires=? WHERE id=?',
            [$kind, $role, $fc, $fa, $tc, $ta, $title, $body, $at, $days, $tm, $seats, $share, $aud, json_encode($C), in_array($old['status'], ['hidden', 'removed'], true) ? $old['status'] : $st, time(), $exp, $old['id']]); YES(['no' => (int)$old['no']]); }
        for ($i = 0; $i < 4; $i++) { $no = 1001 + (int)q('SELECT COALESCE(MAX(no),1000) FROM ads')->fetchColumn() - 1000 + $i;
            try { q('INSERT INTO ads(id,no,user_id,kind,role,g,from_city,from_area,to_city,to_area,title,body,at,days,tm,seats,share,audience,contacts,status,pin_until,views,msgs,reports,bumped,created,updated,expires) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0,0,?,?,?,?)',
                [uid(), $no, $me, $kind, $role, $g, $fc, $fa, $tc, $ta, $title, $body, $at, $days, $tm, $seats, $share, $aud, json_encode($C), $st, time(), time(), time(), $exp]); break; } catch (Throwable $e) { if ($i === 3) throw $e; } }
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
        $NP = lv_places($pl); $ph = implode(',', array_fill(0, count($NP), '?'));
        foreach (rows("SELECT * FROM tgroups WHERE kind='leave' AND place_id IN ($ph) AND status='open' AND until>? ORDER BY at", [...array_keys($NP), time()]) as $gr) {
            if (tg_member($gr['id'], $me['id'])) { $mine[] = tg_out($gr, $me['id']); continue; }
            if ($gr['g'] !== $g) continue; $ow = row('SELECT * FROM profiles WHERE id=?', [$gr['owner']]); if (!$ow || in_array($ow['id'], (array)($d['blocked'] ?? []), true) || in_array($me['id'], (array)(pdata($ow)['blocked'] ?? []), true)) continue;
            $gap = lv_match($pl, $d, pdata($ow), $gr['place_id'] === $me['place_id']); if ($gap === null) continue;
            $o = tg_out($gr, $me['id']); $o['gap'] = $gap; $o['gap_t'] = km_t($gap); if ($gr['place_id'] !== $me['place_id']) $o['from_t'] = (string)(row('SELECT name FROM places WHERE id=?', [$gr['place_id']])['name'] ?? ''); $near[] = $o; }
        usort($near, fn($a, $b) => $a['gap'] <=> $b['gap']);
        YES(['on' => flag('leave_on'), 'allowed' => leave_allowed($u, $me), 'quota' => lv_quota($u, $me), 'dir' => (int)date('G') < 11 ? 'work' : 'home', 'place' => ['lat' => (float)$pl['lat'], 'lng' => (float)$pl['lng'], 'name' => $pl['name']], 'mine' => $mine, 'near' => array_slice($near, 0, 6), 'hear' => empty($d['leave_off'])]); }
    case 'leave_start': case 'leave_join': { if (!flag('leave_on')) NO('«دارم می‌روم» فعلاً خاموش است.', 403); $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? ''));
        if (!$me['complete'] || !in_array($me['kind'], LEAVE_KINDS, true) || !$me['place_id']) NO('«دارم می‌روم» برای مسیرک محل کار یا دانشگاه است.');
        lv_can($u, $me, ($in['dir'] ?? '') === 'work' ? 'work' : 'home');
        $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); $d = pdata($me); $g = (string)($d['pg'] ?? 'f');
        $dir = ($in['dir'] ?? '') === 'work' ? 'work' : 'home';
        $role = ($in['role'] ?? '') === 'car' ? 'car' : 'ride'; $seats = $role === 'car' ? max(1, min(4, (int)($in['seats'] ?? 3))) : max(1, min(3, (int)($in['seats'] ?? 1)));
        $from = $dir === 'home' ? [(float)$pl['lat'], (float)$pl['lng']] : [(float)($d['lat'] ?? 0), (float)($d['lng'] ?? 0)];
        $site = 0; if (isset($in['lat'], $in['lng']) && is_numeric($in['lat'])) $site = hav($from[0], $from[1], (float)$in['lat'], (float)$in['lng']) <= 600 ? 1 : 0;
        if (!$site && empty($in['confirm'])) NO($dir === 'home' ? 'به نظر در محل کار نیستید.' : 'به نظر در خانه نیستید.', 409, 'offsite');
        foreach (rows("SELECT g.id FROM tgroups g JOIN tg_members m ON m.group_id=g.id WHERE g.kind='leave' AND g.status='open' AND g.until>? AND m.profile_id=?", [time(), $me['id']]) as $x) q('DELETE FROM tg_members WHERE group_id=? AND profile_id=?', [$x['id'], $me['id']]);
        if ($a === 'leave_join') { $gr = row("SELECT * FROM tgroups WHERE id=? AND kind='leave'", [(string)($in['group'] ?? '')]); if (!$gr || $gr['status'] !== 'open' || (int)$gr['until'] < time() || !array_key_exists($gr['place_id'], lv_places($pl)) || $gr['g'] !== $g) NO('این گروه دیگر باز نیست.', 404);
            $ow = row('SELECT * FROM profiles WHERE id=?', [$gr['owner']]); if (!$ow || in_array($me['id'], (array)(pdata($ow)['blocked'] ?? []), true) || in_array($ow['id'], (array)($d['blocked'] ?? []), true)) NO('این گروه دیگر باز نیست.', 404); $dir = $gr['dir'] ?: 'home'; }
        else { if (hit('leave_' . $me['id'], 86400) > 6) NO('امروز چند بار اعلام رفتن کردید؛ اگر لازم است در گفتگوی گروه بنویسید.', 429);
            $at = time() + max(0, min(90, (int)($in['in_min'] ?? 0))) * 60; $gr = null; $bd = 1e12;
            foreach (rows("SELECT * FROM tgroups WHERE kind='leave' AND place_id=? AND g=? AND status='open' AND until>? AND ABS(at-?)<=1500 AND COALESCE(dir,'home')=?", [$me['place_id'], $g, time(), $at, $dir]) as $c) { $ow = row('SELECT * FROM profiles WHERE id=?', [$c['owner']]);
                if ($ow && same_way($pl, $d, pdata($ow))) { $dd = isset($d['lat']) ? hav((float)$d['lat'], (float)$d['lng'], (float)(pdata($ow)['lat'] ?? 0), (float)(pdata($ow)['lng'] ?? 0)) : 0; if ($dd < $bd) { $bd = $dd; $gr = $c; } } }
            if (!$gr) { $id = 'G' . uid(11); q('INSERT INTO tgroups(id,kind,ref,place_id,g,owner,title,at,until,status,created,dir) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', [$id, 'leave', $me['id'], $me['place_id'], $g, $me['id'], $dir === 'home' ? 'رفتن به خانه از ' . $pl['name'] : 'رفتن به ' . $pl['name'], $at, $at + 5400, 'open', time(), $dir]); $gr = row('SELECT * FROM tgroups WHERE id=?', [$id]); $new = true; } }
        q('INSERT INTO tg_members(group_id,profile_id,user_id,role,seats,at_site,created) VALUES(?,?,?,?,?,?,?)', [$gr['id'], $me['id'], $u['user_id'], $role, $seats, $site, time()]);
        $who = trim(($d['title'] ?? '') . ' ' . ($d['family'] ?? '')) ?: 'یک همکار'; $hood = (string)($d['hood'] ?? ''); $rt = $role === 'car' ? 'با ماشین و ' . fa_d($seats) . ' جای خالی' : 'بی‌ماشین';
        q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gr['id'], 'system', "$who $rt به گروه آمد" . ($hood ? " (سمت $hood)" : '') . '.', time()]);
        foreach (tg_members($gr['id']) as $m) if ($m['profile_id'] !== $me['id']) note($m['profile_id'], "$who هم ساعت " . hhmm((int)$gr['at']) . " می‌رود ($rt). در گروه هماهنگ شوید.", 'near', $gr['id']);
        // our own team chat hears it too (once per direction per day), so teammates who are not in the group still see it
        if (!empty($me['team_id']) && hit('lvteam_' . $me['id'] . $dir, 43200) <= 1) q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $me['team_id'], 'system', "🚪 $who ساعت " . hhmm((int)$gr['at']) . ($dir === 'home' ? ' به خانه می‌رود' : " به {$pl['name']} می‌آید") . " ($rt). هم‌مسیرید؟ از منو «دارم می‌روم» را بزنید.", time()]);
        /* who hears it: the COMPLEMENT of my car status (I drive → people without a car; I have none → people with a car), same gender,
           same direction, home close by (distance stated) — from my workplace and from neighbouring ones (≤1.5 km). Closest first. */
        if (!empty($new)) { $sent = 0; $sms = 0; $pushed = []; $NP = lv_places($pl); $ph = implode(',', array_fill(0, count($NP), '?')); $C = [];
            foreach (rows("SELECT p.*, u.phone, u.fake ufake FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.place_id IN ($ph) AND p.complete=1 AND p.user_id<>? AND p.kind IN (?,?) LIMIT 1500", [...array_keys($NP), $u['user_id'], 'work', 'uni']) as $o) {
                $od = pdata($o); if (($od['pg'] ?? 'f') !== $g || !empty($od['leave_off']) || in_array($me['id'], (array)($od['blocked'] ?? []), true) || in_array($o['id'], (array)($d['blocked'] ?? []), true)) continue;
                $hasCar = ($od['role'] ?? 'pay') !== 'pay' && (int)($od['seats'] ?? 1) > 0; if ($role === 'car' ? $hasCar && ($od['role'] ?? '') === 'drive' : !$hasCar) continue;
                $gap = lv_match($pl, $d, $od, $o['place_id'] === $me['place_id']); if ($gap === null) continue; $o['_gap'] = $gap; $o['_od'] = $od; $C[] = $o; }
            usort($C, fn($a, $b) => $a['_gap'] <=> $b['_gap']);
            $need = $role === 'car' ? 'بی‌ماشین' : 'ماشین‌دار';
            foreach (array_slice($C, 0, 60) as $o) { $od = $o['_od']; $far = km_t($o['_gap']); $there = $o['place_id'] === $me['place_id'] ? $pl['name'] : $pl['name'] . ' (نزدیک محل شما)';
                $offer = $role === 'car' ? 'ماشین دارد و ' . fa_d($seats) . ' جا' : 'دنبال ماشین است';
                $txt = $dir === 'home' ? "$who ساعت " . hhmm((int)$gr['at']) . " از $there به خانه می‌رود؛ $offer. خانه‌اش حدود $far از خانه‌ی شماست. شما هم می‌روید؟" : "$who ساعت " . hhmm((int)$gr['at']) . " از خانه به $there می‌آید؛ $offer. خانه‌اش حدود $far از خانه‌ی شماست. شما هم می‌آیید؟";
                note($o['id'], $txt, 'near', $gr['id']); $sent++;
                if (count($pushed) < 40 && !isset($pushed[$o['user_id']]) && hit('lvpush_' . $o['user_id'], 3600) <= 3) { $pushed[$o['user_id']] = 1; push_queue([$o['user_id']], $role === 'car' ? '🚗 جای خالی تا نزدیک خانه‌تان' : '🙋 همکاری دنبال ماشین است', mb_substr($txt, 0, 150), 'near'); }
                if ($sms < 10 && !(int)$o['ufake'] && $o['phone'] && ($od['leave_sms'] ?? 1) && flag('sms_direct') && sms_ready() && x_premium($o['user_id']) && hit('lvsms_' . $o['user_id'], 86400) <= 3) { try { kave_send($o['phone'], ($dir === 'home' ? "همکاری از {$pl['name']} ساعت " . hhmm((int)$gr['at']) . ' به سمت ' . ($hood ?: 'خانه') . ' می‌رود.' : 'همکاری ساعت ' . hhmm((int)$gr['at']) . ' از سمت ' . ($hood ?: 'خانه') . " به {$pl['name']} می‌آید.") . "\nهم‌مسیر شوید: residim.ir", 'leave', $u['user_id']); $sms++; } catch (Throwable $e) {} }
            }
            ev_log('leave', "🚪 «دارم می‌روم» در {$pl['name']}: $sent نفر $need باخبر شدند (" . count($pushed) . ' اعلان)', []); }
        lv_take($u, $me, $dir); YES(['group' => tg_out(row('SELECT * FROM tgroups WHERE id=?', [$gr['id']]), $me['id']), 'quota' => lv_quota($u, $me)]); }
    case 'leave_pref': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $d = pdata($me); $d['leave_off'] = empty($in['on']) ? 1 : 0;
        q('UPDATE profiles SET data=?, updated=? WHERE id=?', [json_encode($d, JSON_UNESCAPED_UNICODE), time(), $me['id']]); YES(['on' => !$d['leave_off']]); }
    case 'leave_quit': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $gr = row('SELECT * FROM tgroups WHERE id=?', [(string)($in['group'] ?? '')]); if (!$gr || !tg_member($gr['id'], $me['id'])) NO('گروه پیدا نشد.', 404);
        q('DELETE FROM tg_members WHERE group_id=? AND profile_id=?', [$gr['id'], $me['id']]); $left = tg_members($gr['id']);
        if (!$left || !empty($in['done'])) q("UPDATE tgroups SET status='closed' WHERE id=?", [$gr['id']]); elseif ($gr['owner'] === $me['id']) q('UPDATE tgroups SET owner=? WHERE id=?', [$left[0]['profile_id'], $gr['id']]);
        if ($left && empty($in['done'])) q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gr['id'], 'system', 'یک نفر از گروه رفت.', time()]); YES(); }
    case 'tg_chat': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $gr = row('SELECT * FROM tgroups WHERE id=?', [(string)($in['group'] ?? '')]); if (!$gr || !tg_member($gr['id'], $me['id'])) NO('گروه پیدا نشد.', 404);
        $t = s1((string)($in['text'] ?? ''), 400);
        if ($t !== '') { if ($gr['status'] !== 'open' && $gr['kind'] === 'leave') NO('گروه بسته شده است.'); $last = (int)q('SELECT COALESCE(MAX(created),0) FROM msgs WHERE profile_id=?', [$me['id']])->fetchColumn(); if (time() - $last < 2) NO('کمی آرام‌تر 🙂', 429);
            if ($e = x_bad($t, true)) NO($e); q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $gr['id'], $me['id'], $t, time()]);
            $d = pdata($me); $who = trim(($d['title'] ?? '') . ' ' . ($d['family'] ?? '')); foreach (tg_members($gr['id']) as $m) if ($m['profile_id'] !== $me['id']) push_queue(fam_users($m['profile_id']), $gr['title'], "$who: " . mb_substr($t, 0, 80), 'team'); }
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
            if (array_key_exists('rel', $in)) { $I['rel'] = in_array($in['rel'], ['mother', 'father', 'grandma', 'grandpa'], true) ? $in['rel'] : ''; unset($in['rel']); }
            if (array_key_exists('job', $in)) { $I['job'] = in_array($in['job'], ['teacher', 'cleric', 'academic', 'student', 'medic'], true) ? $in['job'] : ''; unset($in['job']); }
            if (array_key_exists('tcode', $in)) $I['tcode'] = substr(dg((string)$in['tcode']), 0, 12);
            if (array_key_exists('p3', $in)) $I['p3'] = substr(dg((string)$in['p3']), 0, 3);
            if (array_key_exists('pir', $in)) $I['pir'] = substr(dg((string)$in['pir']), 0, 2);
            if (isset($in['kids']) && is_array($in['kids'])) { $jy = (int)date('Y') - (date('md') >= '0321' ? 621 : 622); $I['kids'] = array_values(array_filter(array_map(fn($k) => ['first' => s1((string)($k['first'] ?? ''), 30), 'g' => in_array($k['g'] ?? '', ['f', 'm'], true) ? $k['g'] : '', 'by' => (($b = (int)dg((string)($k['by'] ?? ''))) >= $jy - 30 && $b <= $jy) ? $b : ''], array_slice($in['kids'], 0, 6)), fn($k) => $k['first'] !== '')); }
            foreach (['family' => 40, 'first' => 30, 'city' => 40, 'hood' => 60, 'car' => 40, 'color' => 20] as $k => $n) if (array_key_exists($k, $in)) { $v = $f($k, $n); if ($e = x_bad($v, true)) NO($e); $I[$k] = $v; }
            if (isset($in['lat'], $in['lng']) && is_numeric($in['lat']) && is_numeric($in['lng']) && abs((float)$in['lat']) <= 90) { $I['lat'] = round((float)$in['lat'], 5); $I['lng'] = round((float)$in['lng'], 5); }
            if (array_key_exists('seats', $in)) $I['seats'] = max(0, min(6, (int)$in['seats']));
            if (isset($in['routes']) && is_array($in['routes'])) $I['routes'] = array_values(array_filter(array_map(fn($r) => ['label' => s1((string)($r['label'] ?? ''), 40), 'from' => s1((string)($r['from'] ?? ''), 60), 'to' => s1((string)($r['to'] ?? ''), 60), 'tm' => preg_match('/^\d{1,2}:\d{2}$/', en_d((string)($r['tm'] ?? ''))) ? en_d((string)$r['tm']) : ''], array_slice($in['routes'], 0, 8)), fn($r) => $r['from'] || $r['to']));
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
