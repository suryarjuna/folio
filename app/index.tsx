import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        const nickname = await AsyncStorage.getItem('userNickname');
        if (nickname) {
          router.replace('/(tabs)/wallet');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    })();
  }, []);

  return null;
}
