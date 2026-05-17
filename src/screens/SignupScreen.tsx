import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignupScreen({ navigation }: any) {
  const [role, setRole] = useState<'PARENT' | 'TEACHER'>('PARENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>처음이시군요!{'\n'}정보를 입력해주세요</Text>
        
        {/* 역할 선택 탭 */}
        <View style={styles.roleTab}>
          <Pressable 
            style={[styles.tabItem, role === 'PARENT' && styles.tabActive]} 
            onPress={() => setRole('PARENT')}
          >
            <Text style={[styles.tabText, role === 'PARENT' && styles.tabTextActive]}>부모님</Text>
          </Pressable>
          <Pressable 
            style={[styles.tabItem, role === 'TEACHER' && styles.tabActive]} 
            onPress={() => setRole('TEACHER')}
          >
            <Text style={[styles.tabText, role === 'TEACHER' && styles.tabTextActive]}>선생님</Text>
          </Pressable>
        </View>

        <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry />

        <View style={{ flex: 1 }} />
        
        <Pressable style={styles.mainButton} onPress={() => navigation.goBack()}>
          <Text style={styles.mainButtonText}>가입하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// 스타일은 LoginScreen과 유사하게 유지하되 roleTab 추가
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginTop: 40, marginBottom: 30 },
  roleTab: { flexDirection: 'row', backgroundColor: '#F2F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#3182F6', fontWeight: 'bold' },
  input: { backgroundColor: '#F2F4F6', padding: 18, borderRadius: 16, marginBottom: 12 },
  mainButton: { backgroundColor: '#3182F6', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});