<?php
// Local/CI router: /app/* -> repo app (PHP), /XXXXXXXX -> share.php, everything else -> landing/
$u = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); $repo = dirname(__DIR__, 2);
if (str_starts_with($u, '/app/')) { $f = $repo . $u; if (str_ends_with($u, '.php') && is_file($f)) { $_SERVER['SCRIPT_FILENAME'] = $f; chdir(dirname($f)); require $f; return true; } }
elseif (preg_match('#^/([A-Za-z2-9]{8})/?$#', $u, $m)) { $_GET['c'] = $m[1]; $_SERVER['SCRIPT_FILENAME'] = $repo . '/app/api/share.php'; chdir($repo . '/app/api'); putenv('R6_INDEX=' . $repo . '/landing/index.html'); require $repo . '/app/api/share.php'; return true; }
else $f = $repo . '/landing' . $u;
if (is_dir($f)) $f = rtrim($f, '/') . '/index.html';
if (!is_file($f)) { http_response_code(404); echo 'nf'; return true; }
$t = ['html' => 'text/html; charset=utf-8', 'js' => 'application/javascript', 'css' => 'text/css', 'svg' => 'image/svg+xml', 'png' => 'image/png', 'woff2' => 'font/woff2', 'json' => 'application/json', 'webmanifest' => 'application/manifest+json'];
header('Content-Type: ' . ($t[pathinfo($f, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
$h = file_get_contents($f); if (str_ends_with($f, 'index.html')) $h = str_replace('<base href="/">', '<base href="/">', $h); echo $h; return true;
