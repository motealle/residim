#!/usr/bin/env bash
# Runs in CI after `npx cap add android`: permissions, icons, splash, version. Never touches signing secrets.
set -euo pipefail
cd "$(dirname "$0")"
VER="$(cat version.txt)"; CODE="${CODE:-1}"
M=android/app/src/main/AndroidManifest.xml
perms='POST_NOTIFICATIONS VIBRATE ACCESS_COARSE_LOCATION ACCESS_FINE_LOCATION FOREGROUND_SERVICE FOREGROUND_SERVICE_LOCATION WAKE_LOCK SCHEDULE_EXACT_ALARM RECEIVE_BOOT_COMPLETED READ_CONTACTS'
for p in $perms; do grep -q "android.permission.$p\"" "$M" || sed -i "s#</manifest>#    <uses-permission android:name=\"android.permission.$p\" />\n</manifest>#" "$M"; done
# a location foreground service needs the location feature declared as optional
grep -q 'android.hardware.location.gps' "$M" || sed -i 's#</manifest>#    <uses-feature android:name="android.hardware.location.gps" android:required="false" />\n</manifest>#' "$M"
cp res/drawable/ic_stat_residim.xml android/app/src/main/res/drawable/
# notification sounds for our own channels (door, urgent, …)
mkdir -p android/app/src/main/res/raw && cp res/raw/*.mp3 android/app/src/main/res/raw/
SRC=../landing/assets/icon-512.png
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do n=${d%%:*}; s=${d##*:}; f=android/app/src/main/res/mipmap-$n
  convert "$SRC" -resize ${s}x${s} "$f/ic_launcher.png"
  convert "$SRC" -resize ${s}x${s} \( -size ${s}x${s} xc:none -fill white -draw "circle $((s/2)),$((s/2)) $((s/2)),1" \) -compose DstIn -composite "$f/ic_launcher_round.png"
  fs=$((s*108/48)); inner=$((fs*62/100)); convert -size ${fs}x${fs} xc:none \( "$SRC" -resize ${inner}x${inner} \) -gravity center -composite "$f/ic_launcher_foreground.png"
done
printf '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#FFFFFF</color></resources>\n' > android/app/src/main/res/values/ic_launcher_background.xml
# splash: green with the app icon
find android/app/src/main/res -name 'splash.png' | while read -r f; do read -r w h < <(identify -format '%w %h\n' "$f"); m=$(( (w<h?w:h)*30/100 ))
  convert -size ${w}x${h} xc:'#16A34A' \( "$SRC" -resize ${m}x${m} \) -gravity center -composite "$f"; done
# home-screen widget «دارم می‌روم» (one big button with the likely next trip; no service, no network)
J=android/app/src/main/java/ir/residim/app
if [ -d "$J" ]; then
  cp res/widget/*.java "$J/"
  mkdir -p android/app/src/main/res/layout android/app/src/main/res/xml
  cp res/widget/residim_widget.xml android/app/src/main/res/layout/
  cp res/widget/residim_widget_bg.xml res/widget/residim_widget_btn.xml android/app/src/main/res/drawable/
  cp res/widget/residim_widget_info.xml android/app/src/main/res/xml/
  grep -q 'ResidimWidget' "$M" || sed -i 's#</application>#    <receiver android:name=".ResidimWidget" android:exported="false" android:label="دارم می‌روم"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/residim_widget_info" /></receiver>\n    <activity android:name=".WidgetTapActivity" android:exported="false" android:theme="@android:style/Theme.Translucent.NoTitleBar" android:excludeFromRecents="true" android:noHistory="true" />\n</application>#' "$M"
  grep -q 'ResidimWidget' "$J/MainActivity.java" || sed -i -E 's#public class MainActivity extends BridgeActivity \{\s*\}#public class MainActivity extends BridgeActivity { @Override public void onPause() { super.onPause(); try { ResidimWidget.refresh(this); } catch (Exception e) {} } }#' "$J/MainActivity.java"
  echo "widget: on"
fi
G=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode $CODE/; s/versionName \"[^\"]*\"/versionName \"$VER\"/" "$G"
sed -i "s#ResidimApp/[0-9.]*#ResidimApp/$VER#" capacitor.config.json
echo "android project ready: $VER ($CODE)"
# server push (Firebase) only when the owner provided google-services.json
if [ -f google-services.json ]; then cp google-services.json android/app/google-services.json; sed -i "s#ResidimApp/$VER\"#ResidimApp/$VER push\"#" capacitor.config.json; echo "push: on"; fi
