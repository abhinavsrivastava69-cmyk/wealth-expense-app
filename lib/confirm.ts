import { Alert, Platform } from 'react-native';

// React Native Web's Alert.alert renders only a single OK button and does NOT
// fire the destructive button's onPress — so confirm-then-delete flows silently
// do nothing on the web/PWA build. Use window.confirm there instead.
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
