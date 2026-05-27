package com.resolveapp;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class LockdownAccessibilityService extends AccessibilityService {

    public static boolean isActive = false;

    private final Set<String> allowed = new HashSet<>(Arrays.asList(
        "com.resolveapp",
        "com.android.dialer",
        "com.google.android.dialer"
    ));

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isActive) return;

        if (event != null && event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String pkg = event.getPackageName() != null ? event.getPackageName().toString() : null;
            if (pkg == null) return;

            // Ignore lockscreen/system UI
            if (pkg.equals("com.android.systemui")) return;

            // Only force if they left your app
            if (!allowed.contains(pkg)) {
                Intent launchIntent = getPackageManager().getLaunchIntentForPackage("com.resolveapp");
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(launchIntent);
                }
            }
        }
    }

    @Override
    public void onInterrupt() {
        // No-op
    }
}
