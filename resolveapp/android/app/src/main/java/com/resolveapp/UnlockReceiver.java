package com.resolveapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class UnlockReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("UnlockReceiver", "onReceive called: action=" + intent.getAction());
        // No action needed on unlock anymore
    }
}