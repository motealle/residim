<?php
/**
 * Short links residim.ir/ABCD2345 land here (root .htaccess rewrite).
 * Serves the normal app page, with Open Graph tags for the place so messengers show a rich preview.
 */
declare(strict_types=1);
require_once __DIR__ . '/r6.php';

$code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($_GET['c'] ?? '')));
$root = dirname(__DIR__, 2);
$file = getenv('R6_INDEX') ?: (is_file($root . '/index.html') ? $root . '/index.html' : $root . '/landing/index.html');
$html = (string)@file_get_contents($file);
if ($html === '') { http_response_code(404); exit('not found'); }

$place = null;
try { if ($code !== '') $place = row('SELECT name, city, kind FROM places WHERE code=?', [$code]); } catch (Throwable $e) {}
$host = 'https://residim.ir'; // canonical: never the hosting account's technical domain
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

if ($place) {
    $kids = in_array($place['kind'], ['school', 'kinder', 'institute', 'club'], true);
    $title = 'سرویس مشارکتی «' . $place['name'] . '» · رسیدیم';
    $desc = $kids ? 'اگر هم‌محله و هم‌مسیریم، چرا هر کدام جدا؟ بچه‌ها را نوبتی ببریم و بیاوریم؛ وقت آزاد، خرج نصف، خیال راحت. ثبت‌نام در ۲ دقیقه.'
                  : 'اگر هم‌مسیریم، چرا هر روز جدا جدا؟ نوبتی برانیم؛ ترافیک کمتر، خرج نصف. ثبت‌نام در ۲ دقیقه.';
    $meta = '<meta property="og:title" content="' . $e($title) . '">' . "\n"
          . '<meta property="og:description" content="' . $e($desc) . '">' . "\n"
          . '<meta property="og:url" content="' . $e($host . '/' . $code) . '">' . "\n"
          . '<meta name="description" content="' . $e($desc) . '">';
    $html = preg_replace('#<meta property="og:title"[^>]*>#u', '', $html);
    $html = preg_replace('#<meta property="og:description"[^>]*>#u', '', $html);
    $html = preg_replace('#<meta property="og:url"[^>]*>#u', '', $html);
    $html = preg_replace('#<meta name="description"[^>]*>#u', '', $html);
    $html = preg_replace('#<title>.*?</title>#us', '<title>' . $e($title) . '</title>', $html, 1);
    $html = str_replace('</head>', $meta . "\n</head>", $html);
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
echo $html;
