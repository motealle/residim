<?php
/**
 * PayPing v3 return URL: https://residim.ir/app/api/pay.php
 * PayPing POSTs status, errorCode and data (a JSON string with clientRefId, paymentCode, paymentRefId, amount…).
 * The amount we verify always comes from our own database, never from the request.
 */
declare(strict_types=1);
require_once __DIR__ . '/r6.php';

$in = array_merge($_GET, $_POST);
$data = isset($in['data']) && is_string($in['data']) ? (json_decode($in['data'], true) ?: []) : [];
$d = $in + $data;
$ref = preg_replace('/[^A-Z0-9]/', '', strtoupper((string)($d['clientRefId'] ?? $d['clientrefid'] ?? '')));
$code = (string)($d['paymentCode'] ?? $d['paymentcode'] ?? '');
$refId = (string)($d['paymentRefId'] ?? $d['refid'] ?? '');
$back = fn(string $st, string $r) => header('Location: https://residim.ir/#pay/' . $st . '/' . rawurlencode($r), true, 303) || exit;

$p = $ref ? row('SELECT * FROM payments WHERE ref=?', [$ref]) : null;
if (!$p) { log_error('pay', 'callback without a known payment: ' . mb_substr(json_encode($d, JSON_UNESCAPED_UNICODE), 0, 300)); $back('fail', $ref ?: 'x'); }
if ($p['status'] === 'paid') $back('ok', $ref);                                  // a reload or a second callback
if ($code === '' || !hash_equals((string)$p['code'], $code)) { log_error('pay', "code mismatch $ref"); $back('fail', $ref); }
if ((int)($d['status'] ?? 0) !== 1 || $refId === '') { q('UPDATE payments SET status=?, note=?, updated=? WHERE id=?', ['canceled', mb_substr('errorCode ' . ($d['errorCode'] ?? ''), 0, 250), time(), $p['id']]); $back('fail', $ref); }

[$h, $j, $raw] = pp('POST', 'pay/verify', ['amount' => (int)$p['amount'], 'paymentCode' => $code, 'paymentRefId' => (int)$refId], (string)$p['env']);
if ($h === 200) {
    $card = (string)($j['cardNumber'] ?? $d['cardNumber'] ?? '');
    q('UPDATE payments SET status=?, refid=?, card=?, note=?, updated=? WHERE id=? AND status<>?', ['paid', $refId, mb_substr($card, 0, 40), '', time(), $p['id'], 'paid']);
    $back('ok', $ref);
}
$m = pp_err($j, $raw, $h);
q('UPDATE payments SET status=?, refid=?, note=?, updated=? WHERE id=?', ['verify_failed', $refId, mb_substr($m, 0, 250), time(), $p['id']]);
log_error('pay', "verify $ref: $m");
$back('fail', $ref);
