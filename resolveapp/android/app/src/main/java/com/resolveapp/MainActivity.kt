package com.resolveapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.resolveapp.DeviceAdminModule // Import your DeviceAdminModule

class MainActivity : ReactActivity() {

    private var unlockReceiver: BroadcastReceiver? = null

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "resolveapp"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Register UnlockReceiver dynamically for maximum reliability
        try {
            val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
            val appContext = applicationContext
            unlockReceiver = UnlockReceiver()
            appContext.registerReceiver(unlockReceiver, filter)
            Log.d("Lockdown", "UnlockReceiver registered dynamically")
        } catch (e: Exception) {
            Log.e("Lockdown", "Failed to register UnlockReceiver: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (unlockReceiver != null) {
            try {
                applicationContext.unregisterReceiver(unlockReceiver)
                Log.d("Lockdown", "UnlockReceiver unregistered")
            } catch (e: Exception) {
                Log.e("Lockdown", "Failed to unregister UnlockReceiver: ${e.message}")
            }
            unlockReceiver = null
        }
    }


    // Use SharedPreferences to check lockdown state set by DeviceLockdownStateModule
    private fun isLockdownActive(context: Context?): Boolean {
        if (context == null) return false
        val prefs = context.getSharedPreferences("resolve_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("lockdown_active", false)
    }
}
