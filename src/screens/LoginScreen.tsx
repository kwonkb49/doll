import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BASE_URL = 'https://doll-1v83.onrender.com';

export default function LoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 이전 화면(RoleSelect)에서 선택한 역할(parent / teacher)을 가져오되, 기본값은 parent로 지정
  const selectedRole = route?.params?.role || 'parent';

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: email.trim(),
        password: password.trim(),
      });

      console.log('로그인 성공 응답:', res.data);

      const token = res.data.accessToken || res.data.token;
      // 서버에서 돌려준 role이 있으면 사용하고, 없으면 선택했던 role 적용
      const userRole = res.data.role || selectedRole;

      if (token) {
        // 🔑 AsyncStorage에 토큰 키 2가지 모두 확실하게 저장
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('token', token);

        Alert.alert('로그인 성공', '환영합니다!', [
          {
            text: '확인',
            onPress: () => {
              // 🚀 App.tsx에 정의된 스크린 이름 'MainTabs'로 이동
              navigation.replace('MainTabs', { role: userRole });
            },
          },
        ]);
      } else {
        Alert.alert('로그인 오류', '서버에서 인증 토큰을 받지 못했습니다.');
      }
    } catch (err: any) {
      console.error('로그인 실패:', err?.response?.data || err.message);
      Alert.alert(
        '로그인 실패',
        err?.response?.data?.message || '이메일 또는 비밀번호를 확인해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>마음이음 로그인</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginBtnText}>로그인</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 32, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#F8F9FA', color: '#111' },
  loginBtn: { backgroundColor: '#4A90E2', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});