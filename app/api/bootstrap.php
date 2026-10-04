<?php
declare(strict_types=1);

function residim_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $cfg = [
        'app_env' => getenv('RESIDIM_APP_ENV') ?: 'production',
        'db_dsn' => getenv('RESIDIM_DB_DSN') ?: ('sqlite:' . dirname(__DIR__) . '/storage/residim.sqlite'),
        'db_user' => getenv('RESIDIM_DB_USER') ?: null,
        'db_pass' => getenv('RESIDIM_DB_PASS') ?: null,
        'sms_driver' => getenv('RESIDIM_SMS_DRIVER') ?: 'none',
        'sms_webhook_url' => getenv('RESIDIM_SMS_WEBHOOK_URL') ?: '',
        'sms_webhook_token' => getenv('RESIDIM_SMS_WEBHOOK_TOKEN') ?: '',
        'kavenegar_api_key' => getenv('RESIDIM_KAVENEGAR_API_KEY') ?: '',
        'kavenegar_template' => getenv('RESIDIM_KAVENEGAR_TEMPLATE') ?: 'residim-login',
        'otp_ttl' => 180,
        'otp_max_attempts' => 5,
    ];
    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $extra = require $local;
        if (is_array($extra)) $cfg = array_replace($cfg, $extra);
    }
    return $cfg;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $c = residim_config();
    $pdo = new PDO($c['db_dsn'], $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }
    init_schema($pdo);
    return $pdo;
}

function init_schema(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'mysql') {
        $sql = [
            "CREATE TABLE IF NOT EXISTS users (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, phone VARCHAR(20) NOT NULL UNIQUE, display_name VARCHAR(80) NOT NULL DEFAULT 'خانواده', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS groups_tbl (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, invite_code VARCHAR(12) NOT NULL UNIQUE, trip_value BIGINT NOT NULL DEFAULT 100000, created_by BIGINT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX(created_by)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS memberships (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, group_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'member', start_date DATE NOT NULL, active TINYINT(1) NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_membership(group_id,user_id), INDEX(group_id), INDEX(user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS trips (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, group_id BIGINT UNSIGNED NOT NULL, service_date DATE NOT NULL, direction VARCHAR(20) NOT NULL, planned_time VARCHAR(8) NOT NULL, assigned_user_id BIGINT UNSIGNED NULL, status VARCHAR(32) NOT NULL DEFAULT 'planned', actual_user_id BIGINT UNSIGNED NULL, started_at DATETIME NULL, completed_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_trip_slot(group_id,service_date,direction), INDEX(group_id), INDEX(assigned_user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS trip_events (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, trip_id BIGINT UNSIGNED NULL, group_id BIGINT UNSIGNED NULL, user_id BIGINT UNSIGNED NOT NULL, type VARCHAR(40) NOT NULL, lat DECIMAL(10,7) NULL, lng DECIMAL(10,7) NULL, accuracy INT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX(trip_id), INDEX(group_id), INDEX(user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS ledger_entries (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, group_id BIGINT UNSIGNED NOT NULL, trip_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, amount BIGINT NOT NULL, kind VARCHAR(24) NOT NULL, label VARCHAR(160) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_ledger(group_id,trip_id,user_id,kind), INDEX(group_id), INDEX(user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS otp_codes (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, phone VARCHAR(20) NOT NULL, code_hash VARCHAR(255) NOT NULL, expires_at DATETIME NOT NULL, attempts INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX(phone), INDEX(expires_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS swap_requests (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, trip_id BIGINT UNSIGNED NOT NULL, requested_by BIGINT UNSIGNED NOT NULL, original_assignee BIGINT UNSIGNED NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'open', accepted_by BIGINT UNSIGNED NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, accepted_at DATETIME NULL, INDEX(trip_id), INDEX(status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        ];
    } else {
        $sql = [
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL DEFAULT 'خانواده', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
            "CREATE TABLE IF NOT EXISTS groups_tbl (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, invite_code TEXT NOT NULL UNIQUE, trip_value INTEGER NOT NULL DEFAULT 100000, created_by INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
            "CREATE TABLE IF NOT EXISTS memberships (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'member', start_date TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(group_id,user_id))",
            "CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL, service_date TEXT NOT NULL, direction TEXT NOT NULL, planned_time TEXT NOT NULL, assigned_user_id INTEGER, status TEXT NOT NULL DEFAULT 'planned', actual_user_id INTEGER, started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(group_id,service_date,direction))",
            "CREATE TABLE IF NOT EXISTS trip_events (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER, group_id INTEGER, user_id INTEGER NOT NULL, type TEXT NOT NULL, lat REAL, lng REAL, accuracy INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
            "CREATE TABLE IF NOT EXISTS ledger_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL, trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL, amount INTEGER NOT NULL, kind TEXT NOT NULL, label TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(group_id,trip_id,user_id,kind))",
            "CREATE TABLE IF NOT EXISTS otp_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
            "CREATE TABLE IF NOT EXISTS swap_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, requested_by INTEGER NOT NULL, original_assignee INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'open', accepted_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, accepted_at TEXT)"
        ];
    }
    foreach ($sql as $q) $pdo->exec($q);
    $done = true;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) fail('invalid_json', 'درخواست معتبر نیست.', 400);
    return $data;
}
function out(array $data, int $status = 200): never {
    http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);exit;
}
function ok(array $data = []): never { out(['ok' => true] + $data); }
function fail(string $error, string $message, int $status = 400, array $extra = []): never { out(['ok'=>false,'error'=>$error,'message'=>$message] + $extra, $status); }
function request_method(): string { return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'); }
function require_method(string $method): void { if (request_method() !== strtoupper($method)) fail('method_not_allowed','روش درخواست مجاز نیست.',405); }

function assert_same_origin(): void {
    if (request_method() === 'GET' || request_method() === 'HEAD') return;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($origin) { $o = parse_url($origin, PHP_URL_HOST); if (!$o || strcasecmp((string)$o, preg_replace('/:\d+$/','',$host)) !== 0) fail('origin_rejected','مبدأ درخواست معتبر نیست.',403); }
}

function boot_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params(['lifetime'=>60*60*24*30,'path'=>'/app/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
    session_name('residim_session'); session_start();
}
function current_user_id(bool $required = true): ?int {
    boot_session(); $id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    if ($required && !$id) fail('unauthenticated','برای ادامه وارد حساب شوید.',401); return $id ?: null;
}
function normalize_phone(string $phone): string {
    $map = ['۰'=>'0','۱'=>'1','۲'=>'2','۳'=>'3','۴'=>'4','۵'=>'5','۶'=>'6','۷'=>'7','۸'=>'8','۹'=>'9','٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9'];
    $p = strtr(trim($phone), $map); $p = preg_replace('/[\s\-()]/', '', $p) ?? $p;
    if (str_starts_with($p, '+98')) $p = '0' . substr($p, 3); if (str_starts_with($p, '98') && strlen($p) === 12) $p = '0' . substr($p, 2);
    if (!preg_match('/^09\d{9}$/', $p)) fail('invalid_phone','شماره موبایل معتبر نیست.',422); return $p;
}
function now_sql(): string { return gmdate('Y-m-d H:i:s'); }
function random_code(int $length = 6): string { $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; $out=''; for ($i=0;$i<$length;$i++) $out .= $alphabet[random_int(0, strlen($alphabet)-1)]; return $out; }

function send_sms_otp(string $phone, string $code): array {
    $c = residim_config(); $driver = strtolower((string)$c['sms_driver']);
    if ($driver === 'demo' && $c['app_env'] !== 'production') return ['debug_code'=>$code];
    if ($driver === 'kavenegar') {
        if (!$c['kavenegar_api_key']) fail('sms_not_configured','کلید سرویس پیامک روی سرور تنظیم نشده است.',503);
        $url = 'https://api.kavenegar.com/v1/' . rawurlencode($c['kavenegar_api_key']) . '/verify/lookup.json?' . http_build_query(['receptor'=>$phone,'token'=>$code,'template'=>$c['kavenegar_template']]);
        $ch = curl_init($url); curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>12,CURLOPT_CONNECTTIMEOUT=>6]);
        $body = curl_exec($ch); $status = (int)curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
        if ($body === false || $status < 200 || $status >= 300) fail('sms_send_failed','ارسال پیامک انجام نشد. کمی بعد دوباره تلاش کنید.',502,['provider_status'=>$status ?: null]);
        return [];
    }
    if ($driver === 'webhook') {
        if (!$c['sms_webhook_url']) fail('sms_not_configured','وب‌هوک پیامک روی سرور تنظیم نشده است.',503);
        $ch = curl_init($c['sms_webhook_url']); $headers=['Content-Type: application/json','Accept: application/json']; if($c['sms_webhook_token'])$headers[]='Authorization: Bearer '.$c['sms_webhook_token'];
        curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode(['phone'=>$phone,'code'=>$code,'purpose'=>'login'],JSON_UNESCAPED_UNICODE),CURLOPT_HTTPHEADER=>$headers,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>12,CURLOPT_CONNECTTIMEOUT=>6]);
        $body=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
        if($body===false||$status<200||$status>=300) fail('sms_send_failed','ارسال پیامک انجام نشد. کمی بعد دوباره تلاش کنید.',502); return [];
    }
    fail('sms_not_configured','سرویس پیامک هنوز روی سرور فعال نشده است.',503);
}

function group_membership(int $groupId, int $userId): array {
    $s=db()->prepare('SELECT * FROM memberships WHERE group_id=? AND user_id=? AND active=1');$s->execute([$groupId,$userId]);$m=$s->fetch();
    if(!$m) fail('forbidden','شما عضو این هم‌سرویس نیستید.',403);return $m;
}
function selected_group_id(int $userId): ?int {
    boot_session();
    if(!empty($_SESSION['group_id'])){$gid=(int)$_SESSION['group_id'];$s=db()->prepare('SELECT 1 FROM memberships WHERE group_id=? AND user_id=? AND active=1');$s->execute([$gid,$userId]);if($s->fetchColumn())return $gid;}
    $s=db()->prepare('SELECT group_id FROM memberships WHERE user_id=? AND active=1 ORDER BY id LIMIT 1');$s->execute([$userId]);$gid=$s->fetchColumn();
    if($gid){$_SESSION['group_id']=(int)$gid;return (int)$gid;}return null;
}
function next_week_start(): string { $d=new DateTimeImmutable('today');$dow=(int)$d->format('w');$daysSinceSaturday=($dow+1)%7;return $d->modify('-'.$daysSinceSaturday.' days')->format('Y-m-d'); }
function seed_week(int $groupId, int $userId): void {
    $pdo=db();$start=new DateTimeImmutable(next_week_start());$mysql=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql';
    $insert=$pdo->prepare($mysql?'INSERT IGNORE INTO trips(group_id,service_date,direction,planned_time,assigned_user_id,status) VALUES(?,?,?,?,?,?)':'INSERT OR IGNORE INTO trips(group_id,service_date,direction,planned_time,assigned_user_id,status) VALUES(?,?,?,?,?,?)');
    for($i=0;$i<6;$i++){$date=$start->modify('+'.$i.' days')->format('Y-m-d');$insert->execute([$groupId,$date,'morning','07:10',$userId,'planned']);$insert->execute([$groupId,$date,'return','13:15',$userId,'planned']);}
}
function user_payload(int $userId): array {
    $s=db()->prepare('SELECT id,display_name,created_at FROM users WHERE id=?');$s->execute([$userId]);return $s->fetch() ?: ['id'=>$userId,'display_name'=>'خانواده شما'];
}
function bootstrap_payload(int $userId): array {
    $pdo=db();$gq=$pdo->prepare('SELECT g.id,g.name,g.invite_code,g.trip_value,m.role,m.start_date FROM memberships m JOIN groups_tbl g ON g.id=m.group_id WHERE m.user_id=? AND m.active=1 ORDER BY g.id');$gq->execute([$userId]);$groups=$gq->fetchAll();
    $gid=selected_group_id($userId);if(!$gid)return ['user'=>user_payload($userId),'groups'=>[],'group'=>null,'members'=>[],'trips'=>[],'ledger'=>[],'current_member_id'=>$userId];
    $group=null;foreach($groups as $g){if((int)$g['id']===$gid){$group=$g;break;}}
    $mq=$pdo->prepare('SELECT m.user_id AS id,m.role,m.start_date,u.display_name FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.group_id=? AND m.active=1 ORDER BY m.id');$mq->execute([$gid]);$members=$mq->fetchAll();
    foreach($members as $i=>&$m){$m['is_current']=((int)$m['id']===$userId);$m['label']=$m['is_current']?'خانواده شما':'همیار '.($i+1);}unset($m);
    $from=(new DateTimeImmutable('today'))->modify('-14 days')->format('Y-m-d');$to=(new DateTimeImmutable('today'))->modify('+30 days')->format('Y-m-d');
    $tq=$pdo->prepare('SELECT t.*,g.trip_value AS value FROM trips t JOIN groups_tbl g ON g.id=t.group_id WHERE t.group_id=? AND t.service_date BETWEEN ? AND ? ORDER BY t.service_date,t.planned_time');$tq->execute([$gid,$from,$to]);$trips=$tq->fetchAll();
    foreach($trips as &$t){$t['assigned_member_id']=$t['assigned_user_id'];$t['actual_member_id']=$t['actual_user_id'];}unset($t);
    $lq=$pdo->prepare('SELECT user_id,amount,kind,label,trip_id,DATE(created_at) AS date FROM ledger_entries WHERE group_id=? ORDER BY id DESC LIMIT 500');$lq->execute([$gid]);$ledger=$lq->fetchAll();
    return ['user'=>user_payload($userId),'groups'=>$groups,'group'=>$group,'members'=>$members,'trips'=>$trips,'ledger'=>$ledger,'invite_code'=>$group['invite_code']??'','current_member_id'=>$userId];
}
