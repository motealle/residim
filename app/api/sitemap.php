<?php
/** /sitemap.xml — static pages, ad kinds, routes that have live ads, and every live public ad (freshest first). */
declare(strict_types=1);
require_once __DIR__ . '/r6x.php';
x_schema();
header('Content-Type: application/xml; charset=utf-8'); header('Cache-Control: public, max-age=900');
$S = 'https://residim.ir'; $now = time(); $u = [];
$add = function (string $loc, int $t, string $freq, string $pri) use (&$u) { $u[] = '<url><loc>' . htmlspecialchars($loc, ENT_XML1) . '</loc><lastmod>' . gmdate('Y-m-d\TH:i:s\Z', $t) . "</lastmod><changefreq>$freq</changefreq><priority>$pri</priority></url>"; };
$last = (int)q("SELECT COALESCE(MAX(bumped),0) FROM ads WHERE status='live' AND audience='public'")->fetchColumn() ?: $now;
$root = dirname(__DIR__, 2) . '/landing'; $mt = fn($f) => is_file("$root/$f") ? (int)filemtime("$root/$f") : $now;
$add("$S/", $mt('index.html'), 'weekly', '1.0'); $ads = flag('ads_on'); if ($ads) $add("$S/ads/", $last, 'hourly', '0.9'); $add("$S/stories/", $mt('stories/index.html'), 'weekly', '0.8');
$add("$S/schools/", $mt('schools/index.html'), 'monthly', '0.8'); $add("$S/pricing/", $mt('pricing/index.html'), 'monthly', '0.6');
if ($ads) foreach (array_keys(AD_KINDS) as $k) { $t = (int)q("SELECT COALESCE(MAX(bumped),0) FROM ads WHERE status='live' AND audience='public' AND kind=? AND expires>?", [$k, $now])->fetchColumn(); if ($t) $add("$S/ads/?k=$k", $t, 'daily', '0.7'); }
if ($ads) foreach (rows("SELECT from_city, to_city, MAX(bumped) t FROM ads WHERE status='live' AND audience='public' AND expires>? GROUP BY from_city, to_city LIMIT 500", [$now]) as $r) $add("$S/ads/?" . http_build_query(['from' => $r['from_city'], 'to' => $r['to_city']]), (int)$r['t'], 'daily', '0.7');
if ($ads) foreach (rows("SELECT no, bumped FROM ads WHERE status='live' AND audience='public' AND expires>? ORDER BY bumped DESC LIMIT 5000", [$now]) as $r) $add("$S/ads/" . $r['no'], (int)$r['bumped'], 'daily', '0.6');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . implode('', $u) . '</urlset>';
