package com.resolveapp;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.content.Context;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AlarmModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext reactContext;
    public AlarmModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "AlarmModule";
    }

    @ReactMethod
    public void isAlarmEnabled(Promise promise) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                AlarmManager am = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
                if (am != null && am.canScheduleExactAlarms()) {
                    promise.resolve(true);
                } else {
                    promise.resolve(false);
                }
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check alarm permission: " + e.getMessage());
        }
    }
    @ReactMethod
    public void openAlarmsAndRemindersSettings() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        } else {
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        }
    }

    @ReactMethod
    public void scheduleLock(double epochMillis) {
        long millis = (long) epochMillis;

        // Prompt user to allow exact alarms on Android 12+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            android.content.Intent intent = new android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        }

        AlarmManager am = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Intent i = new Intent(reactContext, AlarmReceiver.class);
        i.setAction("com.resolveapp.ACTION_LOCK_NOW");
        PendingIntent pi = PendingIntent.getBroadcast(
                reactContext,
                1001,
                i,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        if (am != null) {
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, millis, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, millis, pi);
            }
        }
    }

    @ReactMethod
    public void cancelScheduledLock() {
        AlarmManager am = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Intent i = new Intent(reactContext, AlarmReceiver.class);
        i.setAction("com.resolveapp.ACTION_LOCK_NOW");
        PendingIntent pi = PendingIntent.getBroadcast(reactContext, 1001, i, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT>=23?PendingIntent.FLAG_IMMUTABLE:0));
        if (am != null) am.cancel(pi);
    }
}

