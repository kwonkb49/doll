import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';

export default function ReportScreen() {
  // 시연용 가짜 데이터 (나중에 백엔드 연결할 부분)
  const pieData = [{value: 35, color: '#FFD700'}, {value: 25, color: '#A7D7C5'}, {value: 40, color: '#FF8A8A'}];
  const barData = [{value: 53, label: 'JOY'}, {value: 38, label: 'CALM'}, {value: 27, label: 'ANGER'}];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>KNU Emotion Doll</Text>
        <Text style={styles.subTitle}>감정 분석 리포트</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>전체 감정 비율</Text>
          <View style={{alignItems: 'center'}}>
            <PieChart data={pieData} donut radius={90} innerRadius={60} 
              centerLabelComponent={() => <Text style={{fontSize: 20, fontWeight: 'bold'}}>152회</Text>} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>빈도 분석</Text>
          <BarChart data={barData} barWidth={40} noOfSections={3} frontColor="#3182F6" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9F9F9' },
  container: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subTitle: { fontSize: 18, color: '#4E5933', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 }
});