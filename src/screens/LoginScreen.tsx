import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>반가워요!{'\n'}로그인 해주세요</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일 주소"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.mainButton} onPress={() => navigation.replace('MainTabs')}>
            <Text style={styles.mainButtonText}>로그인</Text>
          </Pressable>
          <Pressable style={styles.subButton} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.subButtonText}>아직 계정이 없으신가요? 회원가입</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24 },
  header: { marginTop: 60, marginBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A2E', lineHeight: 34 },
  form: { flex: 1 },
  input: { backgroundColor: '#F2F4F6', padding: 18, borderRadius: 16, marginBottom: 12, fontSize: 16 },
  footer: { marginBottom: 20 },
  mainButton: { backgroundColor: '#3182F6', padding: 18, borderRadius: 16, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  subButton: { marginTop: 20, alignItems: 'center' },
  subButtonText: { color: '#6B7280', fontSize: 14 },
});