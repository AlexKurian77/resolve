package com.resolveapp

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DeviceLockdownStateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val prefs: SharedPreferences = reactContext.getSharedPreferences("resolve_prefs", Context.MODE_PRIVATE)

    override fun getName(): String {
        return "DeviceLockdownStateModule"
    }

    @ReactMethod
    fun setLockdownActive(active: Boolean) {
        prefs.edit().putBoolean("lockdown_active", active).apply()
    }
}
