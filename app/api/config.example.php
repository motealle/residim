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

    // Or use a generic HTTPS webhook you control:
    // 'sms_driver' => 'webhook',
    // 'sms_webhook_url' => 'https://example.com/send-otp',
    // 'sms_webhook_token' => 'OPTIONAL_BEARER_TOKEN',
];
