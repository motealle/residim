package ir.residim.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.util.Calendar;

/**
 * «دارم می‌روم» home-screen widget. Shows the most likely next trip (to work or home) as one big button.
 * Reads what the web app last saved (CapacitorStorage → "widget": place name and its in/out hours);
 * no network, no background service, refreshed by the system every 30 minutes and whenever the app saves.
 */
public class ResidimWidget extends AppWidgetProvider {
    static final String PREFS = "CapacitorStorage";

    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { for (int id : ids) paint(c, m, id); }

    static int mins(String hhmm, int def) { try { String[] p = hhmm.split(":"); return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]); } catch (Exception e) { return def; } }

    static void paint(Context c, AppWidgetManager m, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.residim_widget);
        String place = "", sub; String dir = "work";
        try {
            SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = sp.getString("widget", null);
            if (raw != null) {
                JSONObject j = new JSONObject(raw); place = j.optString("place", "");
                Calendar now = Calendar.getInstance(); int t = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
                int out = mins(j.optString("out", ""), 14 * 60);
                dir = (t >= out - 60 || t < 4 * 60) ? "home" : "work";
                if (t < 4 * 60) dir = "work";
            }
        } catch (Exception ignored) {}
        if (place.isEmpty()) { v.setTextViewText(R.id.w_cta, "مسیرم را بسازم"); sub = "رسیدیم: هم‌مسیرِ همکار و همسایه"; dir = "setup"; }
        else { v.setTextViewText(R.id.w_cta, "work".equals(dir) ? "دارم می‌روم: به " + place : "دارم می‌روم: به خانه"); sub = "یک تپ؛ هم‌مسیرهای نزدیک خبر می‌شوند"; }
        v.setTextViewText(R.id.w_sub, sub);
        Intent i = new Intent(c, WidgetTapActivity.class); i.putExtra("dir", dir); i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(c, dir.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, pi);
        m.updateAppWidget(id, v);
    }

    /** called by the app (through a broadcast) right after it saves fresh widget data */
    public static void refresh(Context c) { AppWidgetManager m = AppWidgetManager.getInstance(c); for (int id : m.getAppWidgetIds(new ComponentName(c, ResidimWidget.class))) paint(c, m, id); }
}
