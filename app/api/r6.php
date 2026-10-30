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
    if (!isset($c['_sec'])) { $c['_sec'] = 1; foreach (secrets_all() as $sk => $sv) if ($sv !== '' && in_array($sk, SECRET_KEYS, true)) $c[$sk] = $sv; }
    return $c[$k] ?? $def;
}
const SECRET_FILE = __DIR__ . '/../storage/secrets.local.php';
const SECRET_KEYS = ['fcm_service_json', 'bale_client_id', 'bale_client_secret', 'kavenegar_api_key', 'kavenegar_template', 'kavenegar_tpl_invite', 'kavenegar_tpl_arrived', 'kavenegar_tpl_call', 'smsir_api_key', 'smsir_line', 'smsir_tpl_login', 'smsir_tpl_invite', 'smsir_tpl_arrived', 'payping_token_live', 'payping_token_test', 'neshan_service_key', 'neshan_web_key'];
const SECRET_HIDDEN = ['fcm_service_json', 'bale_client_secret', 'kavenegar_api_key', 'smsir_api_key', 'payping_token_live', 'payping_token_test', 'neshan_service_key', 'neshan_web_key'];
/* Files are read as data (not include) so OPcache can never serve a stale copy; the first line stops PHP if requested directly. */
function guarded_read(string $f): array { if (!is_file($f)) return []; $t = (string)@file_get_contents($f); if (str_starts_with($t, '<?php')) { $i = strpos($t, "\n"); $t = $i === false ? '' : substr($t, $i + 1); } $v = json_decode($t, true); if (!is_array($v) && str_contains($t, 'return ')) { $v = @include $f; } return is_array($v) ? $v : []; }
function guarded_write(string $f, array $v): void { $tmp = $f . '.tmp'; file_put_contents($tmp, "<?php exit; ?>\n" . json_encode($v, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)); @chmod($tmp, 0600); rename($tmp, $f); if (function_exists('opcache_invalidate')) @opcache_invalidate($f, true); }
function secrets_all(): array { static $x = null; if ($x === null) $x = guarded_read(SECRET_FILE); return $x; }
function secrets_save(array $v): void { guarded_write(SECRET_FILE, $v); }
function J($d, int $s = 200): never { http_response_code($s); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function YES(array $d = []): never { J(['ok' => true] + $d); }
function NO(string $msg, int $s = 400, string $code = 'error'): never { J(['ok' => false, 'error' => $code, 'message' => $msg], $s); }

/* ───────── db ───────── */
const MYSQL_FILE = __DIR__ . '/../storage/mysql.local.php';
function mysql_cfg(): array { return guarded_read(MYSQL_FILE); }
function mysql_save(array $c): void { guarded_write(MYSQL_FILE, $c); }
function mysql_pdo(array $c): PDO {
    $dsn = 'mysql:host=' . ($c['host'] ?? 'localhost') . ';port=' . (int)($c['port'] ?? 3306) . ';dbname=' . ($c['name'] ?? '') . ';charset=utf8mb4';
    $p = new PDO($dsn, (string)($c['user'] ?? ''), (string)($c['pass'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_TIMEOUT => 8]);
    $p->exec("SET NAMES utf8mb4"); return $p;
}
function sqlite_pdo(): PDO { $dir = dirname(__DIR__) . '/storage'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
    $p = new PDO('sqlite:' . $dir . '/r6.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $p->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=4000'); return $p; }
const R6_TABLES = ['feedback', 'fb_likes', 'amb', 'referrals', 'payments', 'errors', 'hits', 'live', 'settings', 'users', 'tokens', 'otps', 'places', 'profiles', 'teams', 'invites', 'trips', 'ledger', 'notes', 'dist', 'tickets', 'quiz', 'sms', 'msgs', 'place_flags'];
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
    if ($v >= 11) return;
    if ($v >= 9) { if ($v < 10) schema10($p); schema11($p); return; }
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
    try { $p->exec('CREATE TABLE IF NOT EXISTS payments (id VARCHAR(40) PRIMARY KEY, ref VARCHAR(24) UNIQUE, purpose VARCHAR(16), amount INT, env VARCHAR(8), status VARCHAR(16), code VARCHAR(80), refid VARCHAR(40), card VARCHAR(40), name VARCHAR(80), mobile VARCHAR(20), user_id VARCHAR(40), note VARCHAR(255), created INT, updated INT)' . ($p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '')); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS errors (id VARCHAR(40) PRIMARY KEY, src VARCHAR(8), msg VARCHAR(500), at_url VARCHAR(255), ua VARCHAR(160), n INT DEFAULT 1, sig VARCHAR(64), created INT, last INT)' . ($p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '')); } catch (Throwable $e) {}
    $my = $p->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' DEFAULT CHARSET=utf8mb4' : '';
    try { $p->exec('ALTER TABLE trips ADD COLUMN ev TEXT'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE users ADD COLUMN client VARCHAR(24)'); } catch (Throwable $e) {}
    try { $p->exec('ALTER TABLE users ADD COLUMN seen INT DEFAULT 0'); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS feedback (id VARCHAR(40) PRIMARY KEY, user_id VARCHAR(40), stars INT, cat VARCHAR(30), text TEXT, pub INT DEFAULT 0, likes INT DEFAULT 0, created INT)' . $my); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS fb_likes (fb_id VARCHAR(40), voter VARCHAR(40), created INT, PRIMARY KEY(fb_id, voter))'); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS amb (id VARCHAR(40) PRIMARY KEY, token VARCHAR(40) UNIQUE, code VARCHAR(12) UNIQUE, name VARCHAR(80), phone VARCHAR(20), rate_profile INT, rate_team INT, note VARCHAR(255), active INT DEFAULT 1, created INT)' . $my); } catch (Throwable $e) {}
    try { $p->exec('CREATE TABLE IF NOT EXISTS referrals (id VARCHAR(40) PRIMARY KEY, amb_id VARCHAR(40), user_id VARCHAR(40), profile_id VARCHAR(40), place_id VARCHAR(40), kind VARCHAR(10), amount INT, paid INT DEFAULT 0, created INT)' . $my); } catch (Throwable $e) {}
    setv('schema', '9', $p); schema10($p); schema11($p);
    foreach (['sms_invite' => '1', 'sms_arrive' => '0', 'auto_arrive' => '1', 'test_tools' => '1', 'signup_open' => '1', 'otp_dev' => '0', 'sms_direct' => '1', 'sms_provider' => 'kavenegar', 'otp_bale' => '0', 'pay_gateway' => '0', 'pay_env' => 'test', 'league_on' => '0', 'paid_mode' => '0', 'station_on' => '1', 'map_provider' => 'neshan', 'sub_price' => '297000', 'free_permanent' => '1', 'free_temp_month' => '2'] as $k => $val) if (getv($k, null, $p) === null) setv($k, $val, $p);
}
function schema10(PDO $p): void { // v17: family link, pact, push tokens; league off for launch
    $K = 'VARCHAR(40)';
    foreach (["CREATE TABLE IF NOT EXISTS fam_links (profile_id $K, user_id $K, role VARCHAR(8), created INT, PRIMARY KEY(profile_id, user_id))",
        "CREATE TABLE IF NOT EXISTS fam_codes (code VARCHAR(12) PRIMARY KEY, profile_id $K, by_user $K, created INT)",
        "CREATE TABLE IF NOT EXISTS push_tokens (token VARCHAR(255) PRIMARY KEY, user_id $K, created INT)",
        'ALTER TABLE teams ADD COLUMN pact TEXT', "ALTER TABLE teams ADD COLUMN pact_by $K", 'ALTER TABLE teams ADD COLUMN pact_at INT'] as $sql) { try { $p->exec($sql); } catch (Throwable $e) {} }
    setv('league_on', '0', $p); setv('schema', '10', $p);
}
function schema11(PDO $p): void { // v18: get-to-know messages before a team, team agreement, trusted drivers
    $K = 'VARCHAR(40)';
    foreach (["CREATE TABLE IF NOT EXISTS invite_msgs (id $K PRIMARY KEY, invite_id $K, profile_id $K, text VARCHAR(500), created INT)",
        "CREATE TABLE IF NOT EXISTS trust_inv (code VARCHAR(12) PRIMARY KEY, team_id $K, by_profile $K, name VARCHAR(80), note VARCHAR(200), seats INT, accepted TEXT, user_id $K, profile_id $K, created INT)",
        'ALTER TABLE teams ADD COLUMN agree TEXT', 'ALTER TABLE places ADD COLUMN trusted INT DEFAULT 0'] as $sql) { try { $p->exec($sql); } catch (Throwable $e) {} }
    setv('schema', '11', $p);
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
/** Is «now» inside the real window of this slot? out: 2h before the bell to 1.5h after; back: 1h before to 3h after. */
function trip_now(array $t, string $slot): bool { $pl = row('SELECT * FROM places WHERE id=?', [$t['place_id']]); if (!$pl) return true;
    [$d, $dir] = explode('-', $slot) + ['0', 'out']; if ((int)$d !== ((int)date('w') + 1) % 7) return false; $now = (int)date('G') * 60 + (int)date('i');
    $mins = fn($hm) => preg_match('/^(\d{1,2}):(\d{2})/', (string)$hm, $m) ? (int)$m[1] * 60 + (int)$m[2] : null;
    foreach ($dir === 'out' ? [$pl['t_in'] ?? '07:30', $pl['t_in2'] ?? null] : [$pl['t_out'] ?? '13:30', $pl['t_out2'] ?? null] as $hm) { $x = $mins($hm); if ($x === null) continue;
        if ($dir === 'out' ? ($now >= $x - 120 && $now <= $x + 90) : ($now >= $x - 60 && $now <= $x + 180)) return true; }
    return false; }
function week_key(): string { return date('o-W', time() + 2 * 86400); } // Saturday-start weeks
function phone_norm(string $p): string {
    $p = strtr($p, ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9','٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9']);
    $p = preg_replace('/\D/', '', $p);
    if (str_starts_with($p, '0098')) $p = '0' . substr($p, 4); elseif (str_starts_with($p, '98') && strlen($p) === 12) $p = '0' . substr($p, 2); elseif (str_starts_with($p, '9') && strlen($p) === 10) $p = '0' . $p;
    return preg_match('/^09\d{9}$/', $p) ? $p : '';
}
function pdata(array $p): array { $d = json_decode((string)$p['data'], true); return is_array($d) ? $d : []; }
function riders_of(array $p): array { // kids for child-kinds, the member themself otherwise; a trusted driver carries nobody of their own
    $d = pdata($p); if (!empty($d['trusted'])) return [];
    if (!empty($d['kids'])) return array_map(fn($k) => ['id' => $k['id'] ?? '', 'g' => $k['g'] ?? 'f', 'age' => isset($k['by']) ? max(0, jyear() - (int)$k['by']) : null, 'first' => $k['first'] ?? ''], $d['kids']);
    return [['id' => $p['id'] . '-s', 'g' => $d['pg'] ?? 'f', 'age' => 30, 'first' => '']];
}
const TEMP_KINDS = ['station'];
function team_rule_ok(?array $place, array $riders): bool {
    if ($place && in_array($place['kind'], TEMP_KINDS, true)) { $g = array_unique(array_column($riders, 'g')); return count($g) <= 1; }
    return gender_age_ok($riders);
}
/** One car: at most 4 riders, 5 only when every child is under 9; adult kinds: driver + 4 = 5 members. Car models change, so seats are never trusted. */
function team_cap(array $riders): int { if (!$riders) return 5; $adult = true; foreach ($riders as $r) if (!str_ends_with((string)$r['id'], '-s')) $adult = false; if ($adult) return 5;
    foreach ($riders as $r) if ($r['age'] === null || $r['age'] >= 9) return 4; return 5; }
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
function neshan(string $path, array $qs): ?array { $k = C('neshan_service_key'); if (!$k) { $GLOBALS['NESHAN_ERR'] = 'کلید سرویس نشان تنظیم نشده'; return null; } $r = http_get('https://api.neshan.org' . $path . '?' . http_build_query($qs), ['Api-Key: ' . $k]); if ($r === null) $GLOBALS['NESHAN_ERR'] = 'نشان جواب نداد (کلید سرویس باید دسترسی «جستجو» داشته باشد، یا سهمیه تمام شده)'; return $r; }
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
/** One entry point for every SMS. Provider and mode are switched from the admin panel. */
function kave(string $phone, string $tpl, array $tokens, ?string $by = null, string $type = 'sms'): array {
    if (getv('sms_provider', 'kavenegar') === 'smsir') return smsir($phone, $tpl, $tokens, $by);
    if ($type !== 'call' && flag('sms_direct')) return kave_send($phone, sms_text($tpl, $tokens), $tpl, $by);
    if ($type === 'call' && $tpl === C('kavenegar_template', 'residim-login')) $tpl = (string)C('kavenegar_tpl_call', 'residim-call');
    return kave_lookup($phone, $tpl, $tokens, $by, $type);
}
/** Bale «سفیر» OTP: client-credentials token (cached), then send_otp. The code arrives in the user's Bale app. */
const BALE_API = 'https://safir.bale.ai/api/v2/';
function bale_token(): string {
    if ((int)getv('bale_tok_exp', '0') > time() + 60 && getv('bale_tok', '') !== '') return (string)getv('bale_tok');
    $body = http_build_query(['grant_type' => 'client_credentials', 'client_id' => (string)C('bale_client_id'), 'client_secret' => (string)C('bale_client_secret'), 'scope' => 'read']);
    $c = curl_init(BALE_API . 'auth/token'); curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json']]);
    $raw = (string)curl_exec($c); $h = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); $err = curl_error($c); curl_close($c); $j = json_decode($raw, true) ?: [];
    if (empty($j['access_token'])) { setv('bale_last_err', mb_substr(($j['message'] ?? $j['error_description'] ?? $j['error'] ?? '') ?: ($err ?: 'HTTP ' . $h), 0, 200)); return ''; }
    setv('bale_tok', (string)$j['access_token']); setv('bale_tok_exp', (string)(time() + (int)($j['expires_in'] ?? 3600))); return (string)$j['access_token'];
}
function bale_otp(string $phone, string $code): array {
    $res = ['ok' => false, 'code' => 0, 'msg' => 'skipped']; $tok = bale_token();
    if ($tok === '') $res['msg'] = 'توکن سفیر: ' . getv('bale_last_err', '');
    else { $intl = '98' . substr($phone, 1);
        [$h, $raw] = http_json('POST', BALE_API . 'send_otp', ['phone' => $intl, 'otp' => (int)$code], ['Authorization: Bearer ' . $tok]);
        if ($h === 401) { setv('bale_tok_exp', '0'); $tok = bale_token(); if ($tok) [$h, $raw] = http_json('POST', BALE_API . 'send_otp', ['phone' => $intl, 'otp' => (int)$code], ['Authorization: Bearer ' . $tok]); }
        $j = json_decode($raw, true) ?: []; $tp = (int)($j['type'] ?? 0); $cd = (int)($j['code'] ?? 0);
        if ($h === 200 && !isset($j['message'])) $res = ['ok' => true, 'code' => 200, 'msg' => 'sent'];
        else $res = ['ok' => false, 'code' => $cd ?: $h, 'msg' => $tp === 3 && $cd === 17 ? 'این شماره در بله حساب ندارد' : ($tp === 2 && $cd === 8 ? 'شماره نامعتبر است' : ($tp === 2 && $cd === 20 ? 'اعتبار سفیر کافی نیست' : ((string)($j['message'] ?? '') ?: 'HTTP ' . $h)))]; }
    try { q('INSERT INTO sms(id,phone,tpl,status,by_user,created) VALUES(?,?,?,?,?,?)', [uid(), $phone, 'بله (سفیر)', $res['ok'] ? 'sent' : ('err ' . $res['code'] . ': ' . $res['msg']), null, time()]); } catch (Throwable $e) {}
    return $res;
}
function sms_ready(): bool { return getv('sms_provider', 'kavenegar') === 'smsir' ? (bool)C('smsir_api_key') : (bool)(C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE'); }
const SMSIR_ERR = [0 => 'خطای ارتباط', 10 => 'کلید API نامعتبر است', 11 => 'کلید API غیرفعال است', 12 => 'کلید به این IP دسترسی ندارد', 13 => 'حساب کاربری غیرفعال است', 14 => 'حساب در حالت تعلیق است', 20 => 'تعداد درخواست بیش از حد مجاز', 101 => 'شماره خط نامعتبر است', 102 => 'اعتبار کافی نیست', 103 => 'متن پیام خالی است', 104 => 'شماره موبایل نامعتبر است', 105 => 'تعداد گیرندگان بیش از حد مجاز', 106 => 'شماره خط به شما تعلق ندارد', 107 => 'شناسه الگو نامعتبر است', 108 => 'پارامترهای الگو کامل نیست', 111 => 'الگو تأیید نشده است'];
function smsir(string $phone, string $tpl, array $t, ?string $by = null): array {
    $key = (string)C('smsir_api_key'); $res = ['ok' => false, 'code' => 0, 'msg' => 'skipped']; $mode = flag('sms_direct') ? 'مستقیم' : 'الگو';
    if ($key && $phone && !str_starts_with($phone, '0900')) {
        if (flag('sms_direct')) { $url = 'https://api.sms.ir/v1/send/bulk'; $body = ['lineNumber' => (int)C('smsir_line'), 'messageText' => sms_text($tpl, $t), 'mobiles' => [$phone], 'sendDateTime' => null]; }
        else {
            $g = fn($k) => (string)($t[$k] ?? '');
            [$tid, $pr] = $tpl === C('kavenegar_tpl_invite') ? [C('smsir_tpl_invite'), ['CODE' => $g('token'), 'FAMILY' => $g('token10'), 'PLACE' => $g('token20')]]
                : ($tpl === C('kavenegar_tpl_arrived') ? [C('smsir_tpl_arrived'), ['TIME' => $g('token'), 'DRIVER' => $g('token2'), 'KID' => $g('token10'), 'PLACE' => $g('token20')]]
                : [C('smsir_tpl_login'), ['CODE' => $g('token')]]);
            $url = 'https://api.sms.ir/v1/send/verify'; $body = ['mobile' => $phone, 'templateId' => (int)$tid, 'parameters' => array_map(fn($k, $v) => ['name' => $k, 'value' => $v], array_keys($pr), $pr)];
        }
        [$http, $raw] = http_json('POST', $url, $body, ['X-API-KEY: ' . $key]); $j = json_decode($raw, true); $st = (int)($j['status'] ?? 0);
        $res = ['ok' => $st === 1, 'code' => $st ?: $http, 'msg' => $st === 1 ? 'sent' : ((string)($j['message'] ?? '') ?: (SMSIR_ERR[$st] ?? ($http ? 'HTTP ' . $http : mb_substr($raw, 0, 120))))];
    }
    try { q('INSERT INTO sms(id,phone,tpl,status,by_user,created) VALUES(?,?,?,?,?,?)', [uid(), $phone, 'sms.ir ' . $tpl . ' (' . $mode . ')', $res['ok'] ? 'sent' : ('err ' . $res['code'] . ': ' . $res['msg']), $by, time()]); } catch (Throwable $e) {}
    return $res;
}
/** JSON request with curl (falls back to streams). Returns [httpCode, body]. */
function http_json(string $method, string $url, ?array $body, array $headers = [], int $timeout = 20): array {
    $h = array_merge(['Content-Type: application/json', 'Accept: application/json'], $headers); $payload = $body === null ? null : json_encode($body, JSON_UNESCAPED_UNICODE);
    if (function_exists('curl_init')) { $c = curl_init($url); curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_HTTPHEADER => $h, CURLOPT_CUSTOMREQUEST => $method]);
        if ($payload !== null) curl_setopt($c, CURLOPT_POSTFIELDS, $payload); $r = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE); $err = curl_error($c); curl_close($c); return [$code, $r === false ? 'curl: ' . $err : (string)$r]; }
    $ctx = stream_context_create(['http' => ['method' => $method, 'header' => implode("\r\n", $h), 'content' => (string)$payload, 'timeout' => $timeout, 'ignore_errors' => true]]);
    $r = @file_get_contents($url, false, $ctx); $code = 0; foreach ($http_response_header ?? [] as $l) if (preg_match('#^HTTP/\S+ (\d+)#', $l, $m)) $code = (int)$m[1]; return [$code, (string)$r];
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
    $r = row('SELECT t.*, u.phone, u.fake, u.client FROM tokens t LEFT JOIN users u ON u.id=t.user_id WHERE t.token=?', [hash('sha256', $t)]);
    if (!$r) { if ($required) NO('نشست شما تمام شده؛ دوباره وارد شوید.', 401, 'auth'); return null; }
    $cl = preg_replace('/[^a-z0-9.\/]/', '', strtolower((string)($_SERVER['HTTP_X_CLIENT'] ?? 'web'))) ?: 'web';
    // the app badge is sticky: a family that installed the app keeps it even when they also open the website
    $and = str_starts_with($cl, 'android'); $was = (string)($r['client'] ?? '');
    if ($r['user_id'] && ($and ? ($was !== $cl || random_int(1, 8) === 1) : ($was === '' || random_int(1, 8) === 1))) { try { q('UPDATE users SET client=?, seen=? WHERE id=?', [substr($and || !str_starts_with($was, 'android') ? $cl : $was, 0, 24), time(), $r['user_id']]); } catch (Throwable $e) {} }
    return $r;
}
/** Rate counter: returns how many times $k was hit inside its window (window starts on the first hit). */
function hit(string $k, int $ttl): int { $now = time(); $k = substr($k, 0, 80);
    if (random_int(1, 50) === 1) q('DELETE FROM hits WHERE exp<?', [$now]);
    $r = row('SELECT n,exp FROM hits WHERE k=?', [$k]);
    if (!$r || (int)$r['exp'] < $now) { q('DELETE FROM hits WHERE k=?', [$k]); q('INSERT INTO hits(k,n,exp) VALUES(?,?,?)', [$k, 1, $now + $ttl]); return 1; }
    q('UPDATE hits SET n=n+1 WHERE k=?', [$k]); return (int)$r['n'] + 1; }
function ip_tag(): string { return substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'r6'), 0, 16); }
const PP_API = 'https://api.payping.ir/v3/';
function pp_token(?string $env = null): string { $env = $env ?: getv('pay_env', 'test'); return (string)C($env === 'live' ? 'payping_token_live' : 'payping_token_test'); }
function pp(string $method, string $path, ?array $body, ?string $env = null): array { [$h, $raw] = http_json($method, PP_API . $path, $body, ['Authorization: Bearer ' . pp_token($env)], 30); $j = json_decode($raw, true); return [$h, is_array($j) ? $j : [], $raw]; }
function pp_err(array $j, string $raw, int $h): string { $m = $j['metaData']['errors'][0]['message'] ?? ($j['message'] ?? ($j['title'] ?? '')); if (!$m && $j) $m = mb_substr(json_encode($j, JSON_UNESCAPED_UNICODE), 0, 160); return (string)($m ?: ('HTTP ' . $h . ' ' . mb_substr($raw, 0, 100))); }
function log_error(string $src, string $msg, string $url = ''): void { try { $sig = substr(hash('sha256', $src . $msg), 0, 32); $now = time();
    $e = row('SELECT id FROM errors WHERE sig=? AND created>?', [$sig, $now - 86400]);
    if ($e) q('UPDATE errors SET n=n+1, last=? WHERE id=?', [$now, $e['id']]);
    else q('INSERT INTO errors(id,src,msg,at_url,ua,n,sig,created,last) VALUES(?,?,?,?,?,1,?,?,?)', [uid(), $src, mb_substr($msg, 0, 500), mb_substr($url, 0, 255), mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 160), $sig, $now, $now]); } catch (Throwable $x) {} }
/** daily SQLite snapshot (14 kept) in storage/backups — the folder is web-denied */
function daily_backup(): void { if (db_engine() !== 'sqlite' || getv('bk_day', '') === date('Ymd')) return; setv('bk_day', date('Ymd'));
    try { $d = dirname(__DIR__) . '/storage/backups'; if (!is_dir($d)) @mkdir($d, 0750, true); $f = $d . '/r6-' . date('Ymd') . '.sqlite'; if (!is_file($f)) db6()->exec("VACUUM INTO " . db6()->quote($f));
        $all = glob($d . '/r6-*.sqlite') ?: []; sort($all); foreach (array_slice($all, 0, max(0, count($all) - 14)) as $old) @unlink($old); } catch (Throwable $e) { log_error('server', 'backup: ' . $e->getMessage()); } }
function ref_credit(string $code, ?string $uid, array $p, string $kind): void { try {
    $a = row('SELECT * FROM amb WHERE code=? AND active=1', [strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code))]); if (!$a || (int)$p['fake']) return;
    if (row('SELECT 1 FROM referrals WHERE profile_id=? AND kind=?', [$p['id'], $kind])) return;
    if ($kind === 'profile' && $uid && row("SELECT 1 FROM referrals WHERE user_id=? AND kind='profile'", [$uid])) return; // one family counts once
    q('INSERT INTO referrals(id,amb_id,user_id,profile_id,place_id,kind,amount,paid,created) VALUES(?,?,?,?,?,?,?,0,?)', [uid(), $a['id'], $uid, $p['id'], $p['place_id'], $kind, (int)($kind === 'team' ? $a['rate_team'] : $a['rate_profile']), time()]); } catch (Throwable $e) {} }
/** trip events + what the team really does (median of the last 30 days, at least 3 samples) */
function hm(int $ts): int { return (int)date('G', $ts) * 60 + (int)date('i', $ts); }
function med(array $a): ?int { if (count($a) < 3) return null; sort($a); return $a[intdiv(count($a), 2)]; }
function team_learn(string $tid): array {
    $o = ['out' => ['depart' => [], 'arrive' => [], 'board' => []], 'back' => ['depart' => [], 'arrive' => [], 'board' => []]];
    foreach (rows("SELECT slot, ev FROM trips WHERE team_id=? AND status='done' AND updated>?", [$tid, time() - 30 * 86400]) as $r) {
        $e = json_decode((string)$r['ev'], true) ?: []; $dir = str_ends_with((string)$r['slot'], 'out') ? 'out' : 'back';
        if (!empty($e['depart'])) $o[$dir]['depart'][] = hm((int)$e['depart']); if (!empty($e['arrive'])) $o[$dir]['arrive'][] = hm((int)$e['arrive']);
        foreach ((array)($e['bp'] ?? []) as $pid => $ts) $o[$dir]['board'][$pid][] = hm((int)$ts); }
    $f = fn($m) => $m === null ? null : sprintf('%02d:%02d', intdiv($m, 60), $m % 60); $res = [];
    foreach ($o as $dir => $x) { $b = []; foreach ($x['board'] as $pid => $l) { $m = med($l); if ($m !== null) $b[$pid] = $f($m); }
        $res[$dir] = ['depart' => $f(med($x['depart'])), 'arrive' => $f(med($x['arrive'])), 'board' => (object)$b, 'n' => count($x['arrive'])]; }
    return $res;
}
function need_admin(): array { $a = auth(); if (!(int)$a['admin']) NO('دسترسی مدیر لازم است.', 403, 'admin'); return $a; }
function issue_token(?string $uid, int $admin = 0): string { $t = bin2hex(random_bytes(24)); q('INSERT INTO tokens(token,user_id,admin,created) VALUES(?,?,?,?)', [hash('sha256', $t), $uid, $admin, time()]); return $t; }
const FAM_READ = ['team_state', 'team_history', 'inbox', 'candidates', 'chat_list', 'live_get', 'tickets', 'fam_list', 'fam_role', 'fam_remove', 'profile_delete', 'dup_find'];
function fam_on(): bool { return getv('family_link', '1') === '1'; }
function fam_link(string $pid, string $uid): ?array { if (!fam_on()) return null; try { return row('SELECT * FROM fam_links WHERE profile_id=? AND user_id=?', [$pid, $uid]); } catch (Throwable $e) { return null; } }
function fam_trial_ok(array $l, ?string $owner): bool { return !flag('paid_mode') || (int)$l['created'] + 30 * 86400 > time() || is_premium($l['user_id']) || is_premium($owner); }
function my_profile(array $u, string $pid): array {
    $p = row('SELECT * FROM profiles WHERE id=? AND user_id=?', [$pid, $u['user_id']]); if ($p) return $p;
    $l = $pid ? fam_link($pid, (string)$u['user_id']) : null; $p = $l ? row('SELECT * FROM profiles WHERE id=?', [$pid]) : null;
    if (!$p) NO('این مسیرک پیدا نشد.', 404, 'profile');
    if (!fam_trial_ok($l, $p['user_id'])) NO('یک ماه رایگان «همراه خانواده» تمام شده؛ برای ادامه، اشتراک همراه لازم است.', 402, 'fam_trial');
    if ($l['role'] !== 'act' && !in_array($GLOBALS['a'] ?? '', FAM_READ, true)) NO('شما در حالت «فقط دیدن» هستید. برای انجام کار، «من ادامه می‌دهم» را بزنید.', 403, 'watch');
    return $p;
}
function fam_users(string $pid): array { $p = row('SELECT user_id FROM profiles WHERE id=?', [$pid]); $u = $p ? [$p['user_id']] : []; if (fam_on()) { try { foreach (rows('SELECT user_id FROM fam_links WHERE profile_id=?', [$pid]) as $r) $u[] = $r['user_id']; } catch (Throwable $e) {} } return array_values(array_unique(array_filter($u))); }

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
        'lat' => (float)$p['lat'], 'lng' => (float)$p['lng'], 'in' => $p['t_in'], 'out' => $p['t_out'], 'days' => array_map('intval', array_filter(explode(',', (string)$p['days']), 'strlen')), 'verified' => (int)$p['verified'], 'trusted' => (int)($p['trusted'] ?? 0), 'nv' => (int)($p['nv'] ?? 0), 'nv_title' => (string)($p['nv_title'] ?? ''), 'in2' => (string)($p['t_in2'] ?? ''), 'out2' => (string)($p['t_out2'] ?? ''), 'rot' => mb_strpos((string)$p['shift'], 'چرخشی') !== false];
    if ($counts) {
        $o['families'] = (int)q('SELECT COUNT(*) FROM profiles WHERE place_id=? AND complete=1', [$p['id']])->fetchColumn();
        $o['drivers'] = 0; foreach (rows('SELECT data FROM profiles WHERE place_id=? AND complete=1', [$p['id']]) as $r) { $d = json_decode((string)$r['data'], true); if (in_array($d['role'] ?? '', ['drive', 'both'], true)) $o['drivers']++; }
        $o['teams'] = (int)q('SELECT COUNT(*) FROM teams WHERE place_id=?', [$p['id']])->fetchColumn();
        $o['flags'] = (int)q('SELECT COUNT(*) FROM place_flags WHERE place_id=?', [$p['id']])->fetchColumn();
    }
    return $o;
}
function team_out(?array $t): ?array { return $t ? ['id' => $t['id'], 'no' => (int)$t['no'], 'hood' => $t['hood'], 'color' => (int)$t['color'], 'coord' => $t['coord'], 'price' => (int)$t['price'], 'prize' => $t['prize'], 'premium' => (int)$t['premium']] : null; }
function fam_shared(array $u): array { if (!fam_on()) return []; $out = [];
    try { foreach (rows('SELECT p.*, l.role frole, l.created fcreated FROM fam_links l JOIN profiles p ON p.id=l.profile_id WHERE l.user_id=?', [$u['user_id']]) as $p) { $o = profile_out($p); $o['shared'] = ['role' => $p['frole'], 'trial_left' => max(0, (int)ceil(((int)$p['fcreated'] + 30 * 86400 - time()) / 86400))]; $out[] = $o; } } catch (Throwable $e) {}
    return $out; }
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
        'job' => mb_substr((string)($d['job'] ?? ''), 0, 20), 'relig' => !empty($d['relig']), 'needs' => $d['needs'] ?? ['out' => true, 'back' => true], 'values' => $d['values'] ?? [], 'hood' => $d['hood'] ?? '', 'lat' => $lat, 'lng' => $lng, 'exact' => $exact, 'snapp' => (int)($d['snapp'] ?? 0),
        'kids' => array_map(fn($r) => ['g' => $r['g'], 'age' => $r['age']] + ($mate ? ['first' => $r['first'], 'id' => $r['id']] : []), riders_of($p)),
        'phone' => $phone, 'phone_hidden' => !$phone, 'verified' => (bool)$verified, 'contact' => $d['contact'] ?? (!empty($d['phone_show']) ? 'phone' : 'app'), 'pickup' => $d['pickup'] ?? '', 'rel' => $d['rel'] ?? '', 'arrive' => $d['arrive'] ?? '', 'free_ride' => !empty($d['free_ride']), 'card' => $mate ? (string)($d['card'] ?? '') : '', 'dest_name' => $mate ? (string)($d['hood'] ?? '') : '', 'fake' => (int)$p['fake'], 'team' => team_out($t)];
}

/* ───────── teams ───────── */
function fair_price(string $tid): int {
    $s = []; foreach (rows('SELECT data FROM profiles WHERE team_id=?', [$tid]) as $r) { $d = json_decode((string)$r['data'], true); if (!empty($d['snapp'])) $s[] = (int)$d['snapp']; }
    if (!$s) return 50000; sort($s); $n = count($s); $med = $n % 2 ? $s[intdiv($n, 2)] : ($s[$n / 2 - 1] + $s[$n / 2]) / 2;
    return max(20000, (int)(round($med * 0.6 / 1000) * 1000));
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
function note(string $pid, string $text, string $kind = 'info', ?string $ref = null): void { q('INSERT INTO notes(id,profile_id,text,kind,ref,rd,created) VALUES(?,?,?,?,?,0,?)', [uid(), $pid, mb_substr($text, 0, 250), $kind, $ref, time()]);
    if (in_array($kind, ['trip', 'invite', 'team', 'near'], true)) push_queue(fam_users($pid), 'رسیدیم', $text); }
/* ───────── push (Firebase Cloud Messaging v1). Optional: works only when the admin pasted a service-account JSON and the app was built with google-services.json ───────── */
function push_queue(array $uids, string $title, string $body): void { static $reg = false; if (!$uids || !C('fcm_service_json')) return; $GLOBALS['PUSHQ'][] = [$uids, $title, $body];
    if (!$reg) { $reg = true; register_shutdown_function(function () { if (function_exists('fastcgi_finish_request')) @fastcgi_finish_request(); foreach ($GLOBALS['PUSHQ'] ?? [] as [$u, $t, $b]) push_send($u, $t, $b); }); } }
function fcm_token(array $sa): ?string {
    $c = json_decode((string)getv('fcm_tok', ''), true); if ($c && $c['exp'] > time() + 60) return $c['t'];
    $b64 = fn($x) => rtrim(strtr(base64_encode($x), '+/', '-_'), '='); $now = time();
    $jwt = $b64(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . $b64(json_encode(['iss' => $sa['client_email'], 'scope' => 'https://www.googleapis.com/auth/firebase.messaging', 'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600]));
    if (!openssl_sign($jwt, $sig, (string)$sa['private_key'], 'sha256WithRSAEncryption')) return null; $jwt .= '.' . $b64($sig);
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt]), 'timeout' => 8, 'ignore_errors' => true]]);
    $r = json_decode((string)@file_get_contents('https://oauth2.googleapis.com/token', false, $ctx), true); if (empty($r['access_token'])) return null;
    setv('fcm_tok', json_encode(['t' => $r['access_token'], 'exp' => $now + (int)($r['expires_in'] ?? 3000)])); return $r['access_token'];
}
function push_send(array $uids, string $title, string $body): int { $sa = json_decode((string)C('fcm_service_json'), true); if (!$sa || empty($sa['project_id'])) return 0; $tok = fcm_token($sa); if (!$tok) return 0; $n = 0;
    $in = implode(',', array_fill(0, count($uids), '?'));
    foreach (rows("SELECT token FROM push_tokens WHERE user_id IN ($in)", $uids) as $t) {
        [$code, $res] = http_json('POST', 'https://fcm.googleapis.com/v1/projects/' . $sa['project_id'] . '/messages:send', ['message' => ['token' => $t['token'], 'notification' => ['title' => $title, 'body' => $body], 'android' => ['priority' => 'high', 'notification' => ['channel_id' => 'residim', 'sound' => 'default', 'default_vibrate_timings' => true, 'visibility' => 'PUBLIC']]]], ['Authorization: Bearer ' . $tok], 8);
        if ($code === 200) $n++; elseif ($code === 404 || $code === 400 && str_contains($res, 'registration')) q('DELETE FROM push_tokens WHERE token=?', [$t['token']]); }
    return $n; }

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
    $child = in_array($place['kind'], ['school', 'kinder', 'institute', 'club'], true) && (int)($d0['forKids'] ?? 1) !== 0; // school staff get adult neighbours
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

case 'cfg': daily_backup(); YES(['web_key' => getv('map_provider', 'neshan') === 'neshan' ? (string)C('neshan_web_key') : '', 'map_provider' => getv('map_provider', 'neshan'), 'sub_price' => (int)getv('sub_price', '297000'), 'free_temp_month' => (int)getv('free_temp_month', '2'), 'service' => (bool)C('neshan_service_key'), 'sms' => (bool)(C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE'),
    'flags' => ['trip_scene' => getv('trip_scene', '1') === '1', 'family_link' => getv('family_link', '1') === '1', 'cand_swipe' => getv('cand_swipe', '0') === '1', 'trip_window' => getv('trip_window', '0') === '1', 'trusted_driver' => getv('trusted_driver', '0') === '1', 'sms_direct' => flag('sms_direct'), 'otp_bale' => flag('otp_bale') && (bool)C('bale_client_id'), 'test_tools' => flag('test_tools'), 'auto_arrive' => flag('auto_arrive'), 'sms_arrive' => flag('sms_arrive'), 'signup_open' => flag('signup_open'), 'league_on' => flag('league_on'), 'paid_mode' => flag('paid_mode'), 'station_on' => flag('station_on')], 'donate' => ['card' => (string)getv('donate_card', ''), 'name' => (string)getv('donate_name', ''), 'gateway' => flag('pay_gateway') && (bool)pp_token(), 'test' => getv('pay_env', 'test') !== 'live'], 'notice' => (string)getv('notice', ''), 'tips' => json_decode((string)getv('tips', ''), true) ?: null, 'app' => ['ver' => (string)getv('app_ver', ''), 'url' => (string)getv('app_url', '')], 'jyear' => jyear(), 'wk' => week_key(), 'radio_votes' => (int)getv('radio_votes', '0')]);

/* auth */
case 'dup_send': { $u = auth(); $o = row('SELECT p.*, u.phone FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.id=?', [(string)($in['other'] ?? '')]); if (!$o || !$o['phone']) NO('برای این مسیرک کدی لازم نیست.'); $in['phone'] = $o['phone']; $in['channel'] = ''; }
    // fall through on purpose: the code goes to the other profile's phone with every OTP limit in place
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
    if (($in['channel'] ?? '') === 'bale') {
        if (!flag('otp_bale') || !C('bale_client_id')) NO('ارسال کد با بله فعلاً فعال نیست.');
        $r = bale_otp($ph, $code); if (!$r['ok']) { q('UPDATE otps SET sent=0 WHERE phone=?', [$ph]); J(['ok' => false, 'error' => 'bale', 'message' => $r['msg'] === 'این شماره در بله حساب ندارد' ? 'این شماره در بله حساب ندارد؛ پیامک یا راه دیگری را بزنید.' : 'کد از راه بله نرسید؛ پیامک یا راه دیگری را بزنید.', 'pcode' => $r['code']], 502); }
        YES(['sent' => true, 'channel' => 'bale']);
    }
    $smsReady = sms_ready();
    if ($smsReady && !flag('otp_dev')) {
        $r = kave($ph, (string)C('kavenegar_template', 'residim-login'), ['token' => $code], null, ($in['channel'] ?? '') === 'call' ? 'call' : 'sms');
        if (!$r['ok']) q('UPDATE otps SET sent=0 WHERE phone=?', [$ph]); // a failed send must not block an immediate retry
        if (!$r['ok']) J(['ok' => false, 'error' => 'sms', 'message' => 'پیامک کد نرسید؛ مشکل از سمت ماست، نه شما.', 'pcode' => $r['code']], 502);
        YES(['sent' => true, 'channel' => ($in['channel'] ?? 'sms')]);
    }
    YES(['sent' => false, 'dev_code' => $code, 'note' => 'سرویس پیامک فعال نیست؛ کد آزمایشی نمایش داده شد.']);
}
case 'dup_merge': { // keep one of two duplicate profiles; the other one is removed. Another account's profile needs its phone's code.
    $u = auth(); $mine = my_profile($u, (string)($in['profile_id'] ?? '')); $o = row('SELECT p.*, u.phone FROM profiles p LEFT JOIN users u ON u.id=p.user_id WHERE p.id=?', [(string)($in['other'] ?? '')]); if (!$o || $o['place_id'] !== $mine['place_id']) NO('این دو مسیرک یکی نیستند.');
    if ($o['user_id'] !== $u['user_id']) {
        if ($o['phone']) { $code = preg_replace('/\D/', '', strtr((string)($in['code'] ?? ''), ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9'])); $ot = row('SELECT * FROM otps WHERE phone=?', [$o['phone']]);
            if (!$ot || time() > (int)$ot['exp'] || (int)$ot['tries'] >= 5) NO('کد منقضی شده؛ دوباره بخواهید.'); if (!password_verify($code, $ot['hash'])) { q('UPDATE otps SET tries=tries+1 WHERE phone=?', [$o['phone']]); NO('کد درست نیست.'); } q('DELETE FROM otps WHERE phone=?', [$o['phone']]); }
        elseif ($o['team_id']) NO('آن مسیرک در تیم است؛ از پشتیبانی بخواهید یکی‌شان کنند.'); }
    if (($in['keep'] ?? 'mine') === 'other') { q('UPDATE profiles SET user_id=? WHERE id=?', [$u['user_id'], $o['id']]); wipe_profile($mine['id']); YES(['kept' => $o['id']]); }
    wipe_profile($o['id']); YES(['kept' => $mine['id']]); }
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
case 'me': { $u = auth(); $pu = (int)(row('SELECT premium_until FROM users WHERE id=?', [$u['user_id']])['premium_until'] ?? 0); YES(['phone' => $u['phone'], 'premium_until' => $pu, 'profiles' => array_merge(array_map('profile_out', rows('SELECT * FROM profiles WHERE user_id=? ORDER BY created', [$u['user_id']])), fam_shared($u))]); }
case 'logout': { $t = $_SERVER['HTTP_X_TOKEN'] ?? ''; if ($t) q('DELETE FROM tokens WHERE token=?', [hash('sha256', $t)]); YES(); }

/* places */
case 'place_code': { $p = row('SELECT * FROM places WHERE code=?', [strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($in['code'] ?? '')))]); if (!$p) NO('این لینک پیدا نشد.', 404, 'notfound'); YES(['place' => place_out($p)]); }
case 'place_near': {
    $lat = (float)($in['lat'] ?? 0); $lng = (float)($in['lng'] ?? 0); $kind = (string)($in['kind'] ?? ''); $qq = trim((string)($in['q'] ?? ''));
    $all = rows('SELECT * FROM places WHERE fake=0 OR created_by IS NOT NULL'); $out = [];
    foreach ($all as $p) { if ($kind && $p['kind'] !== $kind) continue; if ($qq !== '' && mb_strpos($p['name'] . ' ' . $p['city'], $qq) === false) continue; $d = $lat ? hav($lat, $lng, (float)$p['lat'], (float)$p['lng']) : 0; if ($lat && $qq === '' && $d > 12000) continue; $o = place_out($p); $o['d'] = (int)$d; $out[] = $o; }
    usort($out, fn($x, $y) => $x['d'] <=> $y['d']); YES(['places' => array_slice($out, 0, 30)]);
}
case 'places_map': { // every known place around a point, light fields (schools layer, map picker)
    $lat = (float)($in['lat'] ?? 0); $lng = (float)($in['lng'] ?? 0); $r = max(1000, min(20000, (int)($in['r'] ?? 9000))); if (!$lat) YES(['places' => []]);
    $dl = $r / 110570; $dg = $r / (111320 * max(.2, cos(deg2rad($lat)))); $out = [];
    foreach (rows('SELECT id,code,kind,name,city,gender,lat,lng,nv,verified FROM places WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ? AND (fake=0 OR created_by IS NOT NULL) LIMIT 1500', [$lat - $dl, $lat + $dl, $lng - $dg, $lng + $dg]) as $p)
        $out[] = ['id' => $p['id'], 'code' => $p['code'], 'kind' => $p['kind'], 'name' => $p['name'], 'city' => $p['city'], 'gender' => $p['gender'], 'lat' => (float)$p['lat'], 'lng' => (float)$p['lng'], 'nv' => (int)($p['nv'] ?? 0)];
    YES(['places' => $out]); }
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
    $km = $r['m'] / 1000; $n = count($xs); $a = 30000; $b = 12000; $src = 'formula'; // off-peak Snapp in 2026 was well below the old 45k + 18k/km
    if ($n >= 5) { $mx = array_sum($xs) / $n; $my = array_sum($ys) / $n; $sxx = 0; $sxy = 0; foreach ($xs as $i => $x) { $sxx += ($x - $mx) ** 2; $sxy += ($x - $mx) * ($ys[$i] - $my); }
        if ($sxx > 0 && $sxy > 0) { $b = $sxy / $sxx; $a = max(20000, $my - $b * $mx); $src = 'crowd'; } }
    YES($r + ['est' => (int)(round(($a + $b * $km) / 5000) * 5000), 'est_n' => $n, 'est_src' => $src]);
}
case 'radio_vote': { $v = (int)getv('radio_votes', '0') + 1; setv('radio_votes', (string)$v); YES(['votes' => $v]); }
case 'chat_list': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) YES(['list' => []]);
    $after = (int)($in['after'] ?? 0); $l = [];
    foreach (rows('SELECT m.*, p.data pdata FROM msgs m LEFT JOIN profiles p ON p.id=m.profile_id WHERE m.team_id=? AND m.created>? ORDER BY m.created DESC LIMIT 80', [$me['team_id'], $after]) as $m) { $d = json_decode((string)$m['pdata'], true) ?: []; $l[] = ['id' => $m['id'], 'text' => $m['text'], 'at' => (int)$m['created'], 'mine' => $m['profile_id'] === $me['id'], 'who' => $m['profile_id'] === 'system' ? 'رسیدیم' : 'خانواده ' . ($d['family'] ?? ''), 'who_id' => $m['profile_id'], 'sys' => $m['profile_id'] === 'system']; }
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
    if (isset($data['seats'])) $data['seats'] = max(0, min(5, (int)$data['seats']));
    $label = mb_substr(trim((string)($in['label'] ?? '')), 0, 60) ?: 'مسیرک'; $kind = (string)($in['kind'] ?? 'school'); $place = $in['place_id'] ?? null;
    if ($place && !row('SELECT 1 FROM places WHERE id=?', [$place])) NO('مکان پیدا نشد.');
    $complete = !empty($in['complete']) ? 1 : 0; $step = (int)($in['step'] ?? 0); $color = (int)($in['color'] ?? 0);
    $old = $id ? row('SELECT * FROM profiles WHERE id=? AND user_id=?', [$id, $u['user_id']]) : null;
    if (!$old && $id && ($l = fam_link($id, (string)$u['user_id'])) && $l['role'] === 'act') $old = row('SELECT * FROM profiles WHERE id=?', [$id]);
    if (!$old && !$id && $place && $complete) { $old = row('SELECT * FROM profiles WHERE user_id=? AND place_id=? AND kind=? ORDER BY complete DESC, updated DESC', [$u['user_id'], $place, $kind]); if ($old) $id = $old['id']; }
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
    if (!empty($in['ref']) && (int)$p['complete']) ref_credit((string)$in['ref'], $u['user_id'], $p, 'profile');
    YES(['profile' => profile_out($p)]);
}
case 'profile_delete': { $u = auth(); $p = my_profile($u, (string)($in['id'] ?? '')); if ($p['user_id'] !== $u['user_id']) { q('DELETE FROM fam_links WHERE profile_id=? AND user_id=?', [$p['id'], $u['user_id']]); YES(['unlinked' => true]); } wipe_profile($p['id']); YES(); }
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
    if (count($all) > team_cap($all)) NO('این تیم در یک خودرو جا نمی‌شود: حداکثر ۴ نفر (۵ نفر فقط وقتی همه‌ی بچه‌ها زیر ۹ سال باشند). یک هم‌مسیر دیگر یا تیم کوچک‌تری انتخاب کنید.', 400, 'full');
    if (row('SELECT 1 FROM invites WHERE status=? AND ((from_p=? AND to_p=?) OR (from_p=? AND to_p=?))', ['pending', $me['id'], $to['id'], $to['id'], $me['id']])) NO('پیشنهاد قبلاً فرستاده شده و منتظر پاسخ است.');
    $today = (int)q('SELECT COUNT(*) FROM invites WHERE from_p=? AND created>?', [$me['id'], time() - 86400])->fetchColumn(); if ($today >= 12) NO('امروز پیشنهاد کافی فرستاده‌اید؛ فردا دوباره.', 429);
    $id = uid(); q('INSERT INTO invites(id,from_p,to_p,status,created,responded) VALUES(?,?,?,?,?,NULL)', [$id, $me['id'], $to['id'], 'pending', time()]);
    $hi = mb_substr(trim((string)($in['text'] ?? '')), 0, 400); if ($hi !== '') q('INSERT INTO invite_msgs(id,invite_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $id, $me['id'], $hi, time()]);
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
case 'invite_thread': { $u = auth(); $i = row('SELECT * FROM invites WHERE id=?', [(string)($in['id'] ?? '')]); if (!$i) NO('این گفتگو پیدا نشد.');
    $mine = row('SELECT id FROM profiles WHERE id IN (?,?) AND user_id=?', [$i['from_p'], $i['to_p'], $u['user_id']]) ?: (fam_link($i['from_p'], $u['user_id']) ? ['id' => $i['from_p']] : (fam_link($i['to_p'], $u['user_id']) ? ['id' => $i['to_p']] : null)); if (!$mine) NO('دسترسی ندارید.', 403);
    if (!empty($in['text'])) { $t = mb_substr(trim(preg_replace('/\s+/u', ' ', (string)$in['text'])), 0, 400); if ($t !== '') { if (hit('im_' . $mine['id'], 60) > 10) NO('کمی آرام‌تر 🙂', 429);
        q('INSERT INTO invite_msgs(id,invite_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $i['id'], $mine['id'], $t, time()]); $other = $mine['id'] === $i['from_p'] ? $i['to_p'] : $i['from_p'];
        note($other, 'خانواده ' . (pdata(row('SELECT data FROM profiles WHERE id=?', [$mine['id']]))['family'] ?? '') . ' برایتان پیام آشنایی فرستاد: «' . mb_substr($t, 0, 60) . '»', 'invite', $i['id']); } }
    $oth = row('SELECT * FROM profiles WHERE id=?', [$mine['id'] === $i['from_p'] ? $i['to_p'] : $i['from_p']]);
    YES(['status' => $i['status'], 'dir' => $mine['id'] === $i['from_p'] ? 'out' : 'in', 'other' => $oth ? public_member($oth, false, null, (bool)$u['phone']) : null,
        'msgs' => array_map(fn($m) => ['text' => $m['text'], 'at' => (int)$m['created'], 'mine' => $m['profile_id'] === $mine['id']], rows('SELECT * FROM invite_msgs WHERE invite_id=? ORDER BY created', [$i['id']]))]); }
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
    $inv = []; foreach (rows('SELECT * FROM invites WHERE to_p=? AND status=? ORDER BY created DESC', [$me['id'], 'pending']) as $i) { $f = row('SELECT * FROM profiles WHERE id=?', [$i['from_p']]); if ($f) { $m = public_member($f, false, null, (bool)$u['phone']); $md = pdata($me); $m['dist'] = isset($md['lat']) ? road_many((float)$md['lat'], (float)$md['lng'], [[$m['lat'], $m['lng']]])[0] : null; $hi = row('SELECT text FROM invite_msgs WHERE invite_id=? ORDER BY created LIMIT 1', [$i['id']]); $inv[] = ['id' => $i['id'], 'from' => $m, 'hi' => $hi ? $hi['text'] : '']; } }
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
    q('DELETE FROM live WHERE team_id=?', [$me['team_id']]); q('INSERT INTO live(team_id,profile_id,lat,lng,acc,at) VALUES(?,?,?,?,?,?)', [$me['team_id'], $me['id'], round($la, 5), round($lo, 5), (int)($in['acc'] ?? 0), time()]);
    $slot = preg_replace('/[^0-9a-z\-]/', '', (string)($in['slot'] ?? '')); $tr = $slot ? row('SELECT * FROM trips WHERE id=?', [$me['team_id'] . '|' . week_key() . '|' . $slot]) : null;
    if ($tr && $tr['status'] === 'started' && $tr['exec'] === $me['id']) { $ev = json_decode((string)($tr['ev'] ?? ''), true) ?: []; $ch = false; $dir = str_ends_with($slot, 'out') ? 'out' : 'back';
        foreach (rows('SELECT * FROM profiles WHERE team_id=?', [$me['team_id']]) as $m) { if ($m['id'] === $me['id']) continue; $d = pdata($m); if (empty($d['lat']) || empty(($d['needs'] ?? ['out' => 1, 'back' => 1])[$dir])) continue;
            if ($dir === 'out' && !empty($ev['bp'][$m['id']])) continue; $dist = hav($la, $lo, (float)$d['lat'], (float)$d['lng']);
            $kids = implode(' و ', array_filter(array_column(riders_of($m), 'first'))) ?: 'بچه‌ها';
            if ($dist < 1000 && empty($ev['near'][$m['id']])) { $ev['near'][$m['id']] = time(); $ch = true; note($m['id'], $dir === 'out' ? "سرویس نزدیک است؛ حدود " . max(1, (int)round($dist / 400)) . " دقیقه‌ی دیگر دم در شماست. $kids آماده باشند 🎒" : "سرویس با $kids نزدیک خانه است.", 'near'); }
            if ($dist < 160 && empty($ev['door'][$m['id']])) { $ev['door'][$m['id']] = time(); $ch = true; note($m['id'], $dir === 'out' ? "سرویس دم در است! 🚗 $kids بیایند پایین." : "$kids دم در خانه رسیدند. 🏠", 'near'); } }
        if ($ch) q('UPDATE trips SET ev=? WHERE id=?', [json_encode($ev), $tr['id']]); }
    YES(); }
case 'trust_add': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) NO('اول تیم شوید.');
    $pl = row('SELECT * FROM places WHERE id=?', [$me['place_id']]); if (getv('trusted_driver', '0') !== '1' || !(int)($pl['trusted'] ?? 0)) NO('افزودن راننده‌ی معتمد برای این مکان فعال نیست؛ از پشتیبانی بخواهید.', 403);
    if (empty($in['sign'])) NO('برای افزودن، باید تعهد را بپذیرید.'); $nm = mb_substr(trim((string)($in['name'] ?? '')), 0, 80); if (mb_strlen($nm) < 3) NO('نام راننده را کامل بنویسید.');
    $c = code8(); q('INSERT INTO trust_inv(code,team_id,by_profile,name,note,seats,accepted,user_id,profile_id,created) VALUES(?,?,?,?,?,?,?,NULL,NULL,?)', [$c, $me['team_id'], $me['id'], $nm, mb_substr((string)($in['note'] ?? ''), 0, 200), max(1, min(4, (int)($in['seats'] ?? 3))), json_encode([$me['id']]), time()]);
    foreach (rows('SELECT id FROM profiles WHERE team_id=?', [$me['team_id']]) as $m) if ($m['id'] !== $me['id']) note($m['id'], 'خانواده ' . (pdata($me)['family'] ?? '') . " «$nm» را به‌عنوان راننده‌ی معتمد پیشنهاد داده‌اند؛ در تیم ببینید و اگر موافقید بپذیرید.", 'team');
    YES(['code' => $c, 'link' => 'https://residim.ir/#trust/' . $c]); }
case 'trust_list': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) YES(['list' => []]); $n = (int)q('SELECT COUNT(*) FROM profiles WHERE team_id=? AND fake=0', [$me['team_id']])->fetchColumn();
    YES(['on' => getv('trusted_driver', '0') === '1' && (int)(row('SELECT trusted FROM places WHERE id=?', [$me['place_id']])['trusted'] ?? 0), 'list' => array_map(function ($r) use ($me, $n) { $a = json_decode((string)$r['accepted'], true) ?: []; return ['code' => $r['code'], 'name' => $r['name'], 'note' => $r['note'], 'seats' => (int)$r['seats'], 'by' => $r['by_profile'], 'accepted' => $a, 'me_ok' => in_array($me['id'], $a, true), 'need' => $n, 'joined' => (bool)$r['profile_id'], 'link' => 'https://residim.ir/#trust/' . $r['code']]; }, rows('SELECT * FROM trust_inv WHERE team_id=? ORDER BY created DESC', [$me['team_id']]))]); }
case 'trust_accept': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $r = row('SELECT * FROM trust_inv WHERE code=? AND team_id=?', [(string)($in['code'] ?? ''), $me['team_id']]); if (!$r) NO('پیدا نشد.');
    if (empty($in['sign'])) NO('برای پذیرفتن، متن سلب مسئولیت را تأیید کنید.'); $a = json_decode((string)$r['accepted'], true) ?: []; if (!in_array($me['id'], $a, true)) $a[] = $me['id']; q('UPDATE trust_inv SET accepted=? WHERE code=?', [json_encode($a), $r['code']]); YES(['accepted' => $a]); }
case 'trust_join': { $u = auth(); if (!$u['phone']) NO('اول با شماره‌ی خودتان وارد شوید.', 401, 'auth'); $r = row('SELECT * FROM trust_inv WHERE code=?', [strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($in['code'] ?? '')))]); if (!$r) NO('این لینک معتبر نیست.');
    if ($r['profile_id']) NO('این دعوت قبلاً استفاده شده.'); $mem = rows('SELECT * FROM profiles WHERE team_id=? AND fake=0', [$r['team_id']]); $a = json_decode((string)$r['accepted'], true) ?: [];
    foreach ($mem as $m) if (!in_array($m['id'], $a, true)) NO('هنوز همه‌ی خانواده‌های تیم شما را نپذیرفته‌اند؛ کمی بعد دوباره همین لینک را باز کنید.', 409, 'wait');
    $t = row('SELECT * FROM teams WHERE id=?', [$r['team_id']]); $pid = uid(); $data = ['family' => $r['name'], 'title' => 'راننده‌ی معتمد', 'pg' => 'm', 'role' => 'drive', 'seats' => (int)$r['seats'], 'trusted' => ['by' => $r['by_profile'], 'note' => $r['note'], 'at' => time()], 'needs' => ['out' => true, 'back' => true], 'days' => [0, 1, 2, 3, 4], 'rules_at' => time()];
    q('INSERT INTO profiles(id,user_id,label,kind,color,place_id,team_id,data,step,complete,fake,created,updated) VALUES(?,?,?,?,?,?,?,?,0,1,0,?,?)', [$pid, $u['user_id'], 'راننده‌ی معتمد · ' . mb_substr($r['name'], 0, 30), (string)(row('SELECT kind FROM places WHERE id=?', [$t['place_id']])['kind'] ?? 'school'), (int)$t['color'], $t['place_id'], $t['id'], json_encode($data, JSON_UNESCAPED_UNICODE), time(), time()]);
    q('UPDATE trust_inv SET user_id=?, profile_id=? WHERE code=?', [$u['user_id'], $pid, $r['code']]); foreach ($mem as $m) note($m['id'], '«' . $r['name'] . '» به‌عنوان راننده‌ی معتمد به تیم پیوست.', 'team'); YES(['profile_id' => $pid]); }
case 'admin_place_trust': { need_admin(); q('UPDATE places SET trusted=? WHERE id=?', [!empty($in['v']) ? 1 : 0, (string)($in['id'] ?? '')]); YES(); }
case 'team_agree': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) NO('تیم ندارید.'); $t = row('SELECT agree FROM teams WHERE id=?', [$me['team_id']]);
    $a = json_decode((string)($t['agree'] ?? '[]'), true) ?: []; $a = array_values(array_diff($a, [$me['id']])); if (!empty($in['v'])) $a[] = $me['id']; q('UPDATE teams SET agree=? WHERE id=?', [json_encode($a), $me['team_id']]);
    if (!empty($in['v'])) { $fam = pdata($me)['family'] ?? ''; q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $me['team_id'], 'system', "خانواده $fam «توافق کردیم» را زد ✓", time()]); } YES(['agree' => $a]); }
case 'team_pact': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) NO('تیم ندارید.'); $t = mb_substr(trim((string)($in['text'] ?? '')), 0, 600);
    q('UPDATE teams SET pact=?, pact_by=?, pact_at=? WHERE id=?', [$t, $me['id'], time(), $me['team_id']]); $fam = pdata($me)['family'] ?? '';
    foreach (rows('SELECT id FROM profiles WHERE team_id=?', [$me['team_id']]) as $m) if ($m['id'] !== $me['id']) note($m['id'], "خانواده $fam «قرار تیم» را به‌روز کرد؛ در گفتگو ببینید.", 'team'); YES(); }
case 'push_reg': { $u = auth(); $t = mb_substr(trim((string)($in['token'] ?? '')), 0, 250); if (strlen($t) < 20) NO('توکن نامعتبر.'); q('DELETE FROM push_tokens WHERE token=?', [$t]); q('INSERT INTO push_tokens(token,user_id,created) VALUES(?,?,?)', [$t, $u['user_id'], time()]); YES(); }
case 'fam_code': { $u = auth(); if (!fam_on()) NO('این امکان فعلاً خاموش است.'); $p = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$u['phone']) NO('اول شماره‌تان را تأیید کنید.');
    $c = code8(); q('DELETE FROM fam_codes WHERE created<?', [time() - 172800]); q('INSERT INTO fam_codes(code,profile_id,by_user,created) VALUES(?,?,?,?)', [$c, $p['id'], $u['user_id'], time()]); YES(['code' => $c, 'link' => 'https://residim.ir/#fam/' . $c]); }
case 'fam_join': { $u = auth(); if (!fam_on()) NO('این امکان فعلاً خاموش است.'); if (!$u['phone']) NO('برای همراه شدن، اول با شماره‌تان وارد شوید.', 401, 'auth');
    $c = row('SELECT * FROM fam_codes WHERE code=?', [strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($in['code'] ?? '')))]); if (!$c || time() - (int)$c['created'] > 172800) NO('این لینک منقضی شده؛ یک لینک تازه بخواهید.');
    $p = row('SELECT * FROM profiles WHERE id=?', [$c['profile_id']]); if (!$p) NO('این مسیرک دیگر نیست.'); if ($p['user_id'] === $u['user_id']) NO('این مسیرک مال خودتان است.');
    if ((int)q('SELECT COUNT(*) FROM fam_links WHERE profile_id=?', [$p['id']])->fetchColumn() >= 3) NO('هر مسیرک حداکثر ۳ همراه دارد.');
    if (!fam_link($p['id'], $u['user_id'])) q('INSERT INTO fam_links(profile_id,user_id,role,created) VALUES(?,?,?,?)', [$p['id'], $u['user_id'], 'watch', time()]);
    q('DELETE FROM fam_codes WHERE code=?', [$c['code']]); note($p['id'], 'یک همراه خانواده به «' . $p['label'] . '» پیوست؛ از این به بعد او هم رخدادها را می‌بیند.', 'team');
    YES(['profile_id' => $p['id']]); }
case 'fam_list': { $u = auth(); $p = my_profile($u, (string)($in['profile_id'] ?? '')); $mask = fn($ph) => $ph ? substr($ph, 0, 4) . '•••' . substr($ph, -4) : 'مهمان';
    $own = row('SELECT phone FROM users WHERE id=?', [$p['user_id']]); $L = [['user' => 'owner', 'phone' => $mask($own['phone'] ?? ''), 'role' => 'owner', 'me' => $p['user_id'] === $u['user_id']]];
    foreach (rows('SELECT l.*, u.phone FROM fam_links l LEFT JOIN users u ON u.id=l.user_id WHERE l.profile_id=?', [$p['id']]) as $l) $L[] = ['user' => $l['user_id'], 'phone' => $mask($l['phone']), 'role' => $l['role'], 'me' => $l['user_id'] === $u['user_id'], 'trial_left' => max(0, (int)ceil(((int)$l['created'] + 2592000 - time()) / 86400))];
    YES(['list' => $L, 'paid' => flag('paid_mode')]); }
case 'fam_role': { $u = auth(); $pid = (string)($in['profile_id'] ?? ''); $l = fam_link($pid, $u['user_id']); if (!$l) NO('شما همراه این مسیرک نیستید.'); my_profile($u, $pid);
    $r = ($in['role'] ?? '') === 'act' ? 'act' : 'watch'; q('UPDATE fam_links SET role=? WHERE profile_id=? AND user_id=?', [$r, $pid, $u['user_id']]);
    if ($r === 'act') note($pid, 'همراه خانواده کارها را در دست گرفت (من ادامه می‌دهم).', 'info'); YES(['role' => $r]); }
case 'fam_remove': { $u = auth(); $pid = (string)($in['profile_id'] ?? ''); $who = (string)($in['user'] ?? $u['user_id']); $p = row('SELECT * FROM profiles WHERE id=?', [$pid]); if (!$p) NO('مسیرک پیدا نشد.');
    if ($who !== $u['user_id'] && $p['user_id'] !== $u['user_id']) NO('فقط صاحب مسیرک می‌تواند همراه را حذف کند.', 403); q('DELETE FROM fam_links WHERE profile_id=? AND user_id=?', [$pid, $who]); YES(); }
/* duplicates: the same family registered more than once (same place, same family name, close homes) */
case 'dup_find': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); $d = pdata($me); $fam = pname_norm((string)($d['family'] ?? '')); $out = [];
    if ($fam !== '' && $me['place_id']) foreach (rows('SELECT p.*, u.phone FROM profiles p LEFT JOIN users u ON u.id=p.user_id WHERE p.place_id=? AND p.id<>? AND p.fake=0', [$me['place_id'], $me['id']]) as $o) { $od = pdata($o);
        if (pname_norm((string)($od['family'] ?? '')) !== $fam || empty($od['lat']) || empty($d['lat']) || hav((float)$d['lat'], (float)$d['lng'], (float)$od['lat'], (float)$od['lng']) > 400) continue;
        $out[] = ['id' => $o['id'], 'label' => $o['label'], 'family' => $od['family'], 'hood' => $od['hood'] ?? '', 'kids' => count((array)($od['kids'] ?? [])), 'complete' => (int)$o['complete'], 'team' => (bool)$o['team_id'], 'mine' => $o['user_id'] === $u['user_id'], 'phone' => $o['phone'] ? substr($o['phone'], 0, 4) . '•••' . substr($o['phone'], -4) : null, 'created' => (int)$o['created']]; }
    YES(['list' => $out]); }
case 'live_get': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); if (!$me['team_id']) YES(['live' => null]);
    $t = row('SELECT premium FROM teams WHERE id=?', [$me['team_id']]);
    if (flag('paid_mode') && !(int)($t['premium'] ?? 0) && !is_premium($u['user_id'])) YES(['live' => null, 'locked' => true]);
    $l = row('SELECT profile_id,lat,lng,acc,at FROM live WHERE team_id=? AND at>?', [$me['team_id'], time() - 180]);
    YES(['live' => $l ? ['by' => $l['profile_id'], 'lat' => (float)$l['lat'], 'lng' => (float)$l['lng'], 'acc' => (int)$l['acc'], 'ago' => time() - (int)$l['at']] : null]); }
case 'pay_start': { // donation (and later subscription) through the PayPing gateway
    if (!flag('pay_gateway')) NO('پرداخت آنلاین فعلاً خاموش است.'); $u = auth(false);
    $amt = (int)preg_replace('/\D/', '', strtr((string)($in['amount'] ?? ''), ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9']));
    if ($amt < 10000) NO('کمترین مبلغ ۱۰ هزار تومان است.'); if ($amt > 200000000) NO('مبلغ بیش از حد مجاز است؛ برای کمک‌های بزرگ از «تماس با ما» هماهنگ کنیم.');
    if (!pp_token()) NO('درگاه هنوز تنظیم نشده است.'); if (hit('pay_' . ip_tag(), 3600) > 10) NO('چند دقیقه‌ی دیگر دوباره امتحان کنید.', 429);
    $env = getv('pay_env', 'test'); $ref = 'R' . date('ymd') . strtoupper(bin2hex(random_bytes(4))); $purpose = 'donate'; $nm = mb_substr(trim((string)($in['name'] ?? '')), 0, 80); $mob = phone_norm((string)($in['mobile'] ?? '')) ?: (string)($u['phone'] ?? '');
    $id = uid(); q('INSERT INTO payments(id,ref,purpose,amount,env,status,code,refid,card,name,mobile,user_id,note,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [$id, $ref, $purpose, $amt, $env, 'init', '', '', '', $nm, $mob, $u['user_id'] ?? null, '', time(), time()]);
    $body = ['amount' => $amt, 'returnUrl' => 'https://residim.ir/app/api/pay.php', 'clientRefId' => $ref, 'description' => 'حمایت از رسیدیم (دنگ خیر)', 'payerName' => $nm ?: 'حامی رسیدیم'];
    if ($mob) $body['payerIdentity'] = $mob;
    [$h, $j, $raw] = pp('POST', 'pay', $body, $env);
    if ($h !== 200 || empty($j['paymentCode'])) { $m = pp_err($j, $raw, $h); q('UPDATE payments SET status=?, note=?, updated=? WHERE id=?', ['failed', mb_substr($m, 0, 250), time(), $id]); log_error('pay', 'create: ' . $m); NO('درگاه پاسخ نداد؛ کمی بعد دوباره امتحان کنید.'); }
    q('UPDATE payments SET status=?, code=?, updated=? WHERE id=?', ['sent', (string)$j['paymentCode'], time(), $id]);
    YES(['url' => PP_API . 'pay/start/' . rawurlencode((string)$j['paymentCode']), 'ref' => $ref, 'test' => $env !== 'live']); }
case 'pay_status': { $p = row('SELECT ref,amount,status,refid,purpose,env FROM payments WHERE ref=?', [preg_replace('/[^A-Z0-9]/', '', strtoupper((string)($in['ref'] ?? '')))]); if (!$p) NO('پرداخت پیدا نشد.', 404); YES(['pay' => $p]); }
case 'client_error': { // browser errors -> admin (rate-limited, deduplicated)
    if (hit('cerr_' . ip_tag(), 3600) > 30) YES(); log_error('client', mb_substr((string)($in['msg'] ?? ''), 0, 400), (string)($in['url'] ?? '')); YES(); }
case 'health': { $ok = true; try { db6()->query('SELECT 1'); } catch (Throwable $e) { $ok = false; }
    $who = auth(false); if (!$who || !(int)$who['admin']) YES(['db' => $ok, 'time' => date('c')]);
    $st = dirname(__DIR__) . '/storage'; YES(['db' => $ok, 'engine' => db_engine(), 'storage_writable' => is_writable($st), 'disk_free_mb' => (int)(@disk_free_space($st) / 1048576), 'sms' => sms_ready(), 'pay' => flag('pay_gateway') && (bool)pp_token(), 'time' => date('c')]); }
case 'fb_send': { $u = auth(false); $st = max(0, min(5, (int)($in['stars'] ?? 0))); $tx = trim((string)($in['text'] ?? ''));
    if ($st === 0 && mb_strlen($tx) < 3) NO('ستاره بدهید یا چند کلمه بنویسید.'); if ((string)($in['hp'] ?? '') !== '') YES();
    if (hit('fb_' . ip_tag(), 3600) > 6) NO('ممنون! کمی بعد دوباره بنویسید.', 429);
    q('INSERT INTO feedback(id,user_id,stars,cat,text,pub,likes,created) VALUES(?,?,?,?,?,0,0,?)', [uid(), $u['user_id'] ?? null, $st, mb_substr((string)($in['cat'] ?? 'نظر'), 0, 30), mb_substr($tx, 0, 1500), time()]); YES(); }
case 'fb_list': { $u = auth(false); $voter = $u['user_id'] ?? ('ip' . ip_tag()); $L = rows('SELECT id,cat,text,likes,created FROM feedback WHERE pub=1 ORDER BY likes DESC, created DESC LIMIT 60');
    $mine = array_column(rows('SELECT fb_id FROM fb_likes WHERE voter=?', [$voter]), 'fb_id'); foreach ($L as &$x) { $x['liked'] = in_array($x['id'], $mine, true); $x['likes'] = (int)$x['likes']; } unset($x);
    $avg = row('SELECT AVG(stars) a, COUNT(*) n FROM feedback WHERE stars>0'); YES(['list' => $L, 'avg' => round((float)($avg['a'] ?? 0), 1), 'n' => (int)($avg['n'] ?? 0)]); }
case 'fb_like': { $u = auth(false); $voter = $u['user_id'] ?? ('ip' . ip_tag()); $id = (string)($in['id'] ?? ''); if (!row('SELECT 1 FROM feedback WHERE id=? AND pub=1', [$id])) NO('پیدا نشد.');
    if (row('SELECT 1 FROM fb_likes WHERE fb_id=? AND voter=?', [$id, $voter])) { q('DELETE FROM fb_likes WHERE fb_id=? AND voter=?', [$id, $voter]); q('UPDATE feedback SET likes=likes-1 WHERE id=? AND likes>0', [$id]); YES(['liked' => false]); }
    q('INSERT INTO fb_likes(fb_id,voter,created) VALUES(?,?,?)', [$id, $voter, time()]); q('UPDATE feedback SET likes=likes+1 WHERE id=?', [$id]); YES(['liked' => true]); }
case 'amb_view': { $a = row('SELECT * FROM amb WHERE token=? AND active=1', [preg_replace('/[^A-Za-z0-9]/', '', (string)($in['token'] ?? ''))]); if (!$a) NO('این لینک معتبر نیست.', 404);
    $R = rows('SELECT r.kind,r.amount,r.paid,r.created,p.name place FROM referrals r LEFT JOIN places p ON p.id=r.place_id WHERE r.amb_id=? ORDER BY r.created DESC LIMIT 300', [$a['id']]);
    $sum = 0; $paid = 0; foreach ($R as $x) { $sum += (int)$x['amount']; if ((int)$x['paid']) $paid += (int)$x['amount']; }
    YES(['amb' => ['name' => $a['name'], 'code' => $a['code'], 'rate_profile' => (int)$a['rate_profile'], 'rate_team' => (int)$a['rate_team']], 'list' => $R, 'sum' => $sum, 'paid' => $paid,
        'profiles' => count(array_filter($R, fn($x) => $x['kind'] === 'profile')), 'teams' => count(array_filter($R, fn($x) => $x['kind'] === 'team'))]); }
case 'team_leave': { $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); YES(['result' => team_leave($me)]); }

/* team daily */
case 'team_state': {
    $u = auth(); $me = my_profile($u, (string)($in['profile_id'] ?? '')); settle_auto($me['id']); $me = row('SELECT * FROM profiles WHERE id=?', [$me['id']]);
    if (!$me['team_id']) YES(['team' => null]);
    $t = row('SELECT * FROM teams WHERE id=?', [$me['team_id']]); $wk = week_key();
    $members = array_map(fn($p) => public_member($p, true), rows('SELECT * FROM profiles WHERE team_id=? ORDER BY created', [$t['id']]));
    $trips = []; foreach (rows('SELECT * FROM trips WHERE team_id=? AND wk=?', [$t['id'], $wk]) as $r) $trips[$r['slot']] = ['status' => $r['status'], 'exec' => $r['exec'], 'ev' => json_decode((string)($r['ev'] ?? ''), true) ?: (object)[], 'arr' => json_decode((string)$r['arr'], true) ?: (object)[], 'empty' => (int)$r['empty'], 'thanks' => (int)$r['thanks']];
    $ledger = array_map(fn($r) => ['id' => $r['id'], 'kind' => $r['kind'], 'text' => $r['text'], 'd' => json_decode((string)$r['d'], true), 'at' => (int)$r['created']], rows('SELECT * FROM ledger WHERE team_id=? ORDER BY created', [$t['id']]));
    $board = []; foreach (rows('SELECT team_id, SUM(ok) s, COUNT(*) n FROM quiz WHERE place_id=? AND day>=? GROUP BY team_id', [$t['place_id'], date('Y-m-d', strtotime('-6 days'))]) as $b) { $tt = row('SELECT no,hood,color FROM teams WHERE id=?', [$b['team_id']]); if ($tt) $board[] = ['team' => $b['team_id'], 'no' => (int)$tt['no'], 'hood' => $tt['hood'], 'color' => (int)$tt['color'], 'score' => (int)$b['s'], 'n' => (int)$b['n']]; }
    usort($board, fn($x, $y) => $y['score'] <=> $x['score']);
    YES(['team' => team_out($t), 'agree' => json_decode((string)($t['agree'] ?? 'null'), true), 'pact' => ['text' => (string)($t['pact'] ?? ''), 'by' => $t['pact_by'] ?? null, 'at' => (int)($t['pact_at'] ?? 0)], 'learn' => team_learn($t['id']), 'members' => $members, 'trips' => (object)$trips, 'ledger' => $ledger, 'wk' => $wk, 'board' => $board, 'place' => place_out(row('SELECT * FROM places WHERE id=?', [$t['place_id']]), false)]);
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
    if (getv('trip_window', '0') === '1' && in_array($act, ['start', 'board', 'unboard', 'depart', 'arrive', 'empty', 'finish'], true) && !trip_now($t, $slot)) NO('الان وقت این سفر نیست؛ این بار فقط تمرین است و چیزی ثبت نمی‌شود.', 409, 'practice');
    switch ($act) {
        case 'start': { $ex = (string)($in['exec'] ?? ''); if (!in_array($ex, $ids, true)) NO('راننده معتبر نیست.'); if ($tr && $tr['status'] !== 'pending') NO('این نوبت قبلاً شروع شده.');
            $ev = ['start' => time(), 'board' => [], 'bp' => []]; if ($dir === 'out') { foreach ($riders as $r) if ($r['pid'] === $ex) $ev['board'][$r['id']] = time(); $ev['bp'][$ex] = time(); } // the driver's own children are already in the car
            $save(['status' => 'started', 'exec' => $ex, 'arr' => '{}', 'empty' => 0]); q('UPDATE trips SET ev=? WHERE id=?', [json_encode($ev), $rid]); break; }
        case 'unboard': { // a mistaken «سوار شد» can be taken back by the driver
            if (!$tr || $tr['status'] !== 'started') NO('سفر شروع نشده.'); $ev = json_decode((string)($tr['ev'] ?? ''), true) ?: ['board' => [], 'bp' => []]; $pid = (string)($in['pid'] ?? '');
            unset($ev['bp'][$pid]); foreach ($riders as $r) if ($r['pid'] === $pid) unset($ev['board'][$r['id']]);
            q('UPDATE trips SET ev=?, updated=? WHERE id=?', [json_encode($ev), time(), $rid]); $tr = row('SELECT * FROM trips WHERE id=?', [$rid]); break; }
        case 'depart': case 'board': {
            if (!$tr || $tr['status'] !== 'started') NO('سفر شروع نشده.'); $ev = json_decode((string)($tr['ev'] ?? ''), true) ?: ['board' => [], 'bp' => []];
            $exd = pdata(row('SELECT data FROM profiles WHERE id=?', [$tr['exec']]) ?? ['data' => '{}']);
            if ($act === 'depart') { if (empty($ev['depart'])) { $ev['depart'] = time(); foreach ($ids as $pid) if ($pid !== $tr['exec']) note($pid, 'خانواده ' . ($exd['family'] ?? '') . ' ساعت ' . date('H:i') . ' راه افتادند 🚗', 'trip'); } }
            else { $pid = (string)($in['pid'] ?? ''); if (!in_array($pid, $ids, true)) NO('خانواده معتبر نیست.'); if (empty($ev['bp'][$pid])) { $ev['bp'][$pid] = time(); $names = [];
                foreach ($riders as $r) if ($r['pid'] === $pid) { $ev['board'][$r['id']] = time(); if ($r['first']) $names[] = $r['first']; }
                $fd = pdata(row('SELECT data FROM profiles WHERE id=?', [$pid]) ?? ['data' => '{}']); $who = $names ? implode(' و ', $names) : 'خانواده ' . ($fd['family'] ?? '');
                foreach ($ids as $x) if ($x !== $tr['exec']) note($x, $who . ' ساعت ' . date('H:i') . ' سوار شد' . (count($names) > 1 ? 'ند' : '') . ' ✓', 'trip'); } }
            q('UPDATE trips SET ev=?, updated=? WHERE id=?', [json_encode($ev), time(), $rid]); $tr = row('SELECT * FROM trips WHERE id=?', [$rid]); break; }
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
            $save(['arr' => json_encode($arr)]);
            if ($kid === '*') { $ev = json_decode((string)($tr['ev'] ?? ''), true) ?: []; if (empty($ev['arrive'])) { $ev['arrive'] = time(); q('UPDATE trips SET ev=? WHERE id=?', [json_encode($ev), $rid]); } }
            break;
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
        'places' => $c('SELECT COUNT(*) FROM places'), 'teams' => $c('SELECT COUNT(*) FROM teams'), 'invites' => $c("SELECT COUNT(*) FROM invites WHERE status='pending'"), 'tickets' => $c("SELECT COUNT(*) FROM tickets WHERE status='open'"), 'sms_day' => $c('SELECT COUNT(*) FROM sms WHERE created>?', [time() - 86400]), 'unseen' => $c('SELECT COUNT(*) FROM tickets WHERE seen=0 OR seen IS NULL'), 'errors_day' => $c('SELECT COUNT(*) FROM errors WHERE last>?', [time() - 86400]), 'app_users' => $c("SELECT COUNT(*) FROM users WHERE client LIKE 'android%'"), 'fb' => $c('SELECT COUNT(*) FROM feedback'), 'paid' => $c("SELECT COUNT(*) FROM payments WHERE status='paid' AND env='live'")],
        'flags' => ['trip_scene' => getv('trip_scene', '1') === '1', 'family_link' => getv('family_link', '1') === '1', 'cand_swipe' => getv('cand_swipe', '0') === '1', 'trip_window' => getv('trip_window', '0') === '1', 'trusted_driver' => getv('trusted_driver', '0') === '1', 'sms_invite' => flag('sms_invite'), 'sms_arrive' => flag('sms_arrive'), 'auto_arrive' => flag('auto_arrive'), 'test_tools' => flag('test_tools'), 'signup_open' => flag('signup_open'), 'otp_dev' => flag('otp_dev'), 'sms_direct' => flag('sms_direct'), 'otp_bale' => flag('otp_bale'), 'pay_gateway' => flag('pay_gateway'), 'league_on' => flag('league_on'), 'paid_mode' => flag('paid_mode'), 'station_on' => flag('station_on')],
        'settings' => ['map_provider' => getv('map_provider', 'neshan'), 'sub_price' => (int)getv('sub_price', '297000'), 'free_permanent' => (int)getv('free_permanent', '1'), 'free_temp_month' => (int)getv('free_temp_month', '2'), 'sub_interest' => (int)getv('sub_interest', '0'), 'kave_sender' => (string)getv('kave_sender', ''), 'kave_sender_auto' => (string)getv('kave_sender_auto', ''), 'donate_card' => (string)getv('donate_card', ''), 'donate_name' => (string)getv('donate_name', ''), 'engine' => db_engine(), 'sms_provider' => getv('sms_provider', 'kavenegar'), 'pay_env' => getv('pay_env', 'test'), 'notice' => (string)getv('notice', ''), 'tips' => (string)getv('tips', ''), 'app_ver' => (string)getv('app_ver', ''), 'app_url' => (string)getv('app_url', '')],
        'services' => ['db' => db_engine(), 'php' => PHP_VERSION, 'sms_provider' => getv('sms_provider', 'kavenegar'), 'smsir' => (bool)C('smsir_api_key'), 'payping' => (bool)(C('payping_token_live') || C('payping_token_test')), 'kavenegar' => (bool)(C('kavenegar_api_key') && C('kavenegar_api_key') !== 'PUT_KEY_HERE'), 'neshan_service' => (bool)C('neshan_service_key'), 'neshan_web' => (bool)C('neshan_web_key'), 'curl' => function_exists('curl_init'), 'tpl_login' => C('kavenegar_template', 'residim-login'), 'tpl_invite' => C('kavenegar_tpl_invite'), 'tpl_arrived' => C('kavenegar_tpl_arrived')],
        'default_pass' => C('admin_pass') === 'mot']);
}
case 'admin_flag': { need_admin(); $k = (string)($in['k'] ?? ''); if (!in_array($k, ['sms_invite', 'sms_arrive', 'auto_arrive', 'test_tools', 'signup_open', 'otp_dev', 'sms_direct', 'otp_bale', 'pay_gateway', 'league_on', 'paid_mode', 'station_on', 'trip_scene', 'family_link', 'cand_swipe', 'trip_window', 'trusted_driver'], true)) NO('کلید نامعتبر.'); setv($k, !empty($in['v']) ? '1' : '0'); YES(); }
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
    usort($out, fn($a, $b) => $a['d'] <=> $b['d']); YES(['items' => array_slice($out, 0, 120), 'err' => $GLOBALS['NESHAN_ERR'] ?? null]); }
case 'admin_import_file': { need_admin(); $f = __DIR__ . '/../data/places-' . preg_replace('/[^a-z]/', '', (string)($in['city'] ?? 'qom')) . '.json'; if (!is_file($f)) NO('فایل داده‌ی این شهر نیست.'); $j = json_decode((string)file_get_contents($f), true);
    YES(['city' => $j['city'], 'items' => array_map(fn($x) => $x + ['city' => $j['city']], (array)$j['items']), 'source' => $j['source'] ?? '']); }
case 'admin_import_places': { need_admin(); $made = [];
    foreach (array_slice((array)($in['items'] ?? []), 0, 100) as $it) { $nm = trim((string)($it['title'] ?? '')); $la = (float)($it['lat'] ?? 0); $lo = (float)($it['lng'] ?? 0); if (mb_strlen($nm) < 3 || !$la) continue;
        $ex = null; foreach (rows('SELECT * FROM places') as $pp) if (hav($la, $lo, (float)$pp['lat'], (float)$pp['lng']) < 150 && pname_norm($pp['name']) === pname_norm($nm)) { $ex = $pp; break; }
        if (!$ex) { $g = mb_strpos($nm, 'دخترانه') !== false ? 'f' : (mb_strpos($nm, 'پسرانه') !== false ? 'm' : 'fm'); $kind = preg_match('/مهد|پیش ?دبستان/u', $nm) ? 'kinder' : (preg_match('/دانشگاه|دانشکده|حوزه|مدرسه علمیه|پردیس/u', $nm) ? 'uni' : (preg_match('/آموزشگاه|کانون|موسسه/u', $nm) ? 'institute' : 'school'));
            $id = uid(); q('INSERT INTO places(id,code,kind,name,city,gender,shift,lat,lng,t_in,t_out,days,created_by,verified,fake,created,nv,nv_title) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,NULL,0,0,?,1,?)', [$id, code8(), $kind, mb_substr($nm, 0, 150), mb_substr((string)($it['city'] ?? 'تهران'), 0, 50), $g, '', $la, $lo, '07:30', '13:30', '0,1,2,3,4', time(), mb_substr($nm, 0, 150)]);
            $ex = row('SELECT * FROM places WHERE id=?', [$id]); }
        $o = place_out($ex, false); $o['address'] = (string)($it['address'] ?? ''); $made[] = $o; }
    YES(['places' => $made]); }
case 'admin_payments': { need_admin(); $L = rows('SELECT ref,purpose,amount,env,status,refid,card,name,mobile,note,created FROM payments ORDER BY created DESC LIMIT 500');
    $sum = (int)q("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid' AND env='live'")->fetchColumn(); YES(['list' => $L, 'sum_live' => $sum]); }
case 'admin_errors': { need_admin(); YES(['list' => rows('SELECT id,src,msg,at_url,ua,n,created,last FROM errors ORDER BY last DESC LIMIT 200')]); }
case 'admin_errors_clear': { need_admin(); q('DELETE FROM errors'); YES(); }
case 'admin_secrets': { need_admin(); $sec = secrets_all(); $out = [];
    foreach (SECRET_KEYS as $k) { $v = (string)C($k, ''); $hid = in_array($k, SECRET_HIDDEN, true); $out[$k] = ['set' => $v !== '', 'src' => isset($sec[$k]) && $sec[$k] !== '' ? 'admin' : ($v !== '' ? 'config' : ''), 'show' => $hid ? ($v !== '' ? '••••' . mb_substr($v, -4) : '') : $v]; }
    YES(['secrets' => $out, 'writable' => is_writable(dirname(SECRET_FILE))]); }
case 'admin_secret_set': { need_admin(); $k = (string)($in['k'] ?? ''); if (!in_array($k, SECRET_KEYS, true)) NO('کلید نامعتبر.'); $v = trim((string)($in['v'] ?? ''));
    if ($k === 'fcm_service_json' && $v !== '') { $v = preg_replace('/\s*\n\s*/', ' ', $v); $j = json_decode($v, true); if (!$j || empty($j['project_id']) || empty($j['client_email']) || empty($j['private_key'])) NO('این فایل JSON حساب سرویس فایربیس نیست (project_id، client_email و private_key لازم است).'); }
    elseif (mb_strlen($v) > 400 || preg_match('/[\x00-\x1f]/', $v)) NO('مقدار نامعتبر است.'); $sec = secrets_all(); if ($v === '') unset($sec[$k]); else $sec[$k] = $v; secrets_save($sec); YES(); }
case 'admin_test': { need_admin(); $w = (string)($in['what'] ?? '');
    if ($w === 'payping') { $env = ($in['env'] ?? '') === 'live' ? 'live' : 'test'; if (!pp_token($env)) NO('توکن ' . ($env === 'live' ? 'اصلی' : 'تست') . ' ذخیره نشده است.');
        [$h, $j, $raw] = pp('POST', 'pay', ['amount' => 10000, 'returnUrl' => 'https://residim.ir/app/api/pay.php', 'clientRefId' => 'TEST' . time(), 'description' => 'آزمون اتصال پیشخوان رسیدیم'], $env);
        if ($h === 200 && !empty($j['paymentCode'])) { pp('DELETE', 'pay', ['paymentCode' => $j['paymentCode']], $env); YES(['pass' => true, 'msg' => 'توکن معتبر است؛ یک دستور پرداخت آزمایشی ساخته و حذف شد.']); }
        YES(['pass' => false, 'msg' => pp_err($j, $raw, $h)]); }
    if ($w === 'smsir') { if (!C('smsir_api_key')) NO('کلید sms.ir ذخیره نشده است.'); [$h, $raw] = http_json('GET', 'https://api.sms.ir/v1/credit', null, ['X-API-KEY: ' . C('smsir_api_key')]); $j = json_decode($raw, true);
        YES(['pass' => (int)($j['status'] ?? 0) === 1, 'msg' => (int)($j['status'] ?? 0) === 1 ? 'اتصال برقرار است؛ اعتبار: ' . ($j['data'] ?? '?') : ((string)($j['message'] ?? '') ?: 'HTTP ' . $h)]); }
    if ($w === 'kavenegar') { if (!C('kavenegar_api_key')) NO('کلید کاوه‌نگار ذخیره نشده است.'); [$h, $raw] = http_raw('https://api.kavenegar.com/v1/' . rawurlencode((string)C('kavenegar_api_key')) . '/account/info.json'); $j = json_decode($raw, true); $st = (int)($j['return']['status'] ?? $h);
        YES(['pass' => $st === 200, 'msg' => $st === 200 ? 'اتصال برقرار است؛ اعتبار: ' . number_format((int)($j['entries']['remaincredit'] ?? 0)) . ' ریال' : (KAVE_CODES[$st] ?? ('کد ' . $st))]); }
    if ($w === 'neshan') { if (!C('neshan_service_key')) NO('کلید سرویس نشان ذخیره نشده است.'); $r = neshan('/v5/reverse', ['lat' => 35.6997, 'lng' => 51.3380]); YES(['pass' => (bool)$r, 'msg' => $r ? 'اتصال برقرار است: ' . ($r['formatted_address'] ?? 'نشانی دریافت شد') : 'نشان پاسخ نداد یا کلید نامعتبر است.']); }
    if ($w === 'bale') { if (!C('bale_client_id') || !C('bale_client_secret')) NO('شناسه و رمز سفیر بله ذخیره نشده است.'); setv('bale_tok_exp', '0'); $t = bale_token(); YES(['pass' => $t !== '', 'msg' => $t !== '' ? 'اتصال برقرار است؛ توکن سفیر بله گرفته شد.' : 'توکن گرفته نشد: ' . (string)getv('bale_last_err', '')]); }
    NO('آزمون نامعتبر.'); }
case 'admin_backups': { need_admin(); $d = dirname(__DIR__) . '/storage/backups'; $L = []; foreach (glob($d . '/r6-*.sqlite') ?: [] as $f) $L[] = ['name' => basename($f), 'mb' => round(filesize($f) / 1048576, 2)]; rsort($L); YES(['list' => $L, 'engine' => db_engine()]); }
case 'admin_backup_now': { need_admin(); setv('bk_day', ''); daily_backup(); YES(); }
case 'admin_fb': { need_admin(); $avg = row('SELECT AVG(stars) a, COUNT(*) n FROM feedback WHERE stars>0'); YES(['list' => rows('SELECT f.*, u.phone FROM feedback f LEFT JOIN users u ON u.id=f.user_id ORDER BY f.created DESC LIMIT 300'), 'avg' => round((float)($avg['a'] ?? 0), 2), 'n' => (int)($avg['n'] ?? 0)]); }
case 'admin_fb_set': { need_admin(); $id = (string)($in['id'] ?? ''); if (!empty($in['delete'])) { q('DELETE FROM feedback WHERE id=?', [$id]); q('DELETE FROM fb_likes WHERE fb_id=?', [$id]); YES(); } q('UPDATE feedback SET pub=? WHERE id=?', [!empty($in['pub']) ? 1 : 0, $id]); if (isset($in['text'])) q('UPDATE feedback SET text=? WHERE id=?', [mb_substr((string)$in['text'], 0, 1500), $id]); YES(); }
case 'admin_amb': { need_admin(); $L = rows('SELECT * FROM amb ORDER BY created DESC');
    foreach ($L as &$a) { $s2 = row('SELECT COUNT(*) n, COALESCE(SUM(amount),0) s, COALESCE(SUM(CASE WHEN paid=1 THEN amount ELSE 0 END),0) p, SUM(CASE WHEN kind=\'team\' THEN 1 ELSE 0 END) t FROM referrals WHERE amb_id=?', [$a['id']]); $a['n'] = (int)$s2['n']; $a['teams'] = (int)$s2['t']; $a['sum'] = (int)$s2['s']; $a['paid'] = (int)$s2['p']; } unset($a); YES(['list' => $L]); }
case 'admin_amb_save': { need_admin(); $id = (string)($in['id'] ?? ''); $nm = mb_substr(trim((string)($in['name'] ?? '')), 0, 80); if (mb_strlen($nm) < 2) NO('نام را بنویسید.');
    $rp = max(0, (int)($in['rate_profile'] ?? 20000)); $rt = max(0, (int)($in['rate_team'] ?? 50000)); $ph = phone_norm((string)($in['phone'] ?? '')) ?: '';
    if ($id) { q('UPDATE amb SET name=?, phone=?, rate_profile=?, rate_team=?, note=?, active=? WHERE id=?', [$nm, $ph, $rp, $rt, mb_substr((string)($in['note'] ?? ''), 0, 250), empty($in['off']) ? 1 : 0, $id]); YES(); }
    $tok = bin2hex(random_bytes(12)); $code = 'A' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    q('INSERT INTO amb(id,token,code,name,phone,rate_profile,rate_team,note,active,created) VALUES(?,?,?,?,?,?,?,?,1,?)', [uid(), $tok, $code, $nm, $ph, $rp, $rt, mb_substr((string)($in['note'] ?? ''), 0, 250), time()]); YES(['token' => $tok, 'code' => $code]); }
case 'admin_amb_paid': { need_admin(); q('UPDATE referrals SET paid=1 WHERE amb_id=? AND paid=0', [(string)($in['id'] ?? '')]); YES(); }
case 'admin_setting': { need_admin(); $k = (string)($in['k'] ?? ''); $v = trim((string)($in['v'] ?? ''));
    if ($k === 'map_provider' && in_array($v, ['neshan', 'openfree'], true)) setv($k, $v);
    elseif (in_array($k, ['sub_price', 'free_permanent', 'free_temp_month'], true) && ctype_digit($v)) setv($k, $v);
    elseif ($k === 'kave_sender' && ($v === '' || ctype_digit($v))) { setv($k, $v); setv('kave_sender_at', '0'); }
    elseif ($k === 'donate_card' && ($v === '' || preg_match('/^\d{16}$/', $v))) setv($k, $v);
    elseif ($k === 'donate_name') setv($k, mb_substr($v, 0, 60));
    elseif ($k === 'sms_provider' && in_array($v, ['kavenegar', 'smsir'], true)) setv($k, $v);
    elseif ($k === 'pay_env' && in_array($v, ['test', 'live'], true)) setv($k, $v);
    elseif ($k === 'notice') setv($k, mb_substr($v, 0, 300));
    elseif ($k === 'tips') { $j = json_decode($v, true); if ($v !== '' && !is_array($j)) NO('فهرست توصیه‌ها باید JSON باشد.'); setv($k, $v); }
    elseif ($k === 'app_ver' || $k === 'app_url') setv($k, mb_substr($v, 0, 200));
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
case 'admin_push_test': { need_admin(); if (!C('fcm_service_json')) NO('اول JSON حساب سرویس فایربیس را ذخیره کنید.'); $u0 = row('SELECT id FROM users WHERE phone=?', [phone_norm((string)($in['phone'] ?? '')) ?: '-']); if (!$u0) NO('کاربری با این شماره نیست.');
    if (!row('SELECT 1 FROM push_tokens WHERE user_id=?', [$u0['id']])) NO('این کاربر هنوز اپ با اعلان سرور را باز نکرده است.'); YES(['n' => push_send([$u0['id']], 'رسیدیم 🚗', 'اعلان آزمایشی: اگر این را می‌بینید، خبرهای مهم حتی با اپ بسته می‌رسد.')]); }
case 'admin_user_delete': { need_admin(); $id = (string)($in['id'] ?? ''); $u0 = row('SELECT * FROM users WHERE id=?', [$id]); if (!$u0) NO('کاربر پیدا نشد.');
    foreach (rows('SELECT id FROM profiles WHERE user_id=?', [$id]) as $p) wipe_profile($p['id']); foreach (['tokens', 'fam_links', 'push_tokens'] as $tb) { try { q("DELETE FROM $tb WHERE user_id=?", [$id]); } catch (Throwable $e) {} } q('DELETE FROM users WHERE id=?', [$id]); YES(); }
case 'admin_users': { need_admin(); YES(['list' => rows('SELECT u.id,u.phone,u.fake,u.created,u.client,u.seen,(SELECT GROUP_CONCAT(p.label) FROM profiles p WHERE p.user_id=u.id) labels,(SELECT COUNT(*) FROM profiles p WHERE p.user_id=u.id) profiles FROM users u ORDER BY u.created DESC LIMIT 200')]); }
case 'admin_sms': { need_admin(); YES(['list' => rows('SELECT phone,tpl,status,created FROM sms ORDER BY created DESC LIMIT 100')]); }
case 'admin_sms_test': {
    need_admin(); $ph = phone_norm((string)($in['phone'] ?? '')); if (!$ph) NO('شماره نامعتبر است.');
    $tpl = (string)($in['tpl'] ?? C('kavenegar_template', 'residim-login')); $tok = ['token' => '12345'];
    if ($tpl === C('kavenegar_tpl_invite')) $tok = ['token' => 'TEST2345', 'token10' => 'آزمایشی', 'token20' => 'مدرسه آزمایشی'];
    if ($tpl === C('kavenegar_tpl_arrived')) $tok = ['token' => date('H:i'), 'token2' => 'آزمایشی', 'token10' => 'فرزند آزمایشی', 'token20' => 'مدرسه'];
    $r = kave($ph, $tpl, $tok, null, ($in['type'] ?? '') === 'call' ? 'call' : 'sms');
    YES(['result' => $r, 'direct' => flag('sms_direct') && ($in['type'] ?? '') !== 'call', 'provider' => getv('sms_provider', 'kavenegar'), 'key_set' => sms_ready(), 'template' => $tpl]);
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
    error_log('[r6] ' . $e->getMessage() . ' @' . $e->getLine()); log_error('server', $e->getMessage() . ' @' . $e->getLine() . ' a=' . ($a ?? ''));
    NO('خطای سرور؛ کمی بعد دوباره تلاش کنید.', 500, 'server');
}
} // R6_MAIN

/* accept helpers (declared after router for readability; PHP hoists functions) */
function accept_invite(array $i, array $from, array $to): ?array {
    $from = row('SELECT * FROM profiles WHERE id=?', [$from['id']]); $to = row('SELECT * FROM profiles WHERE id=?', [$to['id']]);
    $all = array_merge(riders_of($from), riders_of($to)); foreach ([$from['team_id'], $to['team_id']] as $tid) if ($tid) foreach (rows('SELECT * FROM profiles WHERE team_id=?', [$tid]) as $x) if ($x['id'] !== $from['id'] && $x['id'] !== $to['id']) $all = array_merge($all, riders_of($x));
    if (!team_rule_ok(row('SELECT * FROM places WHERE id=?', [$from['place_id']]), $all)) { q('UPDATE invites SET status=?, responded=? WHERE id=?', ['declined', time(), $i['id']]); throw new RuntimeException('طبق قانون سن و جنسیت این هم‌تیمی ممکن نیست.'); }
    if ($from['team_id'] && $to['team_id']) { q('UPDATE invites SET status=?, responded=? WHERE id=?', ['declined', time(), $i['id']]); throw new RuntimeException('هر دو در تیم هستید.'); }
    if (count($all) > team_cap($all)) { q('UPDATE invites SET status=?, responded=? WHERE id=?', ['declined', time(), $i['id']]); throw new RuntimeException('تیم پر است: در یک خودرو بیشتر از ' . (team_cap($all) === 5 ? '۵' : '۴') . ' نفر جا نمی‌شوند.'); }
    $place = row('SELECT * FROM places WHERE id=?', [$from['place_id']]);
    if ($from['team_id']) { $t = row('SELECT * FROM teams WHERE id=?', [$from['team_id']]); team_join($t, $to); }
    elseif ($to['team_id']) { $t = row('SELECT * FROM teams WHERE id=?', [$to['team_id']]); team_join($t, $from); }
    else $t = team_create($place, [$from, $to]);
    q('UPDATE invites SET status=?, responded=? WHERE id=?', ['accepted', time(), $i['id']]);
    try { foreach (rows('SELECT * FROM invite_msgs WHERE invite_id=? ORDER BY created', [$i['id']]) as $im) q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $t['id'], $im['profile_id'], $im['text'], (int)$im['created']]);
        $fams = implode(' و ', array_map(fn($x) => 'خانواده ' . (pdata($x)['family'] ?? ''), [$from, $to]));
        q('INSERT INTO msgs(id,team_id,profile_id,text,created) VALUES(?,?,?,?,?)', [uid(), $t['id'], 'system', "سلام و خوش آمدید! 🌷 $fams حالا هم‌تیمی‌اند. اول با هم آشنا شوید: یک سلام، معرفی کوتاه، و مرور شرایط هم (روی عکس هر خانواده بزنید). بعد «قرار تیم» را بنویسید و هر کس «توافق کردیم» را بزند.", time()]);
        q('UPDATE teams SET agree=? WHERE id=?', ['[]', $t['id']]); } catch (Throwable $e) {}
    $t = row('SELECT * FROM teams WHERE id=?', [$t['id']]); $name = 'تیم ' . $t['no'] . ' · محله ' . $t['hood'];
    foreach (rows('SELECT id FROM profiles WHERE team_id=?', [$t['id']]) as $m) note($m['id'], "$name شکل گرفت/بزرگ‌تر شد! خوش آمدید.", 'team', $t['id']);
    foreach ([$from, $to] as $pp) { $rr = row("SELECT amb_id FROM referrals WHERE profile_id=? AND kind='profile'", [$pp['id']]); if ($rr) { $am = row('SELECT code FROM amb WHERE id=?', [$rr['amb_id']]); if ($am) ref_credit($am['code'], $pp['user_id'], $pp, 'team'); } }
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
