package ir.residim.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

/** Invisible hop: remember which trip the widget asked for, then open the app; the web app reads "widget_tap" and opens «دارم می‌روم». */
public class WidgetTapActivity extends Activity {
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        String dir = getIntent().getStringExtra("dir"); if (dir == null) dir = "work";
        getSharedPreferences(ResidimWidget.PREFS, Context.MODE_PRIVATE).edit().putString("widget_tap", dir + "|" + System.currentTimeMillis()).apply();
        Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (i != null) { i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT); startActivity(i); }
        finish();
    }
}
