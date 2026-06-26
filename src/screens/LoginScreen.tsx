import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen({ route, navigation }: any) {
  const selectRole = route.params?.role || 'parent';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://doll-1v83.onrender.com/auth/login', {
        email: email.trim(),
        password: password.trim(),
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 201) {
        console.log("로그인 성공 데이터:", response.data);
        Alert.alert("성공", "로그인되었습니다!", [
          { 
            text: "확인", 
            onPress: () => {
              navigation.replace('MainTabs', { role: selectRole }); 
            } 
          }
        ]);
      }
    } catch (error: any) {
      console.log("로그인 실패 에러:", error);
      if (error.response) {
        Alert.alert(
          "로그인 실패", 
          error.response.data?.message || "이메일 또는 비밀번호가 일치하지 않습니다."
        );
      } else {
        Alert.alert("네트워크 에러", "서버 연결에 실패했습니다. Render 서버가 켜져있는지 확인해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 💡 상단 뒤로가기 헤더 바 영역 */}
      <View style={styles.topBackHeader}>
        {/* 🔄 [핵심 수정] 회원가입 기록이고 뭐고 다 지우고 무조건 앱 대문(RoleSelect)으로 튕겨냅니다! */}
        <Pressable 
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelect' }],
            });
          }} 
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color="#191F28" />
        </Pressable>
      </View>

      <View style={styles.inner}>
        <Text style={styles.title}>안녕하세요!{'\n'}로그인 해주세요</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="이메일" 
          value={email} 
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput 
          style={styles.input} 
          placeholder="비밀번호" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.signupLink}>
          <Text style={styles.signupLinkText}>아직 계정이 없으신가요? 회원가입</Text>
        </Pressable>

        <View style={{ flex: 1 }} />
        
        {loading ? (
          <ActivityIndicator size="large" color="#3182F6" style={{ marginBottom: 20 }} />
        ) : (
          <Pressable style={styles.mainButton} onPress={handleLogin}>
            <Text style={styles.mainButtonText}>로그인</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBackHeader: { 
    height: 56, 
    justifyContent: 'center', 
    paddingHorizontal: 12,
    backgroundColor: '#fff' 
  },
  backButton: { 
    padding: 8 
  },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginTop: 16, marginBottom: 30, lineHeight: 36 },
  input: { backgroundColor: '#F2F4F6', padding: 18, borderRadius: 16, marginBottom: 12 },
  signupLink: { marginTop: 10, alignItems: 'center' },
  signupLinkText: { color: '#6B7280', textDecorationLine: 'underline', fontSize: 14 },
  mainButton: { backgroundColor: '#3182F6', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});