package com.resolveapp;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class LockdownPackage implements ReactPackage {
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        ArrayList<NativeModule> modules = new ArrayList<>();
        modules.add(new DeviceAdminModule(reactContext));
        modules.add(new AlarmModule(reactContext));
        modules.add(new LockdownModule(reactContext));
        return modules;
    }
}

