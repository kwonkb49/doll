import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, getTheme } from './theme';

export default function SignupScreen({ navigation }: any) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);

  const [role, setRole] = useState<'PARENT' | 'TEACHER'>('PARENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const accent = role === 'PARENT' ? COLORS.primary : COLORS.secondary;
  const accentLight = role === 'PARENT' ? COLORS.primaryLight : COLORS.secondaryLight;

  const handleSignup = async () => {
    if (!name || !email || !password || !phoneNumber) {
      Alert.alert('알림', '모든 정보를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        'https://doll-1v83.onrender.com/auth/signup',
        { email: email.trim(), password: password.trim(), name: name.trim(), phoneNumber: phoneNumber.trim(), role },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      if (response.status === 200 || response.status === 201) {
        Alert.alert('성공', '회원가입이 완료되었습니다!', [
          { text: '로그인하기', onPress: () => navigation.navigate('Login', { role: role.toLowerCase() }) },
        ]);
      }
    } catch (error: any) {
      Alert.alert('가입 실패', error.response?.data?.message || '입력 데이터를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.text }]}>회원가입</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>역할에 맞는 맞춤형 대시보드가 제공됩니다.</Text>

        <View style={styles.roleTabWrap}>
          {(['PARENT', 'TEACHER'] as const).map((r) => {
            const isActive = role === r;
            const currentAccent = r === 'PARENT' ? COLORS.primary : COLORS.secondary;
            const currentLight = r === 'PARENT' ? COLORS.primaryLight : COLORS.secondaryLight;
            return (
              <Pressable
                key={r}
                style={[styles.roleTab, { backgroundColor: theme.card, borderColor: theme.border }, isActive && { backgroundColor: currentLight, borderColor: currentAccent }]}
                onPress={() => setRole(r)}
              >
                <Text style={[{ color: COLORS.textMuted, fontSize: 14 }, isActive && { color: currentAccent, fontWeight: '700' }]}>
                  {r === 'PARENT' ? '보호자 계정' : '선생님 계정'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fieldGroup}>
          <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="이름" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
          <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="이메일" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="전화번호" placeholderTextColor={COLORS.textMuted} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="비밀번호" placeholderTextColor={COLORS.textMuted} secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <View style={{ flex: 1 }} />

        {loading ? (
          <ActivityIndicator size="large" color={accent} style={{ marginBottom: 24 }} />
        ) : (
          <Pressable style={[styles.mainBtn, { backgroundColor: accent }]} onPress={handleSignup}>
            <Text style={styles.mainBtnText}>가입하기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 56, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginTop: 20, marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  roleTabWrap: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleTab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  fieldGroup: { gap: 12 },
  input: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 15, borderWidth: 1 },
  mainBtn: { padding: 17, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  mainBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});