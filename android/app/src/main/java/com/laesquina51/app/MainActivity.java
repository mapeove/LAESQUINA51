package com.laesquina51.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);

            // Channel for Admin
            NotificationChannel adminChannel = new NotificationChannel(
                    "admin_orders",
                    "Nuevos Pedidos",
                    NotificationManager.IMPORTANCE_HIGH
            );
            Uri adminSound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/administrador");
            AudioAttributes adminAudioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            adminChannel.setSound(adminSound, adminAudioAttributes);
            
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(adminChannel);
            }

            // Channel for Customer
            NotificationChannel customerChannel = new NotificationChannel(
                    "customer_order_updates",
                    "Actualizaciones de Pedidos",
                    NotificationManager.IMPORTANCE_HIGH
            );
            Uri customerSound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/cliente");
            AudioAttributes customerAudioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            customerChannel.setSound(customerSound, customerAudioAttributes);
            
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(customerChannel);
            }
        }
    }
}
