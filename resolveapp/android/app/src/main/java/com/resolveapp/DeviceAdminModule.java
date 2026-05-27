package com.resolveapp;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import android.content.SharedPreferences;

public class DeviceAdminModule extends ReactContextBaseJavaModule {
    private static final String TAG = "DeviceAdminModule";
    private ReactApplicationContext reactContext;

    public DeviceAdminModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "DeviceAdmin";
    }

    @ReactMethod
    public void isAdminActive(Promise promise) {
        try {
            DevicePolicyManager dpm = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
            if (dpm == null) {
                promise.reject("ERROR", "DevicePolicyManager is unavailable");
                return;
            }
            ComponentName admin = new ComponentName(reactContext, MyDeviceAdminReceiver.class);
            promise.resolve(dpm.isAdminActive(admin));
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check admin status: " + e.getMessage());
        }
    }
    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            String enabledServices = Settings.Secure.getString(
                    context.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );

            String myService1 = context.getPackageName() + "/.LockdownAccessibilityService";
            String myService2 = context.getPackageName() + "/" + LockdownAccessibilityService.class.getName();

            boolean isEnabled = false;
            if (!TextUtils.isEmpty(enabledServices)) {
                String[] services = enabledServices.split(":");
                for (String service : services) {
                    if (service.equalsIgnoreCase(myService1) || service.equalsIgnoreCase(myService2)) {
                        isEnabled = true;
                        break;
                    }
                }
            }

            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check accessibility service: " + e.getMessage());
        }
    }
    @ReactMethod
    public void requestAdmin(Promise promise) {
        try {
            Context context = getCurrentActivity() != null
                    ? getCurrentActivity()
                    : getReactApplicationContext();

            if (context == null) {
                promise.reject("ERROR", "Context is null");
                return;
            }

            DevicePolicyManager dpm =
                    (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);

            if (dpm == null) {
                promise.reject("ERROR", "DevicePolicyManager is unavailable");
                return;
            }

            ComponentName compName = new ComponentName(context, MyDeviceAdminReceiver.class);

            if (!dpm.isAdminActive(compName)) {
                Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
                intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, compName);
                intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                        "This app needs device admin permission to lock your screen.");

                if (getCurrentActivity() != null) {
                    // Use activity context, do NOT add FLAG_ACTIVITY_NEW_TASK
                    getCurrentActivity().startActivity(intent);
                } else {
                    // Use application context, must add FLAG_ACTIVITY_NEW_TASK
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                }

                promise.resolve(true);
            } else {
                promise.resolve(true); // already active
            }
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to open device admin screen: " + e.getMessage());
        }
    }

    @ReactMethod
    public void lockNow(Promise promise) {
        try {
            DevicePolicyManager dpm = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
            if (dpm == null) {
                promise.reject("ERROR", "DevicePolicyManager is unavailable");
                return;
            }
            ComponentName admin = new ComponentName(reactContext, MyDeviceAdminReceiver.class);
            if (dpm.isAdminActive(admin)) {
                dpm.lockNow();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin is not active");
            }
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to lock device: " + e.getMessage());
        }
    }

    public static void lockNowDirect(Context context) {
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName admin = new ComponentName(context, MyDeviceAdminReceiver.class);
        if (dpm != null && dpm.isAdminActive(admin)) {
            dpm.lockNow();
        }
    }

    @ReactMethod
    public void openAccessibilitySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            if (getCurrentActivity() != null) {
                getCurrentActivity().startActivity(intent);
            } else {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to open accessibility settings: " + e.getMessage());
        }
    }


    @ReactMethod
    public void startLockdown(int minutes, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            DevicePolicyManager dpm =
                    (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName compName = new ComponentName(context, MyDeviceAdminReceiver.class);

            if (!dpm.isAdminActive(compName)) {
                promise.reject("ERROR", "Device Admin not active");
                return;
            }

            long duration = minutes * 60 * 1000L;
            long endTime = System.currentTimeMillis() + duration;

            context.getSharedPreferences("LockPrefs", Context.MODE_PRIVATE)
                    .edit().putLong("lockEnd", endTime).apply();

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void checkAndLock() {
        Context context = getReactApplicationContext();
        SharedPreferences prefs = context.getSharedPreferences("LockPrefs", Context.MODE_PRIVATE);
        long endTime = prefs.getLong("lockEnd", 0);

        if (System.currentTimeMillis() < endTime) {
            DevicePolicyManager dpm =
                    (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName compName = new ComponentName(context, MyDeviceAdminReceiver.class);

            if (dpm.isAdminActive(compName)) {
                dpm.lockNow();
            }
        }
    }
}