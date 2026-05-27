package com.resolveapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.app.admin.DevicePolicyManager
import android.content.ComponentName

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(context, MyDeviceAdminReceiver::class.java)

        if (action == "com.resolveapp.ACTION_LOCK_NOW") {
            if (dpm.isAdminActive(admin)) {
                dpm.lockNow()
            }
            // Optionally start the app's lock screen activity
            val launch = context.packageManager.getLaunchIntentForPackage("com.resolveapp")
            launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launch)
        }

        if (action == "com.resolveapp.ACTION_UNLOCK_NOW") {
            // No straight "unlock" API — you can dismiss UI or show unlock screen flow
            // For dev, we can just start the app to show unlocked UI
            val launch = context.packageManager.getLaunchIntentForPackage("com.resolveapp")
            launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launch)
        }
    }
}