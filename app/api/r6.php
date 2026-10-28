<?php
/**
 * Residim v6 API — phase zero (places, profiles, matching, invites) + team daily use + admin.
 * Config lives in app/api/config.local.php (same file as Kavenegar). See config.example.php.
 * Storage: SQLite at app/storage/r6.sqlite by default; set 'r6_db' => 'mysql' to switch.
 */
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php'; // residim_config()

date_default_timezone_set('Asia/Tehran');
define('R6_MAIN', basename((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === 'r6.php');
if (R6_MAIN) { header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff'); }

/* ───────── config ───────── */
function C(string $k, $def = null) {
    static $c = null;
    if ($c === null) $c = array_replace([
        'r6_db' => 'sqlite',                 // 'sqlite' | 'mysql'
        'r6_mysql_dsn' => '',                // e.g. mysql:host=localhost;dbname=moteal_residim;charset=utf8mb4
        'r6_mysql_user' => '', 'r6_mysql_pass' => '',
        'neshan_service_key' => '',          // service.xxxxx  (server only: distance matrix + reverse geocode)
        'neshan_web_key' => '',              // web.xxxxx      (browser map; restrict to residim.ir in Neshan panel)
        'kavenegar_tpl_invite' => 'residim-invite',
        'kavenegar_tpl_arrived' => 'residim-arrived',
        'admin_user' => 'mot', 'admin_pass' => 'mot',
    ], residim_config());
    return $c[$k] ?? $def;
}
function J($d, int $s = 200): never { http_response_code($s); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function YES(array $d = []): never { J(['ok' => true] + $d); }
function NO(string $msg, int $s = 400, string $code = 'error'): never { J(['ok' => false, 'error' => $code, 'message' => $msg], $s); }

/* ───────── db ───────── */
const MYSQL_FILE = __DIR__ . '/../storage/mysql.local.php';
function mysql_cfg(): array { if (!is_file(MYSQL_FILE)) return []; $c = @include MYSQL_FILE; return is_array($c) ? $c : []; }
function mysql_save(array $c): void { $tmp = MYSQL_FILE . '.tmp'; file_put_contents($tmp, "<?php\n// written by the Residim admin panel; never served (storage/.htaccess denies all)\nreturn " . var_export($c, true) . ";\n"); @chmod($tmp, 0600); rename($tmp, MYSQL_FILE); }
function mysql_pdo(array $c): PDO {
    $dsn = 'mysql:host=' . ($c['host'] ?? 'localhost') . ';port=' . (int)($c['port'] ?? 3306) . ';dbname=' . ($c['name'] ?? '') . ';charset=utf8mb4';
    $p = new PDO($dsn, (string)($c['user'] ?? ''), (string)($c['pass'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_TIMEOUT => 8]);
    $p->exec("SET NAMES utf8mb4"); return $p;
}
function sqlite_pdo(): PDO { $dir = dirname(__DIR__) . '/storage'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
    $p = new PDO('sqlite:' . $dir . '/r6.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $p->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=4000'); return $p; }
const R6_TABLES = ['hits', 'live', 'settings', 'users', 'tokens', 'otps', 'places', 'profiles', 'teams', 'invites', 'trips', 'ledger', 'notes', 'dist', 'tickets', 'quiz', 'sms', 'msgs', 'place_flags'];
function db_engine(): string { $m = mysql_cfg(); return (C('r6_db') === 'mysql' || !empty($m['active'])) ? 'mysql' : 'sqlite'; }
function db6(): PDO {
    static $p = null; if ($p) return $p;
    $opt = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    $mc = mysql_cfg();
    if (!empty($mc['active']) && C('r6_db') !== 'mysql') { $p = mysql_pdo($mc); }
    elseif (C('r6_db') === 'mysql') {
        $p = new PDO(C('r6_mysql_dsn') ?: (string)C('db_dsn'), C('r6_mysql_user') ?: C('db_user'), C('r6_mysql_pass') ?: C('db_pass'), $opt);
        $p->exec("SET NAMES utf8mb4");
    } else {
        $dir = dirname(__DIR__) . '/storage'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
        $p = new PDO('sqlite:' . $dir . '/r6.sqlite', null, null, $opt);
        $p->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=4000');
    }
    schema($p);
    return $p;
}
function schema(PDO $p): void {
    $v = 0;
    try { $v = (int)$p->query("SELECT v FROM settings WHERE k='schema'")->fetchColumn(); } catch (Throwable $e) {}
    if ($v >= 7) return;
    $K = 'VARCHAR(40)';
    $sql = [
        "CREATE TABLE IF NOT EXISTS settings (k VARCHAR(40) PRIMARY KEY, v TEXT)",
        "CREATE TABLE IF NOT EXISTS users (id $K PRIMARY KEY, phone VARCHAR(16) UNIQUE, fake INT DEFAULT 0, created INT)",
        "CREATE TABLE IF NOT EXISTS tokens (token VARCHAR(80) PRIMARY KEY, user_id $K, admin INT DEFAULT 0, created INT)",
        "CREATE TABLE IF NOT EXISTS otps (phone VARCHAR(16) PRIMARY KEY, hash VARCHAR(100), exp INT, tries INT, sent INT, hour_count INT, hour_start INT)",
        "CREATE TABLE IF NOT EXISTS places (id $K PRIMARY KEY, code VARCHAR(12) UNIQUE, kind VARCHAR(16), name VARCHAR(160), city VARCHAR(60), gender VARCHAR(4), shift VARCHAR(40), lat DOUBLE, lng DOUBLE, t_in VARCHAR(5), t_out VARCHAR(5), days VARCHAR(40), created_by $K, verified INT DEFAULT 0, fake INT DEFAULT 0, created INT)",
        "CREATE TABLE IF NOT EXISTS profiles (id $K PRIMARY KEY, user_id $K, place_id $K, label VARCHAR(80), kind VARCHAR(16), color INT, data TEXT, step INT DEFAULT 0, complete INT DEFAULT 0, team_id $K, fake INT DEFAULT 0, created INT, updated INT)",
        "CREATE TABLE IF NOT EXISTS teams (id $K PRIMARY KEY, place_id $K, no INT, hood VARCHAR(60), color INT, coord $K, price INT, prize VARCHAR(160), premium INT DEFAULT 0, created INT)",
        "CREATE TABLE IF NOT EXISTS invites (id $K PRIMARY KEY, from_p $K, to_p $K, status VARCHAR(12), created INT, responded INT)",
        "CREATE TABLE IF NOT EXISTS trips (id VARCHAR(80) PRIMARY KEY, team_id $K, wk VARCHAR(10), slot VARCHAR(10), status VARCHAR(10), exec $K, arr TEXT, `empty` INT DEFAULT 0, thanks INT DEFAULT 0, updated INT)",
        "CREATE TABLE IF NOT EXISTS ledger (id $K PRIMARY KEY, team_id $K, kind VARCHAR(8), ref VARCHAR(80), text VARCHAR(255), d TEXT, created INT)",
        "CREATE TABLE IF NOT EXISTS notes (id $K PRIMARY KEY, profile_id $K, text VARCHAR(255), kind VARCHAR(16), ref $K, rd INT DEFAULT 0, created INT)",
        "CREATE TABLE IF NOT EXISTS dist (k VARCHAR(64) PRIMARY KEY, m INT, s INT, src VARCHAR(8), created INT)",
        "CREATE TABLE IF NOT EXISTS tickets (id $K PRIMARY KEY, no INT, user_id $K, profile_id $K, cat VARCHAR(30), text TEXT, status VARCHAR(16), reply TEXT, created INT, updated INT)",
        "CREATE TABLE IF NOT EXISTS quiz (id $K PRIMARY KEY, profile_id $K, team_id $K, place_id $K, day VARCHAR(10), qid VARCHAR(10), ok INT, created INT)",
        "CREATE TABLE IF NOT EXISTS sms (id $K PRIMARY KEY, phone VARCHAR(16), tpl VARCHAR(40), status VARCHAR(160), by_user $K, created INT)",
        "CREATE TABLE IF NOT EXISTS msgs (id $K PRIMARY KEY, team_id $K, profile_id $K, text VARCHAR(500), created INT)",
    ];
    $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    foreach ($sql as $s) $p->exec($my ? $s . ' DEFAULT CHARSET=utf8mb4' : $s);
    foreach (['CREATE INDEX ix_prof_place ON profiles(place_id)', 'CREATE INDEX ix_prof_user ON profiles(user_id)', 'CREATE INDEX ix_inv_to ON invites(to_p)', 'CREATE INDEX ix_notes_p ON notes(profile_id)', 'CREATE INDEX ix_trips_t ON trips(team_id)', 'CREATE INDEX ix_ledger_t ON ledger(team_id)'] as $s) { try { $p->exec($s); } catch (Throwable $e) {} }
    try { $p->exec('CREATE INDEX ix_msgs_t ON msgs(team_id)'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE users ADD COLUMN premium_until INT DEFAULT 0'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE places ADD COLUMN nv INT DEFAULT 0'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE places ADD COLUMN nv_title VARCHAR(160)'); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS place_flags (place_id VARCHAR(40), user_id VARCHAR(40), created INT, PRIMARY KEY(place_id, user_id))'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE places ADD COLUMN t_in2 VARCHAR(5)'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE places ADD COLUMN t_out2 VARCHAR(5)'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE tickets ADD COLUMN name VARCHAR(80)'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE tickets ADD COLUMN contact VARCHAR(120)'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE tickets ADD COLUMN seen INT DEFAULT 0'); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS hits (k VARCHAR(80) PRIMARY KEY, n INT, exp INT)'); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS live (team_id VARCHAR(40) PRIMARY KEY, profile_id VARCHAR(40), lat DOUBLE, lng DOUBLE, acc INT, at INT)'); } catch (Throwable $e) {}
    setv('schema', '7', $p);
    foreach (['sms_invite' => '1', 'sms_arrive' => '0', 'auto_arrive' => '1', 'test_tools' => '1', 'signup_open' => '1', 'otp_dev' => '0', 'sms_direct' => '1', 'league_on' => '0', 'paid_mode' => '0', 'station_on' => '1', 'map_provider' => 'neshan', 'sub_price' => '297000', 'free_permanent' => '1', 'free_temp_month' => '2'] as $k => $val) if (getv($k, null, $p) === null) setv($k, $val, $p);
}
function q(string $sql, array $a = []): PDOStatement { $s = db6()->prepare($sql); $s->execute($a); return $s; }
function row(string $sql, array $a = []): ?array { $r = q($sql, $a)->fetch(); return $r ?: null; }
function rows(string $sql, array $a = []): array { return q($sql, $a)->fetchAll(); }
function getv(string $k, $def = null, ?PDO $p = null) { $s = ($p ?: db6())->prepare('SELECT v FROM settings WHERE k=?'); $s->execute([$k]); $v = $s->fetchColumn(); return $v === false ? $def : $v; }
function setv(string $k, string $v, ?PDO $p = null): void {
    $p = $p ?: db6(); $s = $p->prepare('UPDATE settings SET v=? WHERE k=?'); $s->execute([$v, $k]);
    if (!$s->rowCount()) { $c = $p->prepare('SELECT 1 FROM settings WHERE k=?'); $c->execute([$k]); if (!$c->fetchColumn()) $p->prepare('INSERT INTO settings(k,v) VALUES(?,?)')->execute([$k, $v]); }
}
function flag(string $k): bool { return getv($k, '0') === '1'; }
function uid(int $n = 12): string { $a = 'abcdefghijkmnpqrstuvwxyz23456789'; $o = ''; for ($i = 0; $i < $n; $i++) $o .= $a[random_int(0, strlen($a) - 1)]; return $o; }
function code8(): string { $a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; do { $o = ''; for ($i = 0; $i < 8; $i++) $o .= $a[random_int(0, strlen($a) - 1)]; } while (row('SELECT 1 FROM places WHERE code=?', [$o])); return $o; }

/* ───────── utils ───────── */
function hav(float $a, float $b, float $c, float $d): float { $r = 6371000; $t = M_PI / 180; $x = sin(($c - $a) * $t / 2) ** 2 + cos($a * $t) * cos($c * $t) * sin(($d - $b) * $t / 2) ** 2; return 2 * $r * asin(min(1, sqrt($x))); }
function g2j(int $gy, int $gm, int $gd): array { // Gregorian -> Jalali
    $g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    $gy2 = ($gm > 2) ? ($gy + 1) : $gy;
    $days = 355666 + (365 * $gy) + intdiv($gy2 + 3, 4) - intdiv($gy2 + 99, 100) + intdiv($gy2 + 399, 400) + $gd + $g_d_m[$gm - 1];
    $jy = -1595 + (33 * intdiv($days, 12053)); $days %= 12053; $jy += 4 * intdiv($days, 1461); $days %= 1461;
    if ($days > 365) { $jy += intdiv($days - 1, 365); $days = ($days - 1) % 365; }
    $jm = ($days < 186) ? 1 + intdiv($days, 31) : 7 + intdiv($days - 186, 30);
    $jd = 1 + (($days < 186) ? ($days % 31) : (($days - 186) % 30));
    return [$jy, $jm, $jd];
}
function jyear(): int { return g2j((int)date('Y'), (int)date('n'), (int)date('j'))[0]; }
function week_key(): string { return date('o-W', time() + 2 * 86400); } // Saturday-start weeks
function phone_norm(string $p): string {
    $p = strtr($p, ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9','٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9']);
    $p = preg_replace('/\D/', '', $p);
    if (str_starts_with($p, '0098')) $p = '0' . substr($p, 4); elseif (str_starts_with($p, '98') && strlen($p) === 12) $p = '0' . substr($p, 2); elseif (str_starts_with($p, '9') && strlen($p) === 10) $p = '0' . $p;
    return preg_match('/^09\d{9}$/', $p) ? $p : '';
}
function pdata(array $p): array { $d = json_decode((string)$p['data'], true); return is_array($d) ? $d : []; }
function riders_of(array $p): array { // kids for child-kinds, the member themself otherwise
    $d = pdata($p);
    if (!empty($d['kids'])) return array_map(fn($k) => ['id' => $k['id'] ?? '', 'g' => $k['g'] ?? 'f', 'age' => isset($k['by']) ? max(0, jyear() - (int)$k['by']) : null, 'first' => $k['first'] ?? ''], $d['kids']);
    return [['id' => $p['id'] . '-s', 'g' => $d['pg'] ?? 'f', 'age' => 30, 'first' => '']];
}
const TEMP_KINDS = ['station'];
function team_rule_ok(?array $place, array $riders): bool {
    if ($place && in_array($place['kind'], TEMP_KINDS, true)) { $g = array_unique(array_column($riders, 'g')); return count($g) <= 1; }
    return gender_age_ok($riders);
}
function is_premium(?string $uid): bool { if (!$uid) return false; $u = row('SELECT premium_until FROM users WHERE id=?', [$uid]); return $u && (int)($u['premium_until'] ?? 0) > time(); }
/** Platform rule: girls over 8 and boys over 12 never share a service with the opposite gender. */
function gender_age_ok(array $ridersAll): bool {
    $girls = array_filter($ridersAll, fn($r) => $r['g'] === 'f'); $boys = array_filter($ridersAll, fn($r) => $r['g'] === 'm');
    if (!$girls || !$boys) return true;
    foreach ($girls as $g) if ($g['age'] === null || $g['age'] > 8) return false;
    foreach ($boys as $b) if ($b['age'] === null || $b['age'] > 12) return false;
    return true;
}

/* ───────── external services ───────── */
function http_get(string $url, array $headers = [], int $timeout = 8): ?array {
    if (!function_exists('curl_init')) return null;
    $ch = curl_init($url); curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_HTTPHEADER => $headers]);
    $b = curl_exec($ch); $s = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($b === false || $s < 200 || $s >= 300) return null;
    $j = json_decode((string)$b, true); return is_array($j) ? $j : null;
}
function http_raw(string $url, int $timeout = 12): array {
    if (!function_exists('curl_init')) return [0, 'curl-missing'];
    $ch = curl_init($url); curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 6]);
    $b = curl_exec($ch); $s = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
    return [$s, $b === false ? ('curl: ' . $err) : (string)$b];
}
const KAVE_CODES = [400 => 'پارامترها ناقص است', 401 => 'حساب غیرفعال است', 402 => 'عملیات ناموفق', 403 => 'کلید API نامعتبر است', 404 => 'متد پیدا نشد', 405 => 'نوع درخواست نادرست', 406 => 'پارامتر اجباری خالی است', 407 => 'دسترسی به این اطلاعات مجاز نیست', 409 => 'خطای سرور کاوه‌نگار', 411 => 'شماره‌ی گیرنده نامعتبر است', 412 => 'خط ارسال‌کننده نامعتبر است', 413 => 'متن خالی یا بلند است', 414 => 'تعداد گیرنده‌ها زیاد است', 416 => 'IP سرور در تنظیمات API مجاز نیست', 417 => 'تاریخ نامعتبر', 418 => 'اعتبار حساب کافی نیست', 419 => 'طول آرایه‌ها یکسان نیست', 420 => 'استفاده از لینک در متن محدود شده است', 422 => 'کاراکتر نامعتبر در متن', 424 => 'الگو (template) پیدا نشد یا تأیید نشده', 426 => 'این متد به پلن پیشرفته نیاز دارد', 427 => 'محدودیت ارسال روی این خط', 428 => 'ارسال کد با تماس ممکن نیست', 429 => 'ارسال با این خط مجاز نیست', 431 => 'ساختار توکن نادرست است (فاصله یا خط جدید)', 432 => 'پارامتر توکن در متن الگو نیست', 451 => 'درخواست تکراری یا زیاد', 501 => 'حساب آزمایشی: فقط به شماره‌ی صاحب حساب'];
function neshan(string $path, array $qs): ?array { $k = C('neshan_service_key'); if (!$k) return null; return http_get('https://api.neshan.org' . $path . '?' . http_build_query($qs), ['Api-Key: ' . $k]); }
function dkey(float $a, float $b, float $c, float $d): string { $x = sprintf('%.4f,%.4f', $a, $b); $y = sprintf('%.4f,%.4f', $c, $d); return strcmp($x, $y) < 0 ? "$x|$y" : "$y|$x"; }
/** Road distances from one origin to many points (Neshan matrix, cached; fallback straight×1.3). */
function road_many(float $lat, float $lng, array $pts): array {
    $out = []; $need = [];
    foreach ($pts as $i => [$la, $ln]) {
        $k = dkey($lat, $lng, $la, $ln); $c = row('SELECT m,s,src FROM dist WHERE k=?', [$k]);
        if ($c) $out[$i] = ['m' => (int)$c['m'], 's' => (int)$c['s'], 'src' => $c['src']]; else $need[$i] = [$la, $ln, $k];
    }
    foreach (array_chunk($need, 20, true) as $chunk) {
        $res = neshan('/v1/distance-matrix', ['type' => 'car', 'origins' => "$lat,$lng", 'destinations' => implode('|', array_map(fn($p) => $p[0] . ',' . $p[1], $chunk))]);
        $els = $res['rows'][0]['elements'] ?? null; $j = 0;
        foreach ($chunk as $i => [$la, $ln, $k]) {
            $e = is_array($els) ? ($els[$j] ?? null) : null; $j++;
            if ($e && isset($e['distance']['value'])) { $m = (int)$e['distance']['value']; $s = (int)($e['duration']['value'] ?? $m / 7); $src = 'road'; }
            else { $m = (int)round(hav($lat, $lng, $la, $ln) * 1.3); $s = (int)round($m / 6.5); $src = 'est'; }
            $out[$i] = ['m' => $m, 's' => $s, 'src' => $src];
            if ($src === 'road') { try { q('INSERT INTO dist(k,m,s,src,created) VALUES(?,?,?,?,?)', [$k, $m, $s, $src, time()]); } catch (Throwable $e2) {} }
        }
    }
    return $out;
}
/** Kavenegar verify/lookup. Returns ['ok'=>bool,'code'=>int,'msg'=>string]. Every attempt (and the provider's reason) is logged. */
/** Dispatcher: with flag sms_direct, plain sms/send (no approved template needed); otherwise verify/lookup. */
function kave(string $phone, string $tpl, array $tokens, ?string $by = null, string $type = 'sms'): array {
    if ($type !== 'call' && flag('sms_direct')) return kave_send($phone, sms_text($tpl, $tokens), $tpl, $by);
    return kave_lookup($phone, $tpl, $tokens, $by, $type);
}
function sms_text(string $tpl, array $t): string {
    $g = fn($k) => (string)($t[$k] ?? '');
    if ($tpl === C('kavenegar_tpl_invite')) return 'خانواده ' . $g('token10') . ' پیشنهاد هم‌مسیری برای ' . $g('token20') . " داده‌اند.\nدیدن و پاسخ: residim.ir/" . $g('token');
    if ($tpl === C('kavenegar_tpl_arrived')) return $g('token10') . ' ساعت ' . $g('token') . ' به ' . $g('token20') . ' رسید. راننده: خانواده ' . $g('token2') . "\nرسیدیم";
    return 'کد ورود رسیدیم: ' . $g('token') . "\nاین کد را به کسی ندهید.\n\n@residim.ir #" . $g('token');
}
/** Sender line: config, then admin setting, then the account's default line from Kavenegar (cached a day). Error 412 = invalid sender. */
function kave_sender(string $key): string {
    $s = (string)(C('kavenegar_sender', '') ?: getv('kave_sender', '')); if ($s !== '') return $s;
    $c = (string)getv('kave_sender_auto', ''); if ($c !== '' && (int)getv('kave_sender_at', '0') > time() - 86400) return $c;
    [$h, $b] = http_raw('https://api.kavenegar.com/v1/' . rawurlencode($key) . '/account/config.json'); $j = json_decode($b, true);
    $d = (string)($j['entries']['defaultsender'] ?? ''); setv('kave_sender_auto', $d); setv('kave_sender_at', (string)time()); return $d;
}
function kave_send(string $phone, string $text, string $tpl, ?string $by = null): array {
    $key = (string)C('kavenegar_api_key'); $res = ['ok' => false, 'code' => 0, 'msg' => 'skipped'];
    if ($key && $key !== 'PUT_KEY_HERE' && $phone && !str_starts_with($phone, '0900')) {
        $qs = ['receptor' => $phone, 'message' => $text]; $snd = kave_sender($key); if ($snd !== '') $qs['sender'] = $snd;
        [$http, $body] = http_raw('https://api.kavenegar.com/v1/' . rawurlencode($key) . '/sms/send.json?' . http_build_query($qs));
        $j = json_decode($body, true); $st = (int)($j['return']['status'] ?? $http);
        $res = ['ok' => $st === 200, 'code' => $st, 'msg' => $st === 200 ? 'sent' : (KAVE_CODES[$st] ?? ((string)($j['return']['message'] ?? '') ?: ($http ? 'HTTP ' . $http : mb_substr($body, 0, 120))))];
    }
    try { q('INSERT INTO sms(id,phone,tpl,status,by_user,created) VALUES(?,?,?,?,?,?)', [uid(), $phone, $tpl . ' (مستقیم)', $res['ok'] ? 'sent' : ('err ' . $res['code'] . ': ' . $res['msg']), $by, time()]); } catch (Throwable $e) {}
    return $res;
}
function kave_lookup(string $phone, string $tpl, array $tokens, ?string $by = null, string $type = 'sms'): array {
    $key = (string)C('kavenegar_api_key'); $res = ['ok' => false, 'code' => 0, 'msg' => 'skipped'];
    if ($key && $key !== 'PUT_KEY_HERE' && $phone && !str_starts_with($phone, '0900')) {
        $qs = ['receptor' => $phone, 'template' => $tpl] + $tokens; if ($type === 'call') $qs['type'] = 'call';
        [$http, $body] = http_raw('https://api.kavenegar.com/v1/' . rawurlencode($key) . '/verify/lookup.json?' . http_build_query($qs));
        $j = json_decode($body, true); $st = (int)($j['return']['status'] ?? $http);
        $res = ['ok' => $st === 200, 'code' => $st, 'msg' => $st === 200 ? 'sent' : (KAVE_CODES[$st] ?? ((string)($j['return']['message'] ?? '') ?: ($http ? 'HTTP ' . $http : mb_substr($body, 0, 120))))];
    }
    try { q('INSERT INTO sms(id,phone,tpl,status,by_user,created) VALUES(?,?,?,?,?,?)', [uid(), $phone, $tpl . ($type === 'call' ? ' (تماس)' : ''), $res['ok'] ? 'sent' : ('err ' . $res['code'] . ': ' . $res['msg']), $by, time()]); } catch (Throwable $e) {}
    return $res;
}
function sms_lookup(string $phone, string $tpl, array $tokens, ?string $by = null): string { $r = kave($phone, $tpl, $tokens, $by); return $r['ok'] ? 'sent' : ($r['msg'] === 'skipped' ? 'skipped' : 'failed'); }
function sms_token(string $s, int $maxSpaces): string { $s = trim(preg_replace('/\s+/u', ' ', $s)); $parts = explode(' ', $s); return implode(' ', array_slice($parts, 0, $maxSpaces + 1)); }

/* ───────── auth ───────── */
function auth(bool $required = true): ?array {
    $t = $_SERVER['HTTP_X_TOKEN'] ?? ''; if (!$t) { if ($required) NO('ابتدا وارد شوید.', 401, 'auth'); return null; }
    $r = row('SELECT t.*, u.phone, u.fake FROM tokens t LEFT JOIN users u ON u.id=t.user_id WHERE t.token=?', [hash('sha256', $t)]);
    if (!$r) { if ($required) NO('نشست شما تمام شده؛ دوباره وارد شوید.', 401, 'auth'); return null; }
    return $r;
}
/** Rate counter: returns how many times $k was hit inside its window (window starts on the first hit). */
function hit(string $k, int $ttl): int { $now = time(); $k = substr($k, 0, 80);
    if (random_int(1, 50) === 1) q('DELETE FROM hits WHERE exp<?', [$now]);
    $r = row('SELECT n,exp FROM hits WHERE k=?', [$k]);
    if (!$r || (int)$r['exp'] < $now) { q('DELETE FROM hits WHERE k=?', [$k]); q('INSERT INTO hits(k,n,exp) VALUES(?,?,?)', [$k, 1, $now + $ttl]); return 1; }
    q('UPDATE hits SET n=n+1 WHERE k=?', [$k]); return (int)$r['n'] + 1; }
function ip_tag(): string { return substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'r6'), 0, 16); }
function need_admin(): array { $a = auth(); if (!(int)$a['admin']) NO('دسترسی مدیر لازم است.', 403, 'admin'); return $a; }
function issue_token(?string $uid, int $admin = 0): string { $t = bin2hex(random_bytes(24)); q('INSERT INTO tokens(token,user_id,admin,created) VALUES(?,?,?,?)', [hash('sha256', $t), $uid, $admin, time()]); return $t; }
function my_profile(array $u, string $pid): array { $p = row('SELECT * FROM profiles WHERE id=? AND user_id=?', [$pid, $u['user_id']]); if (!$p) NO('این مسیرک پیدا نشد.', 404, 'profile'); return $p; }

/* ───────── shaping ───────── */
/** Does Neshan's map know a place with this name right here? Marks places.nv (map-backed confirmation). */
function pname_norm(string $s): string { $s = str_replace(['ي', 'ك', '‌', 'ـ'], ['ی', 'ک', ' ', ''], $s);
    $s = preg_replace('/(دبستان|دبیرستان|مدرسه|پیش ?دبستانی|مهد ?کودک|آموزشگاه|باشگاه|ورزشگاه|دانشگاه|شرکت|ایستگاه|راه ?آهن|فرودگاه|پایانه|ترمینال|دخترانه|پسرانه|غیر ?دولتی|دولتی|نمونه|شماره|شهید)/u', ' ', $s);
    return trim(preg_replace('/\s+/u', ' ', $s)); }
function neshan_check(array $pl): array {
    $r = neshan('/v1/search', ['term' => $pl['name'], 'lat' => $pl['lat'], 'lng' => $pl['lng']]); if (!$r || empty($r['items'])) return ['ok' => false, 'why' => $r === null ? 'no-key-or-network' : 'not-found'];
    $want = pname_norm((string)$pl['name']); $best = null;
    foreach ($r['items'] as $it) { $x = (float)($it['location']['x'] ?? 0); $y = (float)($it['location']['y'] ?? 0); if (!$x) continue; $d = hav((float)$pl['lat'], (float)$pl['lng'], $y, $x); if ($d > 400) continue;
        $t = pname_norm((string)($it['title'] ?? '')); if ($want === '' || $t === '') continue;
        $hit = mb_strpos($t, $want) !== false || mb_strpos($want, $t) !== false; if (!$hit) { $wa = array_filter(explode(' ', $want), fn($w) => mb_strlen($w) > 2); $hit = $wa && count(array_filter($wa, fn($w) => mb_strpos($t, $w) !== false)) >= max(1, (int)ceil(count($wa) * .6)); }
        if ($hit && (!$best || $d < $best[0])) $best = [$d, (string)$it['title']]; }
    if (!$best) return ['ok' => false, 'why' => 'not-near'];
    q('UPDATE places SET nv=1, nv_title=? WHERE id=?', [mb_substr($best[1], 0, 150), $pl['id']]); return ['ok' => true, 'title' => $best[1], 'm' => (int)$best[0]];
}
function place_out(array $p, bool $counts = true): array {
    $o = ['id' => $p['id'], 'code' => $p['code'], 'kind' => $p['kind'], 'name' => $p['name'], 'city' => $p['city'], 'gender' => $p['gender'], 'shift' => $p['shift'],
        'lat' => (float)$p['lat'], 'lng' => (float)$p['lng'], 'in' => $p['t_in'], 'out' => $p['t_out'], 'days' => array_map('intval', array_filter(explode(',', (string)$p['days']), 'strlen')), 'verified' => (int)$p['verified'], 'nv' => (int)($p['nv'] ?? 0), 'nv_title' => (string)($p['nv_title'] ?? ''), 'in2' => (string)($p['t_in2'] ?? ''), 'out2' => (string)($p['t_out2'] ?? ''), 'rot' => mb_strpos((string)$p['shift'], 'چرخشی') !== false];
    if ($counts) {
        $o['families'] = (int)q('SELECT COUNT(*) FROM profiles WHERE place_id=? AND complete=1', [$p['id']])->fetchColumn();
        $o['drivers'] = 0; foreach (rows('SELECT data FROM profiles WHERE place_id=? AND complete=1', [$p['id']]) as $r) { $d = json_decode((string)$r['data'], true); if (in_array($d['role'] ?? '', ['drive', 'both'], true)) $o['drivers']++; }
        $o['teams'] = (int)q('SELECT COUNT(*) FROM teams WHERE place_id=?', [$p['id']])->fetchColumn();
        $o['flags'] = (int)q('SELECT COUNT(*) FROM place_flags WHERE place_id=?', [$p['id']])->fetchColumn();
    }
    return $o;
}
function team_out(?array $t): ?array { return $t ? ['id' => $t['id'], 'no' => (int)$t['no'], 'hood' => $t['hood'], 'color' => (int)$t['color'], 'coord' => $t['coord'], 'price' => (int)$t['price'], 'prize' => $t['prize'], 'premium' => (int)$t['premium']] : null; }
function profile_out(array $p): array {
    $t = $p['team_id'] ? row('SELECT * FROM teams WHERE id=?', [$p['team_id']]) : null; $pl = $p['place_id'] ? row('SELECT * FROM places WHERE id=?', [$p['place_id']]) : null;
    return ['id' => $p['id'], 'label' => $p['label'], 'kind' => $p['kind'], 'color' => (int)$p['color'], 'data' => pdata($p), 'step' => (int)$p['step'], 'complete' => (int)$p['complete'], 'place' => $pl ? place_out($pl) : null, 'team' => team_out($t)];
}
function public_member(array $p, bool $mate, ?array $me = null, bool $viewerVerified = true): array {
    $d = pdata($p); $exact = $mate;
    $lat = (float)($d['lat'] ?? 0); $lng = (float)($d['lng'] ?? 0);
    if (!$exact) { $lat = round($lat / 0.0013) * 0.0013; $lng = round($lng / 0.0016) * 0.0016; }
    $t = $p['team_id'] ? row('SELECT * FROM teams WHERE id=?', [$p['team_id']]) : null;
    $u = row('SELECT phone,fake FROM users WHERE id=?', [$p['user_id']]); $verified = $u && ($u['phone'] || (int)$u['fake']);
    $phone = null; if ($viewerVerified && ($mate || !empty($d['phone_show']))) $phone = $u ? ($u['fake'] ? null : $u['phone']) : null;
    return ['id' => $p['id'], 'family' => $d['family'] ?? '', 'title' => $d['title'] ?? '', 'pg' => $d['pg'] ?? 'f', 'role' => $d['role'] ?? 'pay', 'seats' => (int)($d['seats'] ?? 0), 'days' => $d['days'] ?? [],
        'needs' => $d['needs'] ?? ['out' => true, 'back' => true], 'values' => $d['values'] ?? [], 'hood' => $d['hood'] ?? '', 'lat' => $lat, 'lng' => $lng, 'exact' => $exact, 'snapp' => (int)($d['snapp'] ?? 0),
        'kids' => array_map(fn($r) => ['g' => $r['g'], 'age' => $r['age']] + ($mate ? ['first' => $r['first'], 'id' => $r['id']] : []), riders_of($p)),
        'phone' => $phone, 'phone_hidden' => !$phone, 'verified' => (bool)$verified, 'contact' => $d['contact'] ?? (!empty($d['phone_show']) ? 'phone' : 'app'), 'pickup' => $d['pickup'] ?? '', 'rel' => $d['rel'] ?? '', 'arrive' => $d['arrive'] ?? '', 'free_ride' => !empty($d['free_ride']), 'card' => $mate ? (string)($d['card'] ?? '') : '', 'dest_name' => $mate ? (string)($d['hood'] ?? '') : '', 'fake' => (int)$p['fake'], 'team' => team_out($t)];
}

/* ───────── teams ───────── */
function fair_price(string $tid): int {
    $s = []; foreach (rows('SELECT data FROM profiles WHERE team_id=?', [$tid]) as $r) { $d = json_decode((string)$r['data'], true); if (!empty($d['snapp'])) $s[] = (int)$d['snapp']; }
    return $s ? max(20000, (int)(round(array_sum($s) / count($s) * 0.6 / 1000) * 1000)) : 60000;
}
function team_create(array $place, array $members): array {
    $no = (int)q('SELECT COALESCE(MAX(no),0) FROM teams WHERE place_id=?', [$place['id']])->fetchColumn() + 1;
    $hoods = []; foreach ($members as $m) { $h = trim((string)(pdata($m)['hood'] ?? '')); if ($h !== '') $hoods[$h] = ($hoods[$h] ?? 0) + 1; }
    arsort($hoods); $hood = $hoods ? array_key_first($hoods) : 'ما';
    $used = array_map('intval', array_column(rows('SELECT color FROM teams WHERE place_id=?', [$place['id']]), 'color'));
    $color = $no % 8; for ($i = 0; $i < 8 && in_array($color, $used, true); $i++) $color = ($color + 1) % 8;
    $id = uid(); q('INSERT INTO teams(id,place_id,no,hood,color,coord,price,prize,premium,created) VALUES(?,?,?,?,?,?,?,?,0,?)', [$id, $place['id'], $no, $hood, $color, $members[0]['id'], 60000, '', time()]);
    foreach ($members as $m) q('UPDATE profiles SET team_id=?, color=? WHERE id=?', [$id, $color, $m['id']]);
    q('UPDATE teams SET price=? WHERE id=?', [fair_price($id), $id]);
    return row('SELECT * FROM teams WHERE id=?', [$id]);
}
function team_join(array $t, array $p): void { q('UPDATE profiles SET team_id=?, color=? WHERE id=?', [$t['id'], (int)$t['color'], $p['id']]); q('UPDATE teams SET price=? WHERE id=?', [fair_price($t['id']), $t['id']]); }
function team_leave(array $p): string {
    if (!$p['team_id']) return 'none';
    $t = row('SELECT * FROM teams WHERE id=?', [$p['team_id']]); q('UPDATE profiles SET team_id=NULL WHERE id=?', [$p['id']]);
    $rest = rows('SELECT * FROM profiles WHERE team_id=? ORDER BY created', [$t['id']]);
    $d = pdata($p); $who = 'خانواده ' . ($d['family'] ?? '');
    if (count($rest) < 2) { foreach ($rest as $r) { q('UPDATE profiles SET team_id=NULL WHERE id=?', [$r['id']]); note($r['id'], "$who از تیم جدا شدند؛ تیم بسته شد. روی نقشه دوباره هم‌مسیر پیدا کنید.", 'team'); } q('DELETE FROM teams WHERE id=?', [$t['id']]); return 'closed'; }
    if ($t['coord'] === $p['id']) q('UPDATE teams SET coord=? WHERE id=?', [$rest[0]['id'], $t['id']]);
    q('UPDATE teams SET price=? WHERE id=?', [fair_price($t['id']), $t['id']]);
    foreach ($rest as $r) note($r['id'], "$who از تیم جدا شدند. برنامه‌ی هفته دوباره چیده می‌شود.", 'team');
    return 'left';
}
function note(string $pid, string $text, string $kind = 'info', ?string $ref = null): void { q('INSERT INTO notes(id,profile_id,text,kind,ref,rd,created) VALUES(?,?,?,?,?,0,?)', [uid(), $pid, mb_substr($text, 0, 250), $kind, $ref, time()]); }

/* ───────── fake data for testing ───────── */
const FAMS = ['آسمان','باران','دریا','کوه','نسیم','مهتاب','سپیده','کاج','البرز','نارون','سرو','ستاره','افرا','شبنم','رود','چنار','بهار','پرستو','آبشار','نیلوفر','صنوبر','گلبرگ','آفتاب','دشت'];
const GIRLS = ['نیلا','آوا','ترانه','هستی','رها','یاس','مهسا','نازنین','پریا','سارا','آیدا','باران','ثنا','کیانا'];
const BOYS = ['آرین','پارسا','سام','امیر','نیما','آرسام','بردیا','رادین','ایلیا','کیان','سینا','مهراد'];
const HOODS = ['نارون','گلستان','شهرک بهار','باغستان','سرو','لاله'];
function make_fake(array $me, array $place, bool $driver): string {
    $d0 = pdata($me); $lat0 = (float)($d0['lat'] ?? $place['lat']); $lng0 = (float)($d0['lng'] ?? $place['lng']);
    $r = 300 + random_int(0, 2200); $a = random_int(0, 359) * M_PI / 180;
    $lat = $lat0 + ($r * cos($a)) / 110570; $lng = $lng0 + ($r * sin($a)) / (111320 * cos($lat0 * M_PI / 180));
    $uidv = uid(); q('INSERT INTO users(id,phone,fake,created) VALUES(?,?,1,?)', [$uidv, '0900' . str_pad((string)random_int(0, 9999999), 7, '0', STR_PAD_LEFT), time()]);
    $child = in_array($place['kind'], ['school', 'kinder', 'institute', 'club'], true);
    $temp = in_array($place['kind'], TEMP_KINDS, true);
    $pg = $temp ? ($d0['pg'] ?? 'f') : (random_int(0, 1) ? 'f' : 'm'); $kids = [];
    if ($child) { $n = random_int(1, 10) > 8 ? 2 : 1; $g0 = $place['gender'] === 'm' ? 'm' : ($place['gender'] === 'f' ? 'f' : (random_int(0, 1) ? 'f' : 'm'));
        for ($i = 0; $i < $n; $i++) { $g = $g0; $kids[] = ['id' => uid(8), 'first' => $g === 'f' ? GIRLS[array_rand(GIRLS)] : BOYS[array_rand(BOYS)], 'g' => $g, 'by' => jyear() - random_int(7, 12), 'grade' => '']; } }
    $role = $driver ? (random_int(0, 1) ? 'drive' : 'both') : ['drive', 'pay', 'both', 'pay', 'both'][random_int(0, 4)];
    $days = []; if ($role !== 'pay') { foreach ([0, 1, 2, 3, 4] as $x) if (random_int(0, 1)) $days[] = $x; if (!$days) $days = [random_int(0, 4)]; }
    $vals = array_values(array_filter(['nomusic', 'quiet', 'religious', 'samegender'], fn() => random_int(0, 4) === 0));
    $data = ['family' => FAMS[array_rand(FAMS)], 'pg' => $pg, 'kids' => $kids, 'hood' => $d0['hood'] ?? HOODS[array_rand(HOODS)], 'lat' => round($lat, 5), 'lng' => round($lng, 5),
        'needs' => ['out' => true, 'back' => random_int(0, 5) > 0], 'role' => $role, 'days' => $days, 'seats' => $role === 'pay' ? 0 : random_int(3, 4), 'snapp' => (int)(round((45000 + 18 * hav($lat, $lng, (float)$place['lat'], (float)$place['lng'])) / 5000) * 5000),
        'values' => $vals, 'phone_show' => true, 'rules_at' => time()];
    if ($temp) { $t0 = strtotime((string)($d0['arrive'] ?? '')) ?: time() + 86400; $data['arrive'] = date('Y-m-d\\TH:i', $t0 + random_int(-40, 40) * 60); $data['needs'] = ['out' => true, 'back' => false]; $data['seats'] = $role === 'pay' ? 0 : random_int(1, 3); $data['free_ride'] = $role !== 'pay' && random_int(0, 2) === 0; if ($role !== 'pay') $data['card'] = '6037 99' . random_int(10, 99) . ' ' . random_int(1000, 9999) . ' ' . random_int(1000, 9999); }
    $id = uid(); q('INSERT INTO profiles(id,user_id,place_id,label,kind,color,data,step,complete,team_id,fake,created,updated) VALUES(?,?,?,?,?,?,?,99,1,NULL,1,?,?)', [$id, $uidv, $place['id'], $place['name'], $place['kind'], 0, json_encode($data, JSON_UNESCAPED_UNICODE), time(), time()]);
    return $id;
}
function wipe_profile(string $pid): void {
    $p = row('SELECT * FROM profiles WHERE id=?', [$pid]); if (!$p) return;
    team_leave($p);
    q('DELETE FROM invites WHERE from_p=? OR to_p=?', [$pid, $pid]); q('DELETE FROM notes WHERE profile_id=?', [$pid]); q('DELETE FROM quiz WHERE profile_id=?', [$pid]); q('DELETE FROM profiles WHERE id=?', [$pid]);
}

/* ───────── quiz pack ───────── */
function quiz_pack(): array { static $p = null; if ($p === null) { $p = json_decode((string)@file_get_contents(__DIR__ . '/quiz_pack.json'), true) ?: []; } return $p; }
function quiz_today(int $level): ?array { $qs = array_values(array_filter(quiz_pack(), fn($x) => (int)$x['level'] === $level)); if (!$qs) return null; $n = (int)floor((time() + 12600) / 86400); return $qs[$n % count($qs)]; }

/* ───────── router ───────── */
if (R6_MAIN) {
$a = $_GET['a'] ?? '';
$in = json_decode((string)file_get_contents('php://input'), true) ?: [];
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST' && $a !== 'cfg') NO('روش درخواست مجاز نیست.', 405);

try {
switch ($a) {

case 'cfg': YES(['web_key' => getv('map_provider', 'neshan') === 'neshan' ? (string)C('neshan_web_key') : '', 'map_provider' => getv('map_provider', 'neshan'), 'sub_price' => (int)getv('sub_price', '297000'), 'free_temp_month' => (int)getv('free_temp_month', '2'), 'service' => (bool)C('neshan_service_key'), 'sms' => (bool)(C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE'),
    'flags' => ['sms_direct' => flag('sms_direct'), 'test_tools' => flag('test_tools'), 'auto_arrive' => flag('auto_arrive'), 'sms_arrive' => flag('sms_arrive'), 'signup_open' => flag('signup_open'), 'league_on' => flag('league_on'), 'paid_mode' => flag('paid_mode'), 'station_on' => flag('station_on')], 'donate' => ['card' => (string)getv('donate_card', ''), 'name' => (string)getv('donate_name', '')], 'jyear' => jyear(), 'wk' => week_key(), 'radio_votes' => (int)getv('radio_votes', '0')]);

/* auth */
case 'otp_send': {
    $ph = phone_norm((string)($in['phone'] ?? '')); if (!$ph) NO('شماره را به شکل ۰۹۱۲۳۴۵۶۷۸۹ بنویسید.');
    if (hit('otp_ip_' . ip_tag(), 3600) > 12) NO('از این اینترنت درخواست کد زیاد شد؛ یک ساعت دیگر امتحان کنید.', 429, 'wait');
    if (hit('otp_all', 3600) > 400) NO('سرویس کد ورود کمی شلوغ است؛ چند دقیقه‌ی دیگر امتحان کنید.', 429, 'wait');
    if (!flag('signup_open') && !row('SELECT 1 FROM users WHERE phone=?', [$ph])) NO('ثبت‌نام فعلاً بسته است.', 403);
    $o = row('SELECT * FROM otps WHERE phone=?', [$ph]); $now = time();
    if ($o && $now - (int)$o['sent'] < 60) NO('یک دقیقه صبر کنید و دوباره بخواهید.', 429, 'wait');
    $hc = ($o && $now - (int)$o['hour_start'] < 3600) ? (int)$o['hour_count'] + 1 : 1; $hs = ($o && $now - (int)$o['hour_start'] < 3600) ? (int)$o['hour_start'] : $now;
    if ($hc > 6) NO('درخواست کد زیاد شد؛ کمی بعد دوباره تلاش کنید.', 429, 'wait');
    $code = (string)random_int(10000, 99999);
    q('DELETE FROM otps WHERE phone=?', [$ph]); q('INSERT INTO otps(phone,hash,exp,tries,sent,hour_count,hour_start) VALUES(?,?,?,?,?,?,?)', [$ph, password_hash($code, PASSWORD_DEFAULT), $now + 180, 0, $now, $hc, $hs]);
    $smsReady = C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE';
    if ($smsReady && !flag('otp_dev')) {
        $r = kave($ph, (string)C('kavenegar_template', 'residim-login'), ['token' => $code], null, ($in['channel'] ?? '') === 'call' ? 'call' : 'sms');
        if (!$r['ok']) q('UPDATE otps SET sent=0 WHERE phone=?', [$ph]); // a failed send must not block an immediate retry
        if (!$r['ok']) J(['ok' => false, 'error' => 'sms', 'message' => 'پیامک کد نرسید؛ مشکل از سمت ماست، نه شما.', 'pcode' => $r['code']], 502);
        YES(['sent' => true, 'channel' => ($in['channel'] ?? 'sms')]);
    }
    YES(['sent' => false, 'dev_code' => $code, 'note' => 'سرویس پیامک فعال نیست؛ کد آزمایشی نمایش داده شد.']);
}
case 'otp_verify': {
    $ph = phone_norm((string)($in['phone'] ?? '')); $code = preg_replace('/\D/', '', strtr((string)($in['code'] ?? ''), ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9']));
    $o = row('SELECT * FROM otps WHERE phone=?', [$ph]); if (!$o || time() > (int)$o['exp']) NO('کد منقضی شده؛ دوباره بخواهید.', 400, 'expired');
    if ((int)$o['tries'] >= 5) NO('تلاش زیاد بود؛ کد تازه بخواهید.', 429);
    if (!password_verify($code, $o['hash'])) { q('UPDATE otps SET tries=tries+1 WHERE phone=?', [$ph]); NO('کد درست نیست.', 400, 'code'); }
    q('DELETE FROM otps WHERE phone=?', [$ph]);
    $u = row('SELECT * FROM users WHERE phone=?', [$ph]); $g = auth(false);
    if ($g && !$g['admin'] && $g['user_id'] && !$g['phone']) { // guest verifying: keep their profiles
        if ($u) { q('UPDATE profiles SET user_id=? WHERE user_id=?', [$u['id'], $g['user_id']]); q('UPDATE tickets SET user_id=? WHERE user_id=?', [$u['id'], $g['user_id']]); q('DELETE FROM tokens WHERE user_id=?', [$g['user_id']]); q('DELETE FROM users WHERE id=?', [$g['user_id']]); }
        else { q('UPDATE users SET phone=? WHERE id=?', [$ph, $g['user_id']]); $u = ['id' => $g['user_id']]; }
    }
    if (!$u) { $id = uid(); q('INSERT INTO users(id,phone,fake,created) VALUES(?,?,0,?)', [$id, $ph, time()]); $u = ['id' => $id]; }
    YES(['token' => issue_token($u['id']), 'phone' => $ph]);
}
case 'guest_start': {
    if (!flag('signup_open')) NO('ثبت‌نام فعلاً بسته است.', 403);
    $id = uid(); q('INSERT INTO users(id,phone,fake,created) VALUES(?,NULL,0,?)', [$id, time()]);
    YES(['token' => issue_token($id), 'phone' => null]);
}
case 'me': { $u = auth(); $pu = (int)(row('SELECT premium_until FROM users WHERE id=?', [$u['user_id']])['premium_until'] ?? 0); YES(['phone' => $u['phone'], 'premium_until' => $pu, 'profiles' => array_map('profile_out', rows('SELECT * FROM profiles WHERE user_id=? ORDER BY created', [$u['user_id']]))]); }
case 'logout': { $t = $_SERVER['HTTP_X_TOKEN'] ?? ''; if ($t) q('DELETE FROM tokens WHERE token=?', [hash('sha256', $t)]); YES(); }

/* places */
case 'place_code': { $p = row('SELECT * FROM places WHERE code=?', [strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($in['code'] ?? '')))]); if (!$p) NO('این لینک پیدا نشد.', 404, 'notfound'); YES(['place' => place_out($p)]); }
case 'place_near': {
    $lat = (float)($in['lat'] ?? 0); $lng = (float)($in['lng'] ?? 0); $kind = (string)($in['kind'] ?? ''); $qq = trim((string)($in['q'] ?? ''));
    $all = rows('SELECT * FROM places WHERE fake=0 OR created_by IS NOT NULL'); $out = [];
    foreach ($all as $p) { if ($kind && $p['kind'] !== $kind) continue; if ($qq !== '' && mb_strpos($p['name'] . ' ' . $p['city'], $qq) === false) continue; $d = $lat ? hav($lat, $lng, (float)$p['lat'], (float)$p['lng']) : 0; if ($lat && $qq === '' && $d > 12000) continue; $o = place_out($p); $o['d'] = (int)$d; $out[] = $o; }
    usort($out, fn($x, $y) => $x['d'] <=> $y['d']); YES(['places' => array_slice($out, 0, 30)]);
}
case 'place_report': { // two different users agree a place is fake or wrong -> removed (only while nobody real uses it)
    $u = auth(); $pl = row('SELECT * FROM places WHERE id=?', [(string)($in['id'] ?? '')]); if (!$pl) NO('این مکان پیدا نشد.', 404);
    if ((int)$pl['verified'] || (int)($pl['nv'] ?? 0)) NO('این مکان تأییدشده است (مدیر یا نقشه‌ی نشان)؛ برای اصلاحش تیکت بزنید.');
    $used = (int)q('SELECT COUNT(*) FROM profiles WHERE place_id=? AND fake=0 AND user_id<>?', [$pl['id'], $u['user_id']])->fetchColumn();
    if ($used) NO('خانواده‌های دیگری این مکان را انتخاب کرده‌اند؛ برای حذفش تیکت بزنید.');
    if (!$u['phone']) NO('برای گزارش، اول شماره‌تان را تأیید کنید.');
    try { q('INSERT INTO place_flags(place_id,user_id,created) VALUES(?,?,?)', [$pl['id'], $u['user_id'], time()]); } catch (Throwable $e) {}
    $n = (int)q('SELECT COUNT(*) FROM place_flags WHERE place_id=?', [$pl['id']])->fetchColumn();
    if ($n >= 2) { foreach (rows('SELECT id FROM profiles WHERE place_id=?', [$pl['id']]) as $pp) { $f = row('SELECT fake FROM profiles WHERE id=?', [$pp['id']]); if ((int)$f['fake']) wipe_profile($pp['id']); else q('UPDATE profiles SET place_id=NULL, team_id=NULL, complete=0 WHERE id=?', [$pp['id']]); }
        q('DELETE FROM teams WHERE place_id=?', [$pl['id']]); q('DELETE FROM place_flags WHERE place_id=?', [$pl['id']]); q('DELETE FROM places WHERE id=?', [$pl['id']]); YES(['deleted' => true, 'votes' => $n]); }
    YES(['deleted' => false, 'votes' => $n]); }
case 'place_create': {
    $u = auth();
    $kind = (string)($in['kind'] ?? 'school'); $name = trim((string)($in['name'] ?? '')); $lat = (float)($in['lat'] ?? 0); $lng = (float)($in['lng'] ?? 0);
    if (mb_strlen($name) < 3 || !$lat || !$lng) NO('نام و موقعیت مکان لازم است.');
    if (empty($in['force'])) { $dups = []; foreach (rows('SELECT * FROM places') as $p) if (hav($lat, $lng, (float)$p['lat'], (float)$p['lng']) < 250) $dups[] = place_out($p); if ($dups) YES(['dups' => $dups]); }
    $id = uid(); $code = code8(); $days = implode(',', array_map('intval', (array)($in['days'] ?? [0, 1, 2, 3, 4])));
    q('INSERT INTO places(id,code,kind,name,city,gender,shift,lat,lng,t_in,t_out,days,created_by,verified,fake,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?)',
      [$id, $code, $kind, mb_substr($name, 0, 150), mb_substr((string)($in['city'] ?? ''), 0, 50), in_array($in['gender'] ?? '', ['f', 'm', 'fm'], true) ? $in['gender'] : 'fm', mb_substr((string)($in['shift'] ?? ''), 0, 40), $lat, $lng, substr((string)($in['in'] ?? '07:30'), 0, 5), substr((string)($in['out'] ?? '13:30'), 0, 5), $days, $u['user_id'], time()]);
    try { neshan_check(row('SELECT * FROM places WHERE id=?', [$id])); } catch (Throwable $e) {}
    if (!empty($in['in2'])) q('UPDATE places SET t_in2=?, t_out2=? WHERE id=?', [substr((string)$in['in2'], 0, 5), substr((string)($in['out2'] ?? ''), 0, 5), $id]);
    YES(['place' => place_out(row('SELECT * FROM places WHERE id=?', [$id]))]);
}
case 'route': {
    $a1 = (array)($in['a'] ?? []); $b1 = (array)($in['b'] ?? []); $r = road_many((float)$a1[0], (float)$a1[1], [[(float)$b1[0], (float)$b1[1]]])[0];
    // Snapp estimate: least-squares fit on real answers (price vs road km) from the same city; default formula until 5 samples exist.
    $city = trim((string)($in['city'] ?? '')); $xs = []; $ys = [];
    foreach (rows('SELECT p.data, pl.lat plat, pl.lng plng FROM profiles p JOIN places pl ON pl.id=p.place_id WHERE p.complete=1 AND p.fake=0' . ($city !== '' ? ' AND pl.city=?' : ''), $city !== '' ? [$city] : []) as $row) {
        $d = json_decode((string)$row['data'], true); if (empty($d['snapp']) || empty($d['lat'])) continue;
        $k = dkey((float)$d['lat'], (float)$d['lng'], (float)$row['plat'], (float)$row['plng']); $c = row('SELECT m FROM dist WHERE k=?', [$k]);
        $km = ($c ? (int)$c['m'] : hav((float)$d['lat'], (float)$d['lng'], (float)$row['plat'], (float)$row['plng']) * 1.3) / 1000; if ($km < 0.3 || $km > 40) continue; $xs[] = $km; $ys[] = (int)$d['snapp'];
    }
    $km = $r['m'] / 1000; $n = count($xs); $a = 45000; $b = 18000; $src = 'formula';
    if ($n >= 5) { $mx = array_sum($xs) / $n; $my = array_sum($ys) / $n; $sxx = 0; $sxy = 0; foreach ($xs as $i => $x) { $sxx += ($x - $mx) ** 2; $sxy += ($x - $mx) * ($ys[$i] - $my); }
        if ($sxx > 0 && $sxy > 0) { $b = $sxy / $sxx; $a = max(20000, $my - $b * $mx); $src = 'crowd'; } }
    YES($r + ['est' => (int)(round(($a + $b * $km) / 5000) * 5000), 'est_n' => $n, 'est_src' => $src]);
}
case 'radio_vote': { $v = (int)getv('radio_votes', '0') + 1; setv('radio_votes', (string)$v); YES(['votes' => $v]); }
case 'chat_list': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) YES(['list' => []]);
    $after = (int)($in['after'] ?? 0); $l = [];
    foreach (rows('SELECT m.*, p.data pdata FROM msgs m LEFT JOIN profiles p ON p.id=m.profile_id WHERE m.team_id=? AND m.created>? ORDER BY m.created DESC LIMIT 80', [$me['team_id'], $after]) as $m) { $d = json_decode((string)$m['pdata'], true) ?: []; $l[] = ['id' => $m['id'], 'text' => $m['text'], 'at' => (int)$m['created'], 'mine' => $m['profile_id'] === $me['id'], 'who' => 'خانواده ' . ($d['family'] ?? ''), 'who_id' => $m['profile_id']]; }
    YES(['list' => array_reverse($l)]);
}
case 'chat_send': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) NO('اول تیم شوید.');
    $t = trim(preg_replace('/\s+/u', ' ', (string)($in['text'] ?? ''))); if ($t === '') NO('پیام خالی است.'); $t = mb_substr($t, 0, 400);
    $last = (int)q('SELECT COALESCE(MAX(created),0) FROM msgs WHERE profile_id=?', [$me['id']])->fetchColumn(); if (time() - $last < 2) NO('کمی آرام‌تر 🙂', 429);
    q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $me['team_id'], $me['id'], $t, time()]); YES();
}
case 'reverse': {
    $lat = (float)($in['lat'] ?? 0); $lng = (float)($in['lng'] ?? 0);
    $r = neshan('/v5/reverse', ['lat' => $lat, 'lng' => $lng]);
    if (!$r) YES(['hood' => '', 'address' => '', 'src' => 'none']);
    $hood = $r['neighbourhood'] ?? ($r['neighborhood'] ?? ($r['municipality_zone'] ?? '')); YES(['hood' => (string)$hood, 'address' => (string)($r['formatted_address'] ?? ''), 'city' => (string)($r['city'] ?? ''), 'src' => 'neshan']);
}

/* profiles */
case 'profile_save': {
    $u = auth(); $id = (string)($in['id'] ?? ''); $data = (array)($in['data'] ?? []);
    foreach (['family', 'hood'] as $k) if (isset($data[$k])) $data[$k] = mb_substr(trim((string)$data[$k]), 0, 40);
    $label = mb_substr(trim((string)($in['label'] ?? '')), 0, 60) ?: 'مسیرک'; $kind = (string)($in['kind'] ?? 'school'); $place = $in['place_id'] ?? null;
    if ($place && !row('SELECT 1 FROM places WHERE id=?', [$place])) NO('مکان پیدا نشد.');
    $complete = !empty($in['complete']) ? 1 : 0; $step = (int)($in['step'] ?? 0); $color = (int)($in['color'] ?? 0);
    $old = $id ? row('SELECT * FROM profiles WHERE id=? AND user_id=?', [$id, $u['user_id']]) : null;
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if ($old) {
        if ($old['team_id'] && $place !== $old['place_id']) team_leave($old);
        q('UPDATE profiles SET place_id=?, label=?, kind=?, color=?, data=?, step=?, complete=?, updated=? WHERE id=?', [$place, $label, $kind, $old['team_id'] ? (int)$old['color'] : $color, $json, $step, max($complete, (int)$old['complete']), time(), $id]);
        if ($old['team_id']) q('UPDATE teams SET price=? WHERE id=?', [fair_price($old['team_id']), $old['team_id']]);
    } else {
        if ((int)q('SELECT COUNT(*) FROM profiles WHERE user_id=?', [$u['user_id']])->fetchColumn() >= 8 && !is_premium($u['user_id'])) NO('حداکثر ۸ مسیرک.');
        if (flag('paid_mode') && !is_premium($u['user_id'])) {
            if (in_array($kind, TEMP_KINDS, true)) {
                $used = (int)q('SELECT COUNT(*) FROM profiles WHERE user_id=? AND kind IN (\'station\') AND created>?', [$u['user_id'], time() - 30 * 86400])->fetchColumn();
                if ($used >= (int)getv('free_temp_month', '2') && empty($data['free_ride'])) J(['ok' => false, 'error' => 'paywall', 'reason' => 'temp', 'message' => 'مسیرک‌های سفرِ رایگانِ این ماه تمام شد.'], 402);
            } else {
                $perm = (int)q('SELECT COUNT(*) FROM profiles WHERE user_id=? AND kind NOT IN (\'station\')', [$u['user_id']])->fetchColumn();
                if ($perm >= (int)getv('free_permanent', '1')) J(['ok' => false, 'error' => 'paywall', 'reason' => 'perm', 'message' => 'مسیرک اول مهمان ما بودید؛ برای مسیرک‌های بیشتر اشتراک لازم است.'], 402);
            }
        }
        $id = uid(); q('INSERT INTO profiles(id,user_id,place_id,label,kind,color,data,step,complete,team_id,fake,created,updated) VALUES(?,?,?,?,?,?,?,?,?,NULL,0,?,?)', [$id, $u['user_id'], $place, $label, $kind, $color, $json, $step, $complete, time(), time()]);
    }
    $p = row('SELECT * FROM profiles WHERE id=?', [$id]);
    if ($complete && (!$old || !(int)$old['complete']) && $place) { // tell neighbours (≤2km) in the same place
        foreach (rows('SELECT * FROM profiles WHERE place_id=? AND complete=1 AND id<>? AND fake=0', [$place, $id]) as $o) { $od = pdata($o); if (isset($od['lat'], $data['lat']) && hav((float)$od['lat'], (float)$od['lng'], (float)$data['lat'], (float)$data['lng']) <= 2000) note($o['id'], 'خانواده‌ی ' . ($data['family'] ?? '') . ' نزدیک شما به «' . (row('SELECT name FROM places WHERE id=?', [$place])['name'] ?? '') . '» پیوستند. سری به هم‌مسیرها بزنید!', 'neighbor', $id); }
    }
    YES(['profile' => profile_out($p)]);
}
case 'profile_delete': { $u = auth(); $p = my_profile($u, (string)($in['id'] ?? '')); wipe_profile($p['id']); YES(); }
case 'account_reset': { $u = auth(); foreach (rows('SELECT id FROM profiles WHERE user_id=?', [$u['user_id']]) as $p) wipe_profile($p['id']); q('DELETE FROM tickets WHERE user_id=?', [$u['user_id']]); q('DELETE FROM tokens WHERE user_id=?', [$u['user_id']]); q('DELETE FROM users WHERE id=?', [$u['user_id']]); YES(); }

/* matching */
case 'candidates': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['place_id']) YES(['list' => []]);
    $md = pdata($me); $others = rows('SELECT * FROM profiles WHERE place_id=? AND complete=1 AND id<>?', [$me['place_id'], $me['id']]);
    $mplace = row('SELECT * FROM places WHERE id=?', [$me['place_id']]);
    if ($mplace && in_array($mplace['kind'], TEMP_KINDS, true)) {
        $t0 = strtotime((string)($md['arrive'] ?? '')) ?: 0;
        $others = array_values(array_filter($others, function ($o) use ($md, $t0) { $od = pdata($o); $t1 = strtotime((string)($od['arrive'] ?? '')) ?: 0;
            return ($od['pg'] ?? '') === ($md['pg'] ?? '') && (!$t0 || !$t1 || abs($t1 - $t0) <= 3600) && hav((float)($md['lat'] ?? 0), (float)($md['lng'] ?? 0), (float)($od['lat'] ?? 0), (float)($od['lng'] ?? 0)) <= 8000; }));
    }
    if ($mplace && mb_strpos((string)$mplace['shift'], 'چرخشی') !== false && isset($md['rot_par'])) $others = array_values(array_filter($others, fn($o) => !isset(pdata($o)['rot_par']) || (int)pdata($o)['rot_par'] === (int)$md['rot_par']));
    $mlat = (float)($md['lat'] ?? 0); $mlng = (float)($md['lng'] ?? 0);
    usort($others, fn($x, $y) => hav($mlat, $mlng, (float)(pdata($x)['lat'] ?? 0), (float)(pdata($x)['lng'] ?? 0)) <=> hav($mlat, $mlng, (float)(pdata($y)['lat'] ?? 0), (float)(pdata($y)['lng'] ?? 0)));
    $near = array_slice($others, 0, 40);
    $dist = $mlat ? road_many($mlat, $mlng, array_map(fn($o) => [(float)(pdata($o)['lat'] ?? 0), (float)(pdata($o)['lng'] ?? 0)], $near)) : [];
    $inv = []; foreach (rows('SELECT * FROM invites WHERE (from_p=? OR to_p=?) AND status=?', [$me['id'], $me['id'], 'pending']) as $i) $inv[$i['from_p'] === $me['id'] ? $i['to_p'] : $i['from_p']] = ['id' => $i['id'], 'dir' => $i['from_p'] === $me['id'] ? 'out' : 'in'];
    $myR = riders_of($me); $list = [];
    foreach ($near as $i => $o) {
        $mate = $me['team_id'] && $o['team_id'] === $me['team_id']; $m = public_member($o, (bool)$mate, $me, (bool)$u['phone']);
        $m['dist'] = $dist[$i] ?? null; $m['invite'] = $inv[$o['id']] ?? null; $m['mate'] = (bool)$mate;
        $team = $o['team_id'] ? array_merge(...array_map('riders_of', rows('SELECT * FROM profiles WHERE team_id=?', [$o['team_id']]))) : riders_of($o);
        $m['rule_ok'] = team_rule_ok($mplace, array_merge($myR, $team, $me['team_id'] && !$mate ? array_merge(...array_map('riders_of', rows('SELECT * FROM profiles WHERE team_id=? AND id<>?', [$me['team_id'], $me['id']]))) : []));
        $list[] = $m;
    }
    $mates = []; if ($me['team_id']) foreach (rows('SELECT * FROM profiles WHERE team_id=? AND id<>?', [$me['team_id'], $me['id']]) as $o) $mates[] = $o['id'];
    YES(['list' => $list, 'service' => (bool)C('neshan_service_key')]);
}
case 'invite': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $to = row('SELECT * FROM profiles WHERE id=?', [(string)($in['to'] ?? '')]);
    if (!$to || $to['place_id'] !== $me['place_id'] || !(int)$to['complete']) NO('این خانواده در همین مکان نیست.');
    if ($me['team_id'] && $to['team_id']) NO('هر دو در تیم هستید؛ برای جابه‌جایی اول از تیم خودتان جدا شوید.');
    if ($me['team_id'] && $me['team_id'] === $to['team_id']) NO('هم‌تیمی شما هستند.');
    $all = array_merge(riders_of($me), riders_of($to)); foreach ([$me['team_id'], $to['team_id']] as $tid) if ($tid) foreach (rows('SELECT * FROM profiles WHERE team_id=?', [$tid]) as $x) if ($x['id'] !== $me['id'] && $x['id'] !== $to['id']) $all = array_merge($all, riders_of($x));
    if (!team_rule_ok(row('SELECT * FROM places WHERE id=?', [$me['place_id']]), $all)) NO('طبق قانون رسیدیم این هم‌مسیری ممکن نیست (قاعده‌ی سن و جنسیت، یا هم‌جنس بودن در مسیرک‌های سفر).', 400, 'rule');
    if (row('SELECT 1 FROM invites WHERE status=? AND ((from_p=? AND to_p=?) OR (from_p=? AND to_p=?))', ['pending', $me['id'], $to['id'], $to['id'], $me['id']])) NO('پیشنهاد قبلاً فرستاده شده و منتظر پاسخ است.');
    $today = (int)q('SELECT COUNT(*) FROM invites WHERE from_p=? AND created>?', [$me['id'], time() - 86400])->fetchColumn(); if ($today >= 12) NO('امروز پیشنهاد کافی فرستاده‌اید؛ فردا دوباره.', 429);
    $id = uid(); q('INSERT INTO invites(id,from_p,to_p,status,created,responded) VALUES(?,?,?,?,?,NULL)', [$id, $me['id'], $to['id'], 'pending', time()]);
    $md = pdata($me); $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]);
    note($to['id'], 'خانواده‌ی ' . ($md['family'] ?? '') . ' پیشنهاد هم‌مسیری داده‌اند.', 'invite', $id);
    $sms = 'off';
    if (flag('sms_invite')) {
        $sent = (int)q("SELECT COUNT(*) FROM sms WHERE by_user=? AND tpl=? AND created>?", [$u['user_id'], C('kavenegar_tpl_invite'), time() - 86400])->fetchColumn();
        $tu = row('SELECT phone,fake FROM users WHERE id=?', [$to['user_id']]);
        if ($sent < 5 && $tu && !(int)$tu['fake']) $sms = sms_lookup($tu['phone'], (string)C('kavenegar_tpl_invite'), ['token' => $pl['code'], 'token10' => sms_token((string)($md['family'] ?? ''), 4), 'token20' => sms_token((string)$pl['name'], 7)], $u['user_id']);
        elseif ($tu && (int)$tu['fake']) $sms = 'fake';
    }
    if ((int)$to['fake']) { // test neighbours answer on their own after a moment (accepted when the client polls)
        q('UPDATE invites SET status=?, responded=? WHERE id=?', ['autoaccept', time() + 3, $id]);
    }
    YES(['id' => $id, 'sms' => $sms]);
}
case 'invite_respond': {
    $u = auth(); $i = row('SELECT * FROM invites WHERE id=?', [(string)($in['id'] ?? '')]); if (!$i || $i['status'] !== 'pending') NO('این پیشنهاد دیگر معتبر نیست.');
    $to = my_profile($u, $i['to_p']); $from = row('SELECT * FROM profiles WHERE id=?', [$i['from_p']]); if (!$from) NO('فرستنده دیگر نیست.');
    if (empty($in['accept'])) { q('UPDATE invites SET status=?, responded=? WHERE id=?', ['declined', time(), $i['id']]); YES(['status' => 'declined']); }
    try { $team = accept_invite($i, $from, $to); } catch (RuntimeException $e) { NO($e->getMessage(), 400, 'rule'); }
    YES(['team' => $team]);
}
case 'invite_undo': {
    $u = auth(); $i = row('SELECT * FROM invites WHERE id=?', [(string)($in['id'] ?? '')]); if (!$i || $i['status'] !== 'declined' || time() - (int)$i['responded'] > 300) NO('دیگر نمی‌شود برگرداند.');
    my_profile($u, $i['to_p']); q("UPDATE invites SET status='pending', responded=NULL WHERE id=?", [$i['id']]); YES();
}
case 'inbox': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? ''));
    settle_auto($me['id']);
    $inv = []; foreach (rows('SELECT * FROM invites WHERE to_p=? AND status=? ORDER BY created DESC', [$me['id'], 'pending']) as $i) { $f = row('SELECT * FROM profiles WHERE id=?', [$i['from_p']]); if ($f) { $m = public_member($f, false, null, (bool)$u['phone']); $md = pdata($me); $m['dist'] = isset($md['lat']) ? road_many((float)$md['lat'], (float)$md['lng'], [[$m['lat'], $m['lng']]])[0] : null; $inv[] = ['id' => $i['id'], 'from' => $m]; } }
    $notes = rows('SELECT id,text,kind,rd,created FROM notes WHERE profile_id=? ORDER BY created DESC LIMIT 30', [$me['id']]);
    if (!empty($in['mark'])) q('UPDATE notes SET rd=1 WHERE profile_id=?', [$me['id']]);
    YES(['invites' => $inv, 'notes' => $notes, 'unread' => (int)q('SELECT COUNT(*) FROM notes WHERE profile_id=? AND rd=0', [$me['id']])->fetchColumn(), 'profile' => profile_out(row('SELECT * FROM profiles WHERE id=?', [$me['id']]))]);
}
case 'team_history': { // every recorded trip of the team with its calendar date (weeks start Saturday)
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) YES(['trips' => []]);
    $out = []; foreach (rows('SELECT wk,slot,status,exec,arr,thanks FROM trips WHERE team_id=? ORDER BY wk', [$me['team_id']]) as $r) {
        [$y, $w] = array_map('intval', explode('-', (string)$r['wk']) + [0, 0]); if (!$y || !$w) continue;
        $mon = (new DateTime())->setISODate($y, $w, 1); $mon->modify('-2 days'); [$d, $dir] = explode('-', (string)$r['slot']) + ['0', 'out']; $mon->modify('+' . (int)$d . ' days');
        $out[] = ['date' => $mon->format('Y-m-d'), 'dir' => $dir, 'status' => $r['status'], 'exec' => $r['exec'], 'kids' => count((array)(json_decode((string)$r['arr'], true) ?: [])), 'thanks' => (int)$r['thanks']]; }
    $sat = new DateTime(); $sat->setTime(0, 0); while ((int)$sat->format('w') !== 6) $sat->modify('-1 day');
    YES(['trips' => $out, 'sat' => $sat->format('Y-m-d'), 'today' => date('Y-m-d')]); }
case 'live_push': { // the driver of a started trip shares a live position with their team
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) NO('تیم ندارید.');
    $la = (float)($in['lat'] ?? 0); $lo = (float)($in['lng'] ?? 0); if (!$la || abs($la) > 90 || abs($lo) > 180) NO('موقعیت نامعتبر.');
    if (hit('live_' . $me['id'], 60) > 12) YES(['ok' => true]);
    q('DELETE FROM live WHERE team_id=?', [$me['team_id']]); q('INSERT INTO live(team_id,profile_id,lat,lng,acc,at) VALUES(?,?,?,?,?,?)', [$me['team_id'], $me['id'], round($la, 5), round($lo, 5), (int)($in['acc'] ?? 0), time()]); YES(); }
case 'live_get': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) YES(['live' => null]);
    $t = row('SELECT premium FROM teams WHERE id=?', [$me['team_id']]);
    if (flag('paid_mode') && !(int)($t['premium'] ?? 0) && !is_premium($u['user_id'])) YES(['live' => null, 'locked' => true]);
    $l = row('SELECT profile_id,lat,lng,acc,at FROM live WHERE team_id=? AND at>?', [$me['team_id'], time() - 180]);
    YES(['live' => $l ? ['by' => $l['profile_id'], 'lat' => (float)$l['lat'], 'lng' => (float)$l['lng'], 'acc' => (int)$l['acc'], 'ago' => time() - (int)$l['at']] : null]); }
case 'team_leave': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); YES(['result' => team_leave($me)]); }

/* team daily */
case 'team_state': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); settle_auto($me['id']); $me = row('SELECT * FROM profiles WHERE id=?', [$me['id']]);
    if (!$me['team_id']) YES(['team' => null]);
    $t = row('SELECT * FROM teams WHERE id=?', [$me['team_id']]); $wk = week_key();
    $members = array_map(fn($p) => public_member($p, true), rows('SELECT * FROM profiles WHERE team_id=? ORDER BY created', [$t['id']]));
    $trips = []; foreach (rows('SELECT * FROM trips WHERE team_id=? AND wk=?', [$t['id'], $wk]) as $r) $trips[$r['slot']] = ['status' => $r['status'], 'exec' => $r['exec'], 'arr' => json_decode((string)$r['arr'], true) ?: (object)[], 'empty' => (int)$r['empty'], 'thanks' => (int)$r['thanks']];
    $ledger = array_map(fn($r) => ['id' => $r['id'], 'kind' => $r['kind'], 'text' => $r['text'], 'd' => json_decode((string)$r['d'], true), 'at' => (int)$r['created']], rows('SELECT * FROM ledger WHERE team_id=? ORDER BY created', [$t['id']]));
    $board = []; foreach (rows('SELECT team_id, SUM(ok) s, COUNT(*) n FROM quiz WHERE place_id=? AND day>=? GROUP BY team_id', [$t['place_id'], date('Y-m-d', strtotime('-6 days'))]) as $b) { $tt = row('SELECT no,hood,color FROM teams WHERE id=?', [$b['team_id']]); if ($tt) $board[] = ['team' => $b['team_id'], 'no' => (int)$tt['no'], 'hood' => $tt['hood'], 'color' => (int)$tt['color'], 'score' => (int)$b['s'], 'n' => (int)$b['n']]; }
    usort($board, fn($x, $y) => $y['score'] <=> $x['score']);
    YES(['team' => team_out($t), 'members' => $members, 'trips' => (object)$trips, 'ledger' => $ledger, 'wk' => $wk, 'board' => $board, 'place' => place_out(row('SELECT * FROM places WHERE id=?', [$t['place_id']]), false)]);
}
case 'team_act': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) NO('تیم ندارید.');
    $t = row('SELECT * FROM teams WHERE id=?', [$me['team_id']]); $act = (string)($in['act'] ?? ''); $wk = week_key();
    $slot = preg_replace('/[^0-9a-z\-]/', '', (string)($in['slot'] ?? '')); $rid = $t['id'] . '|' . $wk . '|' . $slot;
    $tr = $slot ? row('SELECT * FROM trips WHERE id=?', [$rid]) : null;
    $members = rows('SELECT * FROM profiles WHERE team_id=?', [$t['id']]); $ids = array_column($members, 'id');
    $dir = str_ends_with($slot, 'out') ? 'out' : 'back';
    $riders = []; foreach ($members as $m) { $n = pdata($m)['needs'] ?? ['out' => true, 'back' => true]; if (!empty($n[$dir])) foreach (riders_of($m) as $r) $riders[] = $r + ['pid' => $m['id']]; }
    $save = function (array $f) use ($rid, $t, $wk, $slot, &$tr) {
        if ($tr) { $sets = implode(',', array_map(fn($k) => "`$k`=?", array_keys($f))); q("UPDATE trips SET $sets, updated=? WHERE id=?", array_merge(array_values($f), [time(), $rid])); }
        else { $f += ['status' => 'pending', 'exec' => null, 'arr' => '{}', 'empty' => 0, 'thanks' => 0]; q('INSERT INTO trips(id,team_id,wk,slot,status,exec,arr,`empty`,thanks,updated) VALUES(?,?,?,?,?,?,?,?,?,?)', [$rid, $t['id'], $wk, $slot, $f['status'], $f['exec'], $f['arr'], $f['empty'], $f['thanks'], time()]); }
        $tr = row('SELECT * FROM trips WHERE id=?', [$rid]);
    };
    switch ($act) {
        case 'start': { $ex = (string)($in['exec'] ?? ''); if (!in_array($ex, $ids, true)) NO('راننده معتبر نیست.'); if ($tr && $tr['status'] !== 'pending') NO('این نوبت قبلاً شروع شده.'); $save(['status' => 'started', 'exec' => $ex, 'arr' => '{}', 'empty' => 0]); break; }
        case 'swap': { $ex = (string)($in['exec'] ?? ''); if (!in_array($ex, $ids, true)) NO('راننده معتبر نیست.'); if ($tr && $tr['status'] !== 'pending') NO('این نوبت شروع شده و تغییر نمی‌کند.'); $save(['status' => 'pending', 'exec' => $ex]); foreach ($ids as $pid) if ($pid !== $me['id']) note($pid, 'راننده‌ی یک نوبت عوض شد؛ تیم را ببینید.', 'team'); break; }
        case 'arrive': {
            if (!$tr || $tr['status'] !== 'started') NO('سفر شروع نشده.'); $arr = json_decode((string)$tr['arr'], true) ?: []; $kid = (string)($in['kid'] ?? '');
            $targets = $kid === '*' ? array_column($riders, 'id') : [$kid];
            foreach ($targets as $k) { if (isset($arr[$k])) continue; $r = null; foreach ($riders as $x) if ($x['id'] === $k) $r = $x; if (!$r) continue; $arr[$k] = time();
                $fam = row('SELECT * FROM profiles WHERE id=?', [$r['pid']]); $fd = pdata($fam); $exd = pdata(row('SELECT data FROM profiles WHERE id=?', [$tr['exec']]) ?? ['data' => '{}']);
                $pl = row('SELECT name FROM places WHERE id=?', [$t['place_id']]); $where = $dir === 'out' ? ($pl['name'] ?? 'مقصد') : 'خانه';
                $who = trim(($r['first'] ?: '') . ' ' . ($fd['family'] ?? '')); if ($r['pid'] !== $tr['exec']) note($r['pid'], "$who ساعت " . date('H:i') . " به $where رسید.", 'arrive');
                if ((int)$t['premium'] && flag('sms_arrive') && $r['pid'] !== $tr['exec']) { $fu = row('SELECT phone,fake FROM users WHERE id=?', [$fam['user_id']]); if ($fu && !(int)$fu['fake']) sms_lookup($fu['phone'], (string)C('kavenegar_tpl_arrived'), ['token' => date('H:i'), 'token2' => sms_token((string)($exd['family'] ?? ''), 0), 'token10' => sms_token($who, 4), 'token20' => sms_token($where, 7)], $u['user_id']); }
            }
            $save(['arr' => json_encode($arr)]); break;
        }
        case 'empty': { if (!$tr) NO('سفر شروع نشده.'); $save(['empty' => !empty($in['v']) ? 1 : 0]); break; }
        case 'finish': {
            if (!$tr || $tr['status'] !== 'started') NO('سفر شروع نشده.'); $arr = json_decode((string)$tr['arr'], true) ?: [];
            foreach ($riders as $r) if (!isset($arr[$r['id']])) NO('همه هنوز «رسید» نشده‌اند.'); if (!(int)$tr['empty']) NO('خالی بودن خودرو را تأیید کنید.');
            $save(['status' => 'done']); $ref = $wk . '|' . $slot;
            if (!row('SELECT 1 FROM ledger WHERE team_id=? AND ref=?', [$t['id'], $ref]) && $riders) {
                $price = (int)$t['price']; $share = (int)(round($price / count($riders) / 1000) * 1000); $d = [$tr['exec'] => $share * count($riders)];
                foreach ($riders as $r) $d[$r['pid']] = ($d[$r['pid']] ?? 0) - $share;
                $exd = pdata(row('SELECT * FROM profiles WHERE id=?', [$tr['exec']]));
                q('INSERT INTO ledger(id,team_id,kind,ref,text,d,created) VALUES(?,?,?,?,?,?,?)', [uid(), $t['id'], 'trip', $ref, (string)($in['label'] ?? 'سفر') . ' · خانواده ' . ($exd['family'] ?? ''), json_encode($d), time()]);
            }
            break;
        }
        case 'thanks': { if ($tr) { $save(['thanks' => 1]); if ($tr['exec'] !== $me['id']) note($tr['exec'], 'خانواده‌ی ' . (pdata($me)['family'] ?? '') . ' گفتند: دست‌تان درد نکند! 🌿', 'thanks'); } break; }
        case 'settle': {
            $k = ($in['kind'] ?? '') === 'gift' ? 'gift' : 'pay'; $from = (string)($in['from'] ?? ''); $to = (string)($in['to'] ?? ''); $amt = (int)($in['amt'] ?? 0);
            if (!in_array($from, $ids, true) || !in_array($to, $ids, true) || $amt < 1000) NO('اطلاعات تسویه درست نیست.');
            if ($k === 'gift' && $me['id'] !== $to) NO('فقط طلب‌کار می‌تواند حلال کند.'); if ($k === 'pay' && $me['id'] !== $from && $me['id'] !== $to) NO('فقط دو طرف تسویه می‌توانند ثبت کنند.');
            $fd = pdata(row('SELECT * FROM profiles WHERE id=?', [$from])); $td = pdata(row('SELECT * FROM profiles WHERE id=?', [$to]));
            $text = $k === 'pay' ? 'خانواده ' . ($fd['family'] ?? '') . ' به خانواده ' . ($td['family'] ?? '') . ' پرداخت کردند' : 'خانواده ' . ($td['family'] ?? '') . ' سهم خانواده ' . ($fd['family'] ?? '') . ' را حلال کردند';
            q('INSERT INTO ledger(id,team_id,kind,ref,text,d,created) VALUES(?,?,?,?,?,?,?)', [uid(), $t['id'], $k, null, $text, json_encode([$from => $amt, $to => -$amt]), time()]);
            note($me['id'] === $from ? $to : $from, $text . '.', 'money'); break;
        }
        case 'prize': { q('UPDATE teams SET prize=? WHERE id=?', [mb_substr(trim((string)($in['text'] ?? '')), 0, 150), $t['id']]); break; }
        default: NO('عمل ناشناخته.');
    }
    YES();
}

/* quiz */
case 'quiz_today': {
    if (!flag('league_on')) NO('لیگ فعلاً خاموش است.', 403);
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $ages = array_filter(array_column(riders_of($me), 'age'), fn($x) => $x !== null);
    $avg = $ages ? array_sum($ages) / count($ages) : 30; $lvl = $avg <= 9 ? 1 : ($avg <= 12 ? 2 : 3); $qq = quiz_today($lvl); if (!$qq) YES(['q' => null]);
    $done = row('SELECT ok FROM quiz WHERE profile_id=? AND day=? AND qid=?', [$me['id'], date('Y-m-d'), $qq['id']]);
    YES(['q' => ['id' => $qq['id'], 'level' => $lvl, 'text' => $qq['q'], 'choices' => $qq['choices'] ?? null, 'type' => $qq['type'], 'hint' => $qq['hint'] ?? ''], 'done' => $done ? (int)$done['ok'] : null, 'answer' => $done ? $qq['a'] : null, 'why' => $done ? ($qq['why'] ?? '') : null]);
}
case 'quiz_answer': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $qid = (string)($in['qid'] ?? ''); $qq = null; foreach (quiz_pack() as $x) if ($x['id'] === $qid) $qq = $x; if (!$qq) NO('سؤال پیدا نشد.');
    if (row('SELECT 1 FROM quiz WHERE profile_id=? AND day=? AND qid=?', [$me['id'], date('Y-m-d'), $qid])) NO('امروز پاسخ داده‌اید؛ فردا معمای تازه!');
    $ans = trim(strtr((string)($in['answer'] ?? ''), ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9']));
    $ok = (string)$qq['a'] === $ans ? 1 : 0;
    q('INSERT INTO quiz(id,profile_id,team_id,place_id,day,qid,ok,created) VALUES(?,?,?,?,?,?,?,?)', [uid(), $me['id'], $me['team_id'], $me['place_id'], date('Y-m-d'), $qid, $ok, time()]);
    YES(['ok' => (bool)$ok, 'answer' => $qq['a'], 'why' => $qq['why'] ?? '']);
}

/* tickets */
case 'ticket': {
    $u = auth(); $txt = trim((string)($in['text'] ?? '')); if (mb_strlen($txt) < 5) NO('چند کلمه بیشتر بنویسید.');
    $no = 1024 + (int)q('SELECT COUNT(*) FROM tickets')->fetchColumn();
    q('INSERT INTO tickets(id,no,user_id,profile_id,cat,text,status,reply,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?)', [uid(), $no, $u['user_id'], $in['profile_id'] ?? null, mb_substr((string)($in['cat'] ?? 'سایر'), 0, 30), mb_substr($txt, 0, 2000), 'open', '', time(), time()]);
    YES(['no' => $no]);
}
case 'contact': { // public contact form (with or without an account)
    $u = auth(false); $txt = trim((string)($in['text'] ?? '')); $ct = trim((string)($in['contact'] ?? '')); $nm = trim((string)($in['name'] ?? ''));
    if ((string)($in['hp'] ?? '') !== '') YES(['no' => 0]); // honeypot: bots fill every field; answer politely and drop it
    if (mb_strlen($txt) < 5) NO('چند کلمه بیشتر بنویسید.'); if (mb_strlen($txt) > 3000) NO('پیام کمی طولانی است؛ کوتاه‌ترش کنید.');
    if (!$u && mb_strlen($ct) < 5) NO('یک راه تماس (شماره یا ایمیل) بنویسید تا جواب بدهیم.');
    if ((int)($in['t'] ?? 0) < 2500) NO('کمی آهسته‌تر 🙂 پیام را یک بار دیگر بفرستید.');
    if (preg_match_all('#https?://|www\.#i', $txt) > 2) NO('لطفاً بیش از دو لینک نفرستید.');
    if (row('SELECT 1 FROM tickets WHERE text=? AND created>?', [mb_substr($txt, 0, 3000), time() - 86400])) YES(['no' => 0, 'dup' => true]);
    if (hit('ct_' . ip_tag(), 3600) > 5) NO('پیام‌های زیادی فرستادید؛ یک ساعت دیگر دوباره امتحان کنید.', 429);
    if (hit('ct_all', 86400) > 300) NO('صندوق پیام امروز پر است؛ فردا دوباره بنویسید.', 429);
    $no = 1024 + (int)q('SELECT COUNT(*) FROM tickets')->fetchColumn();
    q('INSERT INTO tickets(id,no,user_id,profile_id,cat,text,status,reply,created,updated,name,contact,seen) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0)', [uid(), $no, $u['user_id'] ?? null, null, mb_substr((string)($in['cat'] ?? 'تماس با ما'), 0, 30), mb_substr($txt, 0, 3000), 'open', '', time(), time(), mb_substr($nm, 0, 80), mb_substr($ct ?: (string)($u['phone'] ?? ''), 0, 120)]);
    YES(['no' => $no]); }
case 'tickets': { $u = auth(); YES(['list' => rows('SELECT no,cat,text,status,reply,created FROM tickets WHERE user_id=? ORDER BY created DESC', [$u['user_id']])]); }

/* test tools (switch off from admin when going public) */
case 'test_fake': {
    if (!flag('test_tools')) NO('ابزار آزمایشی خاموش است.', 403); $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); if (!$pl) NO('اول مکان را در ویزارد انتخاب کنید.');
    $n = max(1, min(12, (int)($in['n'] ?? 5))); $made = []; for ($i = 0; $i < $n; $i++) $made[] = make_fake($me, $pl, !empty($in['driver']) || $i % 3 === 0);
    YES(['made' => count($made)]);
}
case 'test_invite_me': {
    if (!flag('test_tools')) NO('ابزار آزمایشی خاموش است.', 403); $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); if (!$pl) NO('اول مکان را انتخاب کنید.');
    $f = row('SELECT * FROM profiles WHERE place_id=? AND fake=1 AND team_id IS NULL ORDER BY created DESC', [$pl['id']]) ?: row('SELECT * FROM profiles WHERE id=?', [make_fake($me, $pl, true)]);
    if (!gender_age_ok(array_merge(riders_of($me), riders_of($f)))) NO('همسایه‌ی آزمایشی با قانون سن و جنسیت جور نشد؛ دوباره بزنید.');
    $id = uid(); q('INSERT INTO invites(id,from_p,to_p,status,created,responded) VALUES(?,?,?,?,?,NULL)', [$id, $f['id'], $me['id'], 'pending', time()]);
    note($me['id'], 'خانواده‌ی ' . (pdata($f)['family'] ?? '') . ' پیشنهاد هم‌مسیری داده‌اند. (آزمایشی)', 'invite', $id); YES();
}
case 'test_clear': {
    if (!flag('test_tools')) NO('ابزار آزمایشی خاموش است.', 403); $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? ''));
    $n = 0; foreach (rows('SELECT * FROM profiles WHERE place_id=? AND fake=1', [$me['place_id']]) as $f) { wipe_profile($f['id']); q('DELETE FROM users WHERE id=? AND fake=1', [$f['user_id']]); $n++; }
    YES(['removed' => $n]);
}

/* admin */
case 'admin_login': {
    $user = (string)($in['u'] ?? ''); $pass = (string)($in['p'] ?? '');
    $ipk = 'adm_' . ip_tag(); $f = (int)(row('SELECT n FROM hits WHERE k=? AND exp>?', [$ipk, time()])['n'] ?? 0); if ($f >= 8) NO('تلاش ناموفق زیاد شد؛ ۱۵ دقیقه‌ی دیگر امتحان کنید.', 429);
    usleep(300000); if (!hash_equals((string)C('admin_user'), $user) || !hash_equals((string)C('admin_pass'), $pass)) { hit($ipk, 900); NO('نام کاربری یا رمز درست نیست. اگر در config.local.php مقدار admin_pass گذاشته‌اید، همان رمز را بزنید.', 401); }
    YES(['token' => issue_token(null, 1), 'default_pass' => C('admin_pass') === 'mot']);
}
case 'admin_overview': {
    need_admin(); $c = fn($s, $a = []) => (int)q($s, $a)->fetchColumn();
    YES(['counts' => ['users' => $c('SELECT COUNT(*) FROM users WHERE fake=0'), 'fake' => $c('SELECT COUNT(*) FROM users WHERE fake=1'), 'profiles' => $c('SELECT COUNT(*) FROM profiles WHERE fake=0'), 'complete' => $c('SELECT COUNT(*) FROM profiles WHERE complete=1 AND fake=0'),
        'places' => $c('SELECT COUNT(*) FROM places'), 'teams' => $c('SELECT COUNT(*) FROM teams'), 'invites' => $c("SELECT COUNT(*) FROM invites WHERE status='pending'"), 'tickets' => $c("SELECT COUNT(*) FROM tickets WHERE status='open'"), 'sms_day' => $c('SELECT COUNT(*) FROM sms WHERE created>?', [time() - 86400]), 'unseen' => $c('SELECT COUNT(*) FROM tickets WHERE seen=0 OR seen IS NULL')],
        'flags' => ['sms_invite' => flag('sms_invite'), 'sms_arrive' => flag('sms_arrive'), 'auto_arrive' => flag('auto_arrive'), 'test_tools' => flag('test_tools'), 'signup_open' => flag('signup_open'), 'otp_dev' => flag('otp_dev'), 'sms_direct' => flag('sms_direct'), 'league_on' => flag('league_on'), 'paid_mode' => flag('paid_mode'), 'station_on' => flag('station_on')],
        'settings' => ['map_provider' => getv('map_provider', 'neshan'), 'sub_price' => (int)getv('sub_price', '297000'), 'free_permanent' => (int)getv('free_permanent', '1'), 'free_temp_month' => (int)getv('free_temp_month', '2'), 'sub_interest' => (int)getv('sub_interest', '0'), 'kave_sender' => (string)getv('kave_sender', ''), 'kave_sender_auto' => (string)getv('kave_sender_auto', ''), 'donate_card' => (string)getv('donate_card', ''), 'donate_name' => (string)getv('donate_name', ''), 'engine' => db_engine()],
        'services' => ['db' => C('r6_db'), 'php' => PHP_VERSION, 'kavenegar' => (bool)(C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE'), 'neshan_service' => (bool)C('neshan_service_key'), 'neshan_web' => (bool)C('neshan_web_key'), 'curl' => function_exists('curl_init'), 'tpl_login' => C('kavenegar_template', 'residim-login'), 'tpl_invite' => C('kavenegar_tpl_invite'), 'tpl_arrived' => C('kavenegar_tpl_arrived')],
        'default_pass' => C('admin_pass') === 'mot']);
}
case 'admin_flag': { need_admin(); $k = (string)($in['k'] ?? ''); if (!in_array($k, ['sms_invite', 'sms_arrive', 'auto_arrive', 'test_tools', 'signup_open', 'otp_dev', 'sms_direct', 'league_on', 'paid_mode', 'station_on'], true)) NO('کلید نامعتبر.'); setv($k, !empty($in['v']) ? '1' : '0'); YES(); }
case 'sub_interest': { $u = auth(); $k = 'subi_' . $u['user_id']; if (getv($k) === null) { setv($k, (string)time()); setv('sub_interest', (string)((int)getv('sub_interest', '0') + 1)); } YES(); }
case 'admin_seen': { need_admin(); q('UPDATE tickets SET seen=1 WHERE seen=0 OR seen IS NULL'); YES(); }
case 'admin_ticket_close': { need_admin(); q("UPDATE tickets SET status=?, updated=? WHERE id=?", [!empty($in['open']) ? 'open' : 'closed', time(), (string)($in['id'] ?? '')]); YES(); }
/* MySQL: save credentials to a protected server file, smoke test, copy SQLite -> MySQL, switch */
case 'admin_mysql_get': { need_admin(); $c = mysql_cfg(); YES(['host' => $c['host'] ?? 'localhost', 'port' => (int)($c['port'] ?? 3306), 'name' => $c['name'] ?? '', 'user' => $c['user'] ?? '', 'pass_set' => !empty($c['pass']), 'active' => !empty($c['active']), 'engine' => db_engine(), 'tested' => $c['tested'] ?? null, 'migrated' => $c['migrated'] ?? null, 'pdo_mysql' => in_array('mysql', PDO::getAvailableDrivers(), true), 'locked' => C('r6_db') === 'mysql']); }
case 'admin_mysql_save': { need_admin(); $c = mysql_cfg();
    foreach (['host', 'name', 'user'] as $k) if (isset($in[$k])) $c[$k] = mb_substr(trim((string)$in[$k]), 0, 120);
    $c['port'] = max(1, min(65535, (int)($in['port'] ?? ($c['port'] ?? 3306)))); if ((string)($in['pass'] ?? '') !== '') $c['pass'] = (string)$in['pass'];
    if (!preg_match('/^[A-Za-z0-9_.\-]+$/', (string)($c['host'] ?? '')) || !preg_match('/^[A-Za-z0-9_\-]+$/', (string)($c['name'] ?? ''))) NO('نام میزبان یا پایگاه داده نامعتبر است.');
    $c['tested'] = null; $c['migrated'] = null; if (!empty($c['active'])) NO('اول به SQLite برگردید، بعد مشخصات را عوض کنید.'); mysql_save($c); YES(); }
case 'admin_mysql_test': { need_admin(); $c = mysql_cfg(); if (empty($c['name'])) NO('اول مشخصات را ذخیره کنید.');
    try { $m = mysql_pdo($c); $t = 'r6_smoke_' . bin2hex(random_bytes(3)); $m->exec("CREATE TABLE $t (k VARCHAR(20) PRIMARY KEY, v TEXT) DEFAULT CHARSET=utf8mb4"); $m->prepare("INSERT INTO $t(k,v) VALUES(?,?)")->execute(['fa', 'رسیدیم ✓']);
        $v = $m->query("SELECT v FROM $t WHERE k='fa'")->fetchColumn(); $m->exec("DROP TABLE $t"); $ver = $m->query('SELECT VERSION()')->fetchColumn();
        if ($v !== 'رسیدیم ✓') throw new RuntimeException('متن فارسی درست برنگشت (charset).'); $c['tested'] = time(); mysql_save($c); YES(['version' => $ver]); }
    catch (Throwable $e) { NO('اتصال ناموفق: ' . mb_substr($e->getMessage(), 0, 200)); } }
case 'admin_mysql_migrate': { need_admin(); $c = mysql_cfg(); if (empty($c['tested'])) NO('اول تست دود را موفق بگذرانید.'); if (!empty($c['active'])) NO('الان روی MySQL هستید.');
    try { $src = sqlite_pdo(); $m = mysql_pdo($c); schema($m); $counts = [];
        foreach (R6_TABLES as $tb) { try { $rs = $src->query("SELECT * FROM $tb")->fetchAll(); } catch (Throwable $e) { continue; }
            $m->exec("DELETE FROM $tb"); $counts[$tb] = 0; if (!$rs) continue; $cols = array_keys($rs[0]);
            $ins = $m->prepare("INSERT INTO $tb(" . implode(',', array_map(fn($x) => "`$x`", $cols)) . ') VALUES(' . implode(',', array_fill(0, count($cols), '?')) . ')');
            $m->beginTransaction(); foreach ($rs as $r) { $ins->execute(array_values($r)); $counts[$tb]++; } $m->commit();
            $n = (int)$m->query("SELECT COUNT(*) FROM $tb")->fetchColumn(); if ($n !== count($rs)) throw new RuntimeException("$tb: $n از " . count($rs)); }
        $c['migrated'] = time(); $c['counts'] = $counts; mysql_save($c); YES(['counts' => $counts]); }
    catch (Throwable $e) { NO('انتقال ناموفق: ' . mb_substr($e->getMessage(), 0, 200)); } }
case 'admin_mysql_switch': { need_admin(); $c = mysql_cfg(); $on = !empty($in['on']);
    if ($on && empty($c['migrated'])) NO('اول انتقال داده‌ها را انجام دهید.'); if ($on) { mysql_pdo($c); }
    $c['active'] = $on; if (!$on) $c['migrated'] = null; mysql_save($c); YES(['engine' => $on ? 'mysql' : 'sqlite']); }
/* Neshan: schools near a point, import as places for posters */
case 'admin_neshan_search': { need_admin(); $lat = (float)($in['lat'] ?? 0); $lng = (float)($in['lng'] ?? 0); if (!$lat) NO('مرکز جستجو را انتخاب کنید.'); if (!C('neshan_service_key')) NO('کلید سرویس نشان تنظیم نشده است.');
    $seen = []; $out = []; $all = rows('SELECT id,name,lat,lng,code FROM places');
    foreach ((array)($in['terms'] ?? ['دبستان', 'مدرسه', 'دبیرستان']) as $term) { $r = neshan('/v1/search', ['term' => mb_substr((string)$term, 0, 40), 'lat' => $lat, 'lng' => $lng]);
        foreach ((array)($r['items'] ?? []) as $it) { $x = (float)($it['location']['x'] ?? 0); $y = (float)($it['location']['y'] ?? 0); $t = trim((string)($it['title'] ?? '')); if (!$x || $t === '') continue;
            $key = $t . '|' . round($y, 4) . '|' . round($x, 4); if (isset($seen[$key])) continue; $seen[$key] = 1; $have = null;
            foreach ($all as $pp) if (hav($y, $x, (float)$pp['lat'], (float)$pp['lng']) < 150 && pname_norm($pp['name']) === pname_norm($t)) { $have = $pp['code']; break; }
            $out[] = ['title' => $t, 'address' => (string)($it['address'] ?? ''), 'region' => (string)($it['region'] ?? ''), 'type' => (string)($it['type'] ?? ''), 'lat' => $y, 'lng' => $x, 'd' => (int)hav($lat, $lng, $y, $x), 'code' => $have]; } }
    usort($out, fn($a, $b) => $a['d'] <=> $b['d']); YES(['items' => array_slice($out, 0, 120)]); }
case 'admin_import_places': { need_admin(); $made = [];
    foreach (array_slice((array)($in['items'] ?? []), 0, 100) as $it) { $nm = trim((string)($it['title'] ?? '')); $la = (float)($it['lat'] ?? 0); $lo = (float)($it['lng'] ?? 0); if (mb_strlen($nm) < 3 || !$la) continue;
        $ex = null; foreach (rows('SELECT * FROM places') as $pp) if (hav($la, $lo, (float)$pp['lat'], (float)$pp['lng']) < 150 && pname_norm($pp['name']) === pname_norm($nm)) { $ex = $pp; break; }
        if (!$ex) { $g = mb_strpos($nm, 'دخترانه') !== false ? 'f' : (mb_strpos($nm, 'پسرانه') !== false ? 'm' : 'fm'); $kind = preg_match('/مهد|پیش ?دبستان/u', $nm) ? 'kinder' : 'school';
            $id = uid(); q('INSERT INTO places(id,code,kind,name,city,gender,shift,lat,lng,t_in,t_out,days,created_by,verified,fake,created,nv,nv_title) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,NULL,0,0,?,1,?)', [$id, code8(), $kind, mb_substr($nm, 0, 150), mb_substr((string)($it['city'] ?? 'تهران'), 0, 50), $g, '', $la, $lo, '07:30', '13:30', '0,1,2,3,4', time(), mb_substr($nm, 0, 150)]);
            $ex = row('SELECT * FROM places WHERE id=?', [$id]); }
        $o = place_out($ex, false); $o['address'] = (string)($it['address'] ?? ''); $made[] = $o; }
    YES(['places' => $made]); }
case 'admin_setting': { need_admin(); $k = (string)($in['k'] ?? ''); $v = trim((string)($in['v'] ?? ''));
    if ($k === 'map_provider' && in_array($v, ['neshan', 'openfree'], true)) setv($k, $v);
    elseif (in_array($k, ['sub_price', 'free_permanent', 'free_temp_month'], true) && ctype_digit($v)) setv($k, $v);
    elseif ($k === 'kave_sender' && ($v === '' || ctype_digit($v))) { setv($k, $v); setv('kave_sender_at', '0'); }
    elseif ($k === 'donate_card' && ($v === '' || preg_match('/^\d{16}$/', $v))) setv($k, $v);
    elseif ($k === 'donate_name') setv($k, mb_substr($v, 0, 60));
    else NO('مقدار نامعتبر.'); YES(); }
case 'admin_premium_user': { need_admin(); $ph = phone_norm((string)($in['phone'] ?? '')); $u = $ph ? row('SELECT id FROM users WHERE phone=?', [$ph]) : null; if (!$u) NO('کاربری با این شماره نیست.');
    $days = max(0, min(3650, (int)($in['days'] ?? 30))); q('UPDATE users SET premium_until=? WHERE id=?', [$days ? time() + $days * 86400 : 0, $u['id']]); YES(['until' => $days ? time() + $days * 86400 : 0]); }
case 'admin_place_nv': { need_admin(); $pl = row('SELECT * FROM places WHERE id=?', [(string)($in['id'] ?? '')]); if (!$pl) NO('پیدا نشد.'); $r = neshan_check($pl); YES(['result' => $r]); }
case 'admin_places': { need_admin(); YES(['list' => array_map(fn($p) => place_out($p), rows('SELECT * FROM places ORDER BY created DESC LIMIT 200'))]); }
case 'admin_place': { need_admin(); $id = (string)($in['id'] ?? ''); if (!empty($in['delete'])) { foreach (rows('SELECT id FROM profiles WHERE place_id=?', [$id]) as $p) q('UPDATE profiles SET place_id=NULL, team_id=NULL, complete=0 WHERE id=?', [$p['id']]); q('DELETE FROM teams WHERE place_id=?', [$id]); q('DELETE FROM places WHERE id=?', [$id]); YES(); }
    if (isset($in['verified'])) q('UPDATE places SET verified=? WHERE id=?', [!empty($in['verified']) ? 1 : 0, $id]); if (!empty($in['name'])) q('UPDATE places SET name=? WHERE id=?', [mb_substr((string)$in['name'], 0, 150), $id]); YES(); }
case 'admin_teams': { need_admin(); $l = []; foreach (rows('SELECT t.*, p.name pname FROM teams t LEFT JOIN places p ON p.id=t.place_id ORDER BY t.created DESC LIMIT 200') as $t) { $o = team_out($t); $o['place'] = $t['pname']; $o['members'] = (int)q('SELECT COUNT(*) FROM profiles WHERE team_id=?', [$t['id']])->fetchColumn(); $l[] = $o; } YES(['list' => $l]); }
case 'admin_team': { need_admin(); q('UPDATE teams SET premium=? WHERE id=?', [!empty($in['premium']) ? 1 : 0, (string)($in['id'] ?? '')]); YES(); }
case 'admin_tickets': { need_admin(); YES(['list' => rows('SELECT t.id,t.no,t.cat,t.text,t.status,t.reply,t.created,t.name,t.contact,t.seen,u.phone FROM tickets t LEFT JOIN users u ON u.id=t.user_id ORDER BY t.created DESC LIMIT 200')]); }
case 'admin_ticket': { need_admin(); q('UPDATE tickets SET reply=?, status=?, updated=? WHERE id=?', [mb_substr((string)($in['reply'] ?? ''), 0, 2000), in_array($in['status'] ?? '', ['open', 'answered', 'closed'], true) ? $in['status'] : 'answered', time(), (string)($in['id'] ?? '')]); YES(); }
case 'admin_users': { need_admin(); YES(['list' => rows('SELECT u.phone,u.fake,u.created,(SELECT COUNT(*) FROM profiles p WHERE p.user_id=u.id) profiles FROM users u ORDER BY u.created DESC LIMIT 200')]); }
case 'admin_sms': { need_admin(); YES(['list' => rows('SELECT phone,tpl,status,created FROM sms ORDER BY created DESC LIMIT 100')]); }
case 'admin_sms_test': {
    need_admin(); $ph = phone_norm((string)($in['phone'] ?? '')); if (!$ph) NO('شماره نامعتبر است.');
    $tpl = (string)($in['tpl'] ?? C('kavenegar_template', 'residim-login')); $tok = ['token' => '12345'];
    if ($tpl === C('kavenegar_tpl_invite')) $tok = ['token' => 'TEST2345', 'token10' => 'آزمایشی', 'token20' => 'مدرسه آزمایشی'];
    if ($tpl === C('kavenegar_tpl_arrived')) $tok = ['token' => date('H:i'), 'token2' => 'آزمایشی', 'token10' => 'فرزند آزمایشی', 'token20' => 'مدرسه'];
    $r = kave($ph, $tpl, $tok, null, ($in['type'] ?? '') === 'call' ? 'call' : 'sms');
    YES(['result' => $r, 'direct' => flag('sms_direct') && ($in['type'] ?? '') !== 'call', 'key_set' => (bool)(C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE'), 'template' => $tpl]);
}
case 'admin_fake': { // test users around a place (by code) or around a real user's home (by phone)
    need_admin(); $n = max(1, min(50, (int)($in['n'] ?? 5))); $tgt = trim((string)($in['target'] ?? ''));
    $ph = phone_norm($tgt); $place = null; $me = null;
    if ($ph) { $u = row('SELECT id FROM users WHERE phone=? AND fake=0', [$ph]); if (!$u) NO('کاربر واقعی با این شماره نیست.');
        $me = row('SELECT * FROM profiles WHERE user_id=? AND complete=1 AND place_id IS NOT NULL ORDER BY updated DESC', [$u['id']]); if (!$me) NO('این کاربر هنوز مسیرکِ کامل ندارد.');
        $place = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); }
    else { $place = row('SELECT * FROM places WHERE code=?', [strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $tgt))]); if (!$place) NO('کد مکان یا شماره‌ی کاربر را درست بنویسید.');
        $me = ['data' => json_encode(['lat' => (float)$place['lat'], 'lng' => (float)$place['lng'], 'pg' => random_int(0, 1) ? 'f' : 'm'])]; }
    $dr = max(0, min(100, (int)($in['drivers'] ?? 35))); $made = 0;
    for ($i = 0; $i < $n; $i++) { make_fake($me, $place, random_int(1, 100) <= $dr); $made++; }
    YES(['made' => $made, 'place' => $place['name']]); }
case 'admin_purge_fake': { need_admin(); $n = 0; foreach (rows('SELECT * FROM profiles WHERE fake=1') as $f) { wipe_profile($f['id']); $n++; } q('DELETE FROM users WHERE fake=1'); YES(['removed' => $n]); }

default: NO('درخواست ناشناخته.', 404);
}
} catch (Throwable $e) {
    error_log('[r6] ' . $e->getMessage() . ' @' . $e->getLine());
    NO('خطای سرور؛ کمی بعد دوباره تلاش کنید.', 500, 'server');
}
} // R6_MAIN

/* accept helpers (declared after router for readability; PHP hoists functions) */
function accept_invite(array $i, array $from, array $to): ?array {
    $from = row('SELECT * FROM profiles WHERE id=?', [$from['id']]); $to = row('SELECT * FROM profiles WHERE id=?', [$to['id']]);
    $all = array_merge(riders_of($from), riders_of($to)); foreach ([$from['team_id'], $to['team_id']] as $tid) if ($tid) foreach (rows('SELECT * FROM profiles WHERE team_id=?', [$tid]) as $x) if ($x['id'] !== $from['id'] && $x['id'] !== $to['id']) $all = array_merge($all, riders_of($x));
    if (!team_rule_ok(row('SELECT * FROM places WHERE id=?', [$from['place_id']]), $all)) { q('UPDATE invites SET status=?, responded=? WHERE id=?', ['declined', time(), $i['id']]); throw new RuntimeException('طبق قانون سن و جنسیت این هم‌تیمی ممکن نیست.'); }
    if ($from['team_id'] && $to['team_id']) { q('UPDATE invites SET status=?, responded=? WHERE id=?', ['declined', time(), $i['id']]); throw new RuntimeException('هر دو در تیم هستید.'); }
    $place = row('SELECT * FROM places WHERE id=?', [$from['place_id']]);
    if ($from['team_id']) { $t = row('SELECT * FROM teams WHERE id=?', [$from['team_id']]); team_join($t, $to); }
    elseif ($to['team_id']) { $t = row('SELECT * FROM teams WHERE id=?', [$to['team_id']]); team_join($t, $from); }
    else $t = team_create($place, [$from, $to]);
    q('UPDATE invites SET status=?, responded=? WHERE id=?', ['accepted', time(), $i['id']]);
    $t = row('SELECT * FROM teams WHERE id=?', [$t['id']]); $name = 'تیم ' . $t['no'] . ' · محله ' . $t['hood'];
    foreach (rows('SELECT id FROM profiles WHERE team_id=?', [$t['id']]) as $m) note($m['id'], "$name شکل گرفت/بزرگ‌تر شد! خوش آمدید.", 'team', $t['id']);
    return team_out($t);
}
/** Test neighbours accept a few seconds after an invite; resolved lazily when the inviter polls. */
function settle_auto(string $pid): void {
    foreach (rows("SELECT * FROM invites WHERE from_p=? AND status='autoaccept' AND responded<=?", [$pid, time()]) as $i) {
        q("UPDATE invites SET status='pending' WHERE id=?", [$i['id']]);
        $from = row('SELECT * FROM profiles WHERE id=?', [$i['from_p']]); $to = row('SELECT * FROM profiles WHERE id=?', [$i['to_p']]);
        if (!$from || !$to || ($from['team_id'] && $to['team_id'])) { q("UPDATE invites SET status='declined' WHERE id=?", [$i['id']]); continue; }
        try { accept_invite($i, $from, $to); note($pid, 'خانواده‌ی ' . (pdata($to)['family'] ?? '') . ' پیشنهادتان را پذیرفتند! (همسایه‌ی آزمایشی)', 'team'); } catch (Throwable $e) {}
    }
}
