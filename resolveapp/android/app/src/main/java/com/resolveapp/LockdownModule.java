// LockdownModule.java
package com.resolveapp;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LockdownModule extends ReactContextBaseJavaModule {

    public LockdownModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "LockdownModule";
    }

    @ReactMethod
    public void setLockdownActive(boolean active) {
        LockdownAccessibilityService.isActive = active;
    }
}
