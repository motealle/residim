<?php
/**
 * Return URL of every gateway: https://residim.ir/app/api/pay.php
 * - ZarinPal v4: GET Authority, Status (OK|NOK)
 * - Saman (SEP): POST MID, TerminalId, RefNum, ResNum, State, Status, Token…
 * - PayPing v3: POST status, errorCode and data (JSON with clientRefId, paymentCode, paymentRefId…)
 * Rules for all three: the payment must be ours and still open, the amount we verify always comes from our database,
 * and pay_paid() marks it paid exactly once (a reload, a second callback or a race delivers nothing twice).
 */
declare(strict_types=1);
require_once __DIR__ . '/r6.php';

$in = array_merge($_GET, $_POST);
$p = null;
$back = function (string $st, string $r) use (&$p): void {
    $to = $p && str_starts_with((string)($p['purpose'] ?? ''), 'sub_') ? 'pricing/' : '';
    header('Cache-Control: no-store'); header('Location: https://residim.ir/' . $to . '#pay/' . $st . '/' . rawurlencode($r), true, 303); exit;
};
$fail = function (string $status, string $note) use (&$p): void {
    q('UPDATE payments SET status=?, note=?, updated=? WHERE id=? AND status<>?', [$status, mb_substr($note, 0, 250), time(), $p['id'], 'paid']);
};

/* ZarinPal */
if (isset($in['Authority'])) {
    $au = (string)$in['Authority'];
    if (!preg_match('/^[A-Za-z0-9]{10,64}$/', $au)) $back('fail', 'x');
    $p = row("SELECT * FROM payments WHERE code=? AND env IN ('zp_test','zp_live')", [$au]);
    if (!$p) { log_error('pay', 'zarinpal callback without a known payment: ' . mb_substr($au, 0, 64)); $back('fail', 'x'); }
    if ($p['status'] === 'paid') $back('ok', $p['ref']);
    if ((string)($in['Status'] ?? '') !== 'OK') { $fail('canceled', 'Status ' . mb_substr((string)($in['Status'] ?? ''), 0, 10)); $back('fail', $p['ref']); }
    [$h, $j, $raw] = zp((string)$p['env'], 'verify.json', ['merchant_id' => zp_mid(), 'amount' => (int)$p['amount'] * 10, 'authority' => $au]);
    $c = (int)($j['data']['code'] ?? 0);
    if ($h === 200 && ($c === 100 || $c === 101) && !empty($j['data']['ref_id'])) { pay_paid($p, (string)$j['data']['ref_id'], (string)($j['data']['card_pan'] ?? '')); $back('ok', $p['ref']); }
    $m = zp_err($j, $raw, $h); $fail('verify_failed', $m); log_error('pay', 'zarinpal verify ' . $p['ref'] . ': ' . $m);
    $back('fail', $p['ref']);
}

/* Saman (SEP): verify within 30 minutes or SEP reverses it */
if (isset($in['ResNum']) || isset($in['RefNum'])) {
    $ref = preg_replace('/[^A-Z0-9]/', '', strtoupper((string)($in['ResNum'] ?? '')));
    $p = $ref ? row('SELECT * FROM payments WHERE ref=?', [$ref]) : null;
    if (!$p || $p['env'] !== 'sep') { $p = null; log_error('pay', 'sep callback without a known payment: ' . mb_substr(json_encode($in, JSON_UNESCAPED_UNICODE), 0, 300)); $back('fail', $ref ?: 'x'); }
    if ($p['status'] === 'paid') $back('ok', $ref);
    $refNum = mb_substr(trim((string)($in['RefNum'] ?? '')), 0, 100); $tok = (string)($in['Token'] ?? '');
    if (($tok !== '' && !hash_equals((string)$p['code'], $tok)) || (isset($in['TerminalId']) && preg_replace('/\D/', '', (string)$in['TerminalId']) !== sep_tid())) { log_error('pay', "sep token/terminal mismatch $ref"); $back('fail', $ref); }
    if ((string)($in['State'] ?? '') !== 'OK' || $refNum === '') { $fail('canceled', 'State ' . ($in['State'] ?? '') . ' Status ' . ($in['Status'] ?? '')); $back('fail', $ref); }
    if (row('SELECT id FROM payments WHERE refid=? AND id<>?', [$refNum, $p['id']])) { log_error('pay', "sep RefNum reused $ref"); $back('fail', $ref); }
    $vb = ['RefNum' => $refNum, 'TerminalNumber' => (int)sep_tid()];
    [$h, $j, $raw] = sep('verifyTxnRandomSessionkey/ipg/VerifyTransaction', $vb);
    $td = (array)($j['TransactionDetail'] ?? []); $amt = (int)($td['OrginalAmount'] ?? ($td['OriginalAmount'] ?? 0)); $ok = $h === 200 && !empty($j['Success']) && in_array((int)($j['ResultCode'] ?? -1), [0, 2], true);
    if ($ok && $amt === (int)$p['amount'] * 10) { pay_paid($p, $refNum, (string)($td['MaskedPan'] ?? '')); $back('ok', $ref); }
    $m = $ok ? "amount mismatch $amt" : sep_err($j, $raw, $h);
    if ($ok) sep('verifyTxnRandomSessionkey/ipg/ReverseTransaction', $vb);           // paid a different amount: give it back
    $fail('verify_failed', $m); log_error('pay', "sep verify $ref: $m");
    $back('fail', $ref);
}

/* PayPing */
$data = isset($in['data']) && is_string($in['data']) ? (json_decode($in['data'], true) ?: []) : [];
$d = $in + $data;
$ref = preg_replace('/[^A-Z0-9]/', '', strtoupper((string)($d['clientRefId'] ?? $d['clientrefid'] ?? '')));
$code = (string)($d['paymentCode'] ?? $d['paymentcode'] ?? '');
$refId = (string)($d['paymentRefId'] ?? $d['refid'] ?? '');
$p = $ref ? row("SELECT * FROM payments WHERE ref=? AND env IN ('test','live')", [$ref]) : null;
if (!$p) { log_error('pay', 'callback without a known payment: ' . mb_substr(json_encode($d, JSON_UNESCAPED_UNICODE), 0, 300)); $back('fail', $ref ?: 'x'); }
if ($p['status'] === 'paid') $back('ok', $ref);
if ($code === '' || !hash_equals((string)$p['code'], $code)) { log_error('pay', "code mismatch $ref"); $back('fail', $ref); }
if ((int)($d['status'] ?? 0) !== 1 || $refId === '') { $fail('canceled', 'errorCode ' . ($d['errorCode'] ?? '')); $back('fail', $ref); }
[$h, $j, $raw] = pp('POST', 'pay/verify', ['amount' => (int)$p['amount'], 'paymentCode' => $code, 'paymentRefId' => (int)$refId], (string)$p['env']);
if ($h === 200) { pay_paid($p, $refId, (string)($j['cardNumber'] ?? $d['cardNumber'] ?? '')); $back('ok', $ref); }
$m = pp_err($j, $raw, $h); $fail('verify_failed', $m); log_error('pay', "verify $ref: $m");
$back('fail', $ref);
