<?php
/** /app/api/logo.php?p=<place id> — a paid school's logo (shown to its guest families), cached for a day. */
declare(strict_types=1);
require_once __DIR__ . '/r6x.php';
x_schema();
$r = row('SELECT logo, plan_until FROM places WHERE id=?', [preg_replace('/[^A-Za-z0-9]/', '', (string)($_GET['p'] ?? ''))]);
if (!$r || empty($r['logo']) || (int)$r['plan_until'] < time() || !preg_match('#^data:(image/(png|jpeg|webp));base64,(.+)$#', (string)$r['logo'], $m)) { http_response_code(404); exit; }
header('Content-Type: ' . $m[1]); header('Cache-Control: public, max-age=86400'); header('X-Content-Type-Options: nosniff'); header("Content-Security-Policy: default-src 'none'");
echo base64_decode($m[3]);
