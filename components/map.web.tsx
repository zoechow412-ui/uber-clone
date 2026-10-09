import { Text, View } from 'react-native';

// react-native-maps is native-only; the mobile implementation in map.tsx is unchanged.
export const Map = () => (
  <View style={{ flex: 1, minHeight: 260, borderRadius: 20, backgroundColor: '#edf4ef', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text style={{ fontSize: 28 }}>⌖</Text>
    <Text style={{ color: '#24483b', fontSize: 16, fontWeight: '700', marginTop: 8 }}>地圖只喺手機 Expo 版提供</Text>
    <Text style={{ color: '#687970', marginTop: 5, textAlign: 'center' }}>Web 預覽用於測試安心代駕表單及本機訂單流程。</Text>
  </View>
);
