# رسیدیم (Residim)

**رسیدیم؛ نوبت‌ها روشن، خیال‌ها جمع.**

رسیدیم یک PWA برای مدیریت «هم‌سرویس» خانوادگی است: برنامه رفت‌وبرگشت، جایگزینی نوبت، ثبت انجام، موقعیت رویدادمحور و حساب شفاف مشارکت.

## ساختار

- `landing/` — لندینگ محصولی؛ هنگام Deploy محتوای آن در روت FTP قرار می‌گیرد.
- `app/` — اپ PWA که در `/app/` منتشر می‌شود.
- `app/api/` — API سبک PHP برای OTP، گروه، سفر، جایگزینی، Location Event و Ledger.
- `BACKLOG.md` — نقشه تولید محصول و Release Gateها.
- `.github/workflows/deploy-production.yml` — استقرار لندینگ + اپ روی FTP.
- `smoke/` و `ftp-smoke.yml` — تست دود اولیه تاریخی؛ برای عیب‌یابی اتصال نگه داشته شده است.

## UI / UX

- RTL فارسی؛ Vazirmatn برای متن و Sahel برای تیترهای شاخص.
- DaisyUI برای Componentها.
- GSAP برای Motion لندینگ و Animated SVG.
- تم دارک نزدیک به ابزارهای خلاق حرفه‌ای؛ بدون شلوغی داشبورد.
- صفحه اول اپ = جدول هفته؛ سه مقصد اصلی پایین صفحه: `هفته | حساب | گروه`.
- Demo هیچ نام واقعی ندارد و فقط از «خانواده شما / همیار ۱…» استفاده می‌کند.

## احراز هویت پیامکی

Frontend از WebOTP به‌صورت Progressive Enhancement استفاده می‌کند؛ یعنی روی مرورگر/گوشی پشتیبانی‌شده، بعد از ارسال SMS مرورگر می‌تواند با رضایت کاربر همان OTP را استخراج کند. ورود دستی کد همیشه موجود است.

Backend دو Driver دارد:

1. `kavenegar` — Kavenegar VerifyLookup
2. `webhook` — Endpoint اختصاصی شما برای هر سرویس پیامکی ایرانی دیگر

Secretها **نباید** Commit شوند. نمونه تنظیمات: `app/api/config.example.php`.

فایل واقعی باید با نام `app/api/config.local.php` روی هاست ایجاد شود و در `.gitignore` قرار دارد.

## دیتابیس

پیش‌فرض MVP: SQLite در `app/storage/residim.sqlite` با دسترسی وب مسدودشده. MySQL نیز از طریق DSN در `config.local.php` یا Environment پشتیبانی می‌شود.

Schema خودکار در اولین درخواست API ساخته می‌شود.

مدل فعلی شامل Users، Groups، Memberships، Trips، Swap Requests، Trip Events، Ledger Entries و OTP Codes است. `start_date` عضویت باعث می‌شود عضو جدید بابت سفرهای قبل از شروع خودش بدهکار/طلبکار نشود.

## مدل مالی

در تکمیل هر سفر:

- ارزش کامل سفر به انجام‌دهنده واقعی **Credit** می‌شود.
- همان ارزش بین اعضای فعال آن دوره به‌عنوان **Usage Share** تقسیم می‌شود.
- مجموع Ledger برای هر سفر صفر می‌ماند.
- کلید یکتا جلوی ثبت دوباره اعتبار با Double-click یا Retry را می‌گیرد.

نسخه بعدی باید Passenger-level usage را اضافه کند تا سهم استفاده بر اساس مسافران واقعی همان سفر محاسبه شود.

## PWA / Location

- Installable Manifest + Service Worker
- Offline shell و آخرین UI قابل نمایش
- عملیات حساس مانند پذیرش جایگزین باید آنلاین و Server-confirmed باشند.
- Geolocation فقط با رضایت و در رویدادهایی مثل Start/Arrive ثبت می‌شود؛ ردیابی دائمی کودک جزو MVP نیست.

## Deployment

GitHub Secrets موجود برای FTP:

- `FTP_SERVER_RESIDIM`
- `FTP_USERNAME_RESIDIM`
- `FTP_PASSWORD_RESIDIM_IR`

Workflow تولیدی فایل‌ها را بدون پاک‌کردن کور محتوای هاست Upload می‌کند:

- `landing/index.html` → `/index.html`
- assets لندینگ → `/assets/`
- `app/**` → `/app/**`

اتصال FTPS میزبان فعلاً گواهی Self-signed دارد؛ Workflow برای ادامه توسعه `--insecure` دارد. **قبل از انتشار عمومی باید گواهی معتبر نصب و این استثنا حذف شود.**
