# معماری طراحی قابل تعویض

## سه لایه

1. توکن‌های معنایی (مقادیر مشترک طراحی): surface، text، primary، border، radius، spacing، type و motion.
2. اجزای محصول: Button، Field، Dialog، Navigation و WeekView با قرارداد رفتاری ثابت.
3. آداپتر (لایه اتصال به کتابخانه): DaisyUI، Material یا پیاده‌سازی سفارشی؛ با انتخاب designSystem بارگذاری شود.

یک کنترل می‌تواند تم (رنگ، فونت، انحنا و سایه) را فوراً تغییر دهد. تعویض واقعی کتابخانه اجزا علاوه بر توکن‌ها به آداپتر، حفظ focus، state و آزمون رفتاری نیاز دارد. تست‌های فعلی سه طرح مستقل‌اند و کنترل «ظاهر» آن‌ها فقط توکن‌ها را عوض می‌کند.

پیکربندی پیشنهادی:
```json
{"designSystem":"daisy","theme":"dream-dark","bodyFont":"Vazirmatn","headingFont":"Sahel","motion":"system"}
```

منطق سفر، ورود و حساب از کتابخانه UI جدا بماند. تغییر ظاهر داده محصول را تغییر ندهد. تنظیم معتبر از فهرست مجاز انتخاب و در حساب کاربر ذخیره شود؛ localStorage فقط ترجیح دستگاه است.

## مسیر آزمایش

| طرح | هدف | نوع اجرا |
|---|---|---|
| ۱، مدار آرام | فضای خلاق تیره و بصری، الهام مستقل از مرجع محبوب | CSS/SVG سفارشی |
| ۲، استودیوی همراه | اجزای DaisyUI در چیدمان کاربردی و نامتقارن | DaisyUI واقعی، نسخه ثابت CDN و fallback محلی |
| ۳، هفته روشن | سطوح روشن و تعامل متمرکز بر برنامه | الهام از Material؛ کتابخانه رسمی Material نیست |
| بعدی | Nuxt + آداپتر Material واقعی | بعد از انتخاب کاربر و بررسی build/hosting |
| بعدی | Radix/Reka، Carbon یا Fluent | مقایسه تناسب؛ برتری عمومی فرض نشود |
| بعدی | Three.js + GSAP | صحنه تعاملی با fallback و سقف هزینه دستگاه |

## کیفیت

- موبایل ۳۶۰px و دسکتاپ؛ متن فارسی و اعداد خوانا، بدون اسکرول افقی ناخواسته.
- هدف لمس حداقل ۴۸px؛ focus واضح؛ عملکرد با صفحه‌کلید؛ رعایت reduced-motion.
- متن معمولی با نسبت کنتراست حداقل ۴٫۵:۱؛ عناصر کلیدی با ۳:۱.
- shimmer فقط هنگام انتظار واقعی، نه تأخیر ساختگی؛ خطا و تلاش مجدد روشن باشند.
- Three.js اختیاری: lazy-load، توقف هنگام پنهان‌شدن صفحه، سقف pixelRatio و fallback ایستا.
- GSAP برای تغییر معنی‌دار؛ از scroll hijacking و وابستگی نمایش محتوا به موفقیت کتابخانه پرهیز شود.
- PWA: manifest، آیکن‌های ۱۹۲ و ۵۱۲، scope محدود، offline shell و پیام صریح آفلاین؛ عملیات حساس آنلاین و تأییدشده از سرور.

## منابع رسمی بررسی‌شده — ۲۰۲۶/۱۰/۰۶

- [Anthropic frontend-design](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md): مرجع عمومی جهت هنری؛ مهارت اختصاصی بازنویسی مستقل است.
- [Midjourney](https://www.midjourney.com/): مرجع ترجیح کاربر؛ کپی دارایی/برند نشود و در آینده نمای موردنظر از خود کاربر دریافت شود.
- [DaisyUI](https://daisyui.com/docs/themes/) و [CDN](https://daisyui.com/docs/cdn/)
- [Material](https://m3.material.io/foundations/)
- [Radix](https://www.radix-ui.com/themes/docs/overview/getting-started)؛ برای Vue/Nuxt ابتدا سازگاری بررسی شود.
- [Carbon](https://carbondesignsystem.com/)
- [GSAP](https://gsap.com/docs/v3/GSAP/)، [Three.js](https://threejs.org/docs/)، [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

این مقایسه فهرست مسیرهای آزمایش است، نه رتبه‌بندی اثبات‌شده بهترین سیستم جهان.

## نسخه‌های رسمی /t/

جدول طرح‌های بالاتر مربوط به پیش‌نویس‌های تاریخی test/ است. نسخه رسمی ۰۱ «قرار مشترک» با DaisyUI و GSAP منتشر و ثابت شده است. نسخه رسمی ۰۲ «هفته رنگی» مستقیماً به هفته باز می‌شود و @material/web 2.5.0 واقعی، پالت Teal/Indigo/Amber، منطق مستقل و پوسته PWA محلی دارد. تیره/روشن فقط تغییر توکن است. Material Web در maintenance است؛ تثبیت نسخه آزمایش به معنی انتخاب نهایی چارچوب تولید نیست.
