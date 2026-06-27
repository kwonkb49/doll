import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS } from './theme';

export default function LoginScreen({ route, navigation }: any) {
  const selectRole = route.params?.role || 'parent';
  const accent = selectRole === 'parent' ? COLORS.primary : COLORS.secondary;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        'https://doll-1v83.onrender.com/auth/login',
        { email: email.trim(), password: password.trim() },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      if (response.status === 200 || response.status === 201) {
        Alert.alert('성공', '로그인되었습니다!', [
          { text: '확인', onPress: () => navigation.replace('MainTabs', { role: selectRole }) },
        ]);
      }
    } catch (error: any) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] })}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.inner}>
        <View style={[styles.roleBadge, { backgroundColor: selectRole === 'parent' ? COLORS.primaryLight : COLORS.secondaryLight }]}>
          <Text style={[styles.roleBadgeText, { color: accent }]}>
            {selectRole === 'parent' ? '보호자' : '보호사 · 선생님'}
          </Text>
        </View>

        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>계속하려면 로그인해 주세요.</Text>

        <View style={styles.fieldGroup}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 입력"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.signupLink}>
          <Text style={styles.signupLinkText}>
            계정이 없으신가요? <Text style={[styles.signupLinkAccent, { color: accent }]}>회원가입</Text>
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {loading ? (
          <ActivityIndicator size="large" color={accent} style={styles.loader} />
        ) : (
          <Pressable style={[styles.mainBtn, { backgroundColor: accent }]} onPress={handleLogin}>
            <Text style={styles.mainBtnText}>로그인</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: { height: 56, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 28, marginBottom: 16 },
  roleBadgeText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },
  fieldGroup: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, paddingLeft: 2 },
  input: { backgroundColor: COLORS.background, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 12, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  signupLink: { marginTop: 20, alignItems: 'center' },
  signupLinkText: { fontSize: 14, color: COLORS.textMuted },
  signupLinkAccent: { fontWeight: '600' },
  loader: { marginBottom: 24 },
  mainBtn: { padding: 17, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  mainBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
});