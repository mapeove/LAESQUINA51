'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { createClient } from '@/lib/supabase/client';

export function PushNotificationManager() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let currentToken: string | null = null;
    const supabase = createClient();

    const registerPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('User denied push notification permissions');
          return;
        }

        await PushNotifications.register();
      } catch (error) {
        console.error('Error during push notification registration:', error);
      }
    };

    const setupListeners = async () => {
      await PushNotifications.addListener('registration', async (token: Token) => {
        currentToken = token.value;
        await upsertToken(token.value);
      });

      await PushNotifications.addListener('registrationError', (error: unknown) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        const data = notification.notification.data;
        if (data && data.targetPath) {
          router.push(data.targetPath);
        }
      });
    };

    const upsertToken = async (tokenStr: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          await supabase.from('push_tokens').upsert({
            user_id: session.user.id,
            token: tokenStr,
            platform: Capacitor.getPlatform(),
            active: true,
            last_seen_at: new Date().toISOString()
          }, { onConflict: 'user_id, token' });
        } catch (e) {
          console.error('Error upserting push token', e);
        }
      }
    };

    registerPush();
    setupListeners();

    // Listen to auth state changes to upsert token on login, or deactivate on logout
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' && currentToken) {
        await upsertToken(currentToken);
      } else if (event === 'SIGNED_OUT' && currentToken) {
        try {
          await supabase.rpc('deactivate_push_token', { token_val: currentToken });
          currentToken = null;
        } catch (e) {
          console.error('Error deactivating token', e);
        }
      }
    });

    return () => {
      PushNotifications.removeAllListeners();
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
