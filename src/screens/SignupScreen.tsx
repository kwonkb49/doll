import { Ionicons } from '@expo/vector-icons'; // 💡 상단 뒤로가기 아이콘을 위해 추가!
import axios from 'axios';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignupScreen({ navigation }: any) {
  const [role, setRole] = useState<'PARENT' | 'TEACHER'>('PARENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !phoneNumber) {
      Alert.alert("알림", "모든 정보를 입력해 주세요!");
      return;
    }

    setLoading(true);

    const requestData = {
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      role: role 
    };

    try {
      const response = await axios.post('https://doll-1v83.onrender.com/auth/signup', requestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("성공", "회원가입이 완료되었습니다!", [
          { text: "확인", onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error: any) {
      if (error.response) {
        Alert.alert(`서버 에러 (${error.response.status})`, error.response.data?.message?.toString() || "데이터 규격을 다시 확인해주세요.");
      } else {
        Alert.alert("네트워크 에러", "서버 연결에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 💡 로그인 화면과 완벽하게 대칭되는 상단 뒤로가기 바 영역 추가 */}
      <View style={styles.topBackHeader}>
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#191F28" />
        </Pressable>
      </View>

      <View style={styles.inner}>
        <Text style={styles.title}>정보를 입력해주세요</Text>
        
        <View style={styles.roleTab}>
          <Pressable style={[styles.tabItem, role === 'PARENT' && styles.tabActive]} onPress={() => setRole('PARENT')}>
            <Text style={[styles.tabText, role === 'PARENT' && styles.tabTextActive]}>부모님</Text>
          </Pressable>
          <Pressable style={[styles.tabItem, role === 'TEACHER' && styles.tabActive]} onPress={() => setRole('TEACHER')}>
            <Text style={[styles.tabText, role === 'TEACHER' && styles.tabTextActive]}>선생님</Text>
          </Pressable>
        </View>

        <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} />
        <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
        <TextInput style={styles.input} placeholder="전화번호 (예: 01012345678)" value={phoneNumber} onChangeText={setPhoneNumber} autoCapitalize="none" keyboardType="phone-pad" autoCorrect={false} />
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} />

        <View style={{ flex: 1 }} />
        
        {loading ? (
          <ActivityIndicator size="large" color="#3182F6" style={{ marginBottom: 20 }} />
        ) : (
          <Pressable style={styles.mainButton} onPress={handleSignup}>
            <Text style={styles.mainButtonText}>가입하기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // 💡 상단 뒤로가기 헤더 바 스타일 정의
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
  title: { fontSize: 26, fontWeight: 'bold', marginTop: 16, marginBottom: 30 },
  roleTab: { flexDirection: 'row', backgroundColor: '#F2F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#3182F6', fontWeight: 'bold' },
  input: { backgroundColor: '#F2F4F6', padding: 18, borderRadius: 16, marginBottom: 12 },
  mainButton: { backgroundColor: '#3182F6', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});