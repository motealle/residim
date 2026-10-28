<?php
// Copy to config.local.php on the server. Never commit real secrets.
return [
    'app_env' => 'production',
    // Default is SQLite under /app/storage. For MySQL uncomment and fill:
    // 'db_dsn' => 'mysql:host=localhost;dbname=YOUR_DB;charset=utf8mb4',
    // 'db_user' => 'YOUR_DB_USER',
    // 'db_pass' => 'YOUR_DB_PASSWORD',

    // Iranian SMS adapter: Kavenegar VerifyLookup
    'sms_driver' => 'kavenegar',
    'kavenegar_api_key' => 'PUT_KEY_HERE',
    'kavenegar_template' => 'residim-login',

    // Residim v6 (app/api/r6.php) ───────────────────────────────
    // Storage switch: 'sqlite' (default, app/storage/r6.sqlite) or 'mysql'
    'r6_db' => 'sqlite',
    // 'r6_mysql_dsn'  => 'mysql:host=localhost;dbname=moteal_residim;charset=utf8mb4',
    // 'r6_mysql_user' => 'moteal_residim',
    // 'r6_mysql_pass' => '...',

    // Neshan: service key = server only (road distances + neighbourhood names);
    //         web key = browser map (restrict it to residim.ir in the Neshan panel).
    'neshan_service_key' => '',   // service.xxxxxxxx
    'neshan_web_key'     => '',   // web.xxxxxxxx

    // Kavenegar lookup templates (create & get them approved in the Kavenegar panel)
    // 'kavenegar_sender' => '2000660110', // optional line number for direct (no-template) SMS; empty = Kavenegar default line
    'kavenegar_tpl_invite'  => 'residim-invite',
    'kavenegar_tpl_arrived' => 'residim-arrived',

    // Since v13 every key below can be entered in the admin panel (tab «اتصال‌ها»); values saved there
    // live in app/storage/secrets.local.php (web-denied, not in git) and override this file.
    // 'kavenegar_tpl_call'  => 'residim-call',      // voice OTP template (type «پیام صوتی»)
    // 'smsir_api_key'       => '',                  // sms.ir: برنامه‌نویسان ← لیست کلیدها
    // 'smsir_line'          => '',                  // sms.ir line number (direct sending only)
    // 'smsir_tpl_login'     => '',                  // sms.ir numeric template id (#CODE#)
    // 'smsir_tpl_invite'    => '',                  // #CODE# #FAMILY# #PLACE#
    // 'smsir_tpl_arrived'   => '',                  // #KID# #TIME# #PLACE# #DRIVER#
    // 'payping_token_test'  => '',                  // PayPing test token
    // 'payping_token_live'  => '',                  // PayPing live token

    // Admin panel at residim.ir/#admin — CHANGE THE PASSWORD
    'admin_user' => 'mot',
    'admin_pass' => 'mot',

    // Or use a generic HTTPS webhook you control:
    // 'sms_driver' => 'webhook',
    // 'sms_webhook_url' => 'https://example.com/send-otp',
    // 'sms_webhook_token' => 'OPTIONAL_BEARER_TOKEN',
];
