import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/services/api';
import { Travel } from '@/types/travel';

export default function TravelDetailScreen() {
  const router = useRouter();
  const { no } = useLocalSearchParams<{ no: string }>();
  const [travel, setTravel] = useState<Travel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTravelDetail = async () => {
      try {
        setError(null);
        const data = await api.fetchTravelDetail(parseInt(no));
        setTravel(data);
      } catch (err) {
        setError('관광지 정보를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (no) {
      loadTravelDetail();
    }
  }, [no]);

  const handlePhonePress = (tel: string) => {
    if (tel) {
      Linking.openURL(`tel:${tel}`);
    }
  };

  const handleWebsitePress = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error || !travel) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || '정보를 찾을 수 없습니다.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>{travel.name}</Text>
        {travel.theme && (
          <View style={styles.themeContainer}>
            <Text style={styles.theme}>{travel.theme}</Text>
          </View>
        )}
      </View>

      {/* 기본 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기본 정보</Text>

        {travel.address && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>주소</Text>
            <Text style={styles.value}>{travel.address}</Text>
          </View>
        )}

        {travel.tel && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handlePhonePress(travel.tel)}
          >
            <Text style={styles.label}>전화번호</Text>
            <Text style={[styles.value, styles.link]}>{travel.tel}</Text>
          </TouchableOpacity>
        )}

        {travel.type && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>유형</Text>
            <Text style={styles.value}>{travel.type}</Text>
          </View>
        )}
      </View>

      {/* 위치 정보 */}
      {(travel.latitude || travel.longitude) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>위치 정보</Text>

          {travel.latitude && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>위도</Text>
              <Text style={styles.value}>{travel.latitude}</Text>
            </View>
          )}

          {travel.longitude && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>경도</Text>
              <Text style={styles.value}>{travel.longitude}</Text>
            </View>
          )}
        </View>
      )}

      {/* 편의 시설 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>편의 시설</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>주차장</Text>
          <Text style={styles.value}>
            {travel.has_parkinglot === 'Y' ? '있음' : '없음'}
          </Text>
        </View>

        {travel.has_parkinglot === 'Y' && travel.parkinglot_count > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>주차 가능 대수</Text>
            <Text style={styles.value}>{travel.parkinglot_count}대</Text>
          </View>
        )}
      </View>

      {/* 상세 설명 */}
      {travel.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 설명</Text>
          <Text style={styles.description}>{travel.description}</Text>
        </View>
      )}

      {/* 홈페이지 */}
      {travel.homepage && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => handleWebsitePress(travel.homepage)}
          >
            <Text style={styles.websiteButtonText}>홈페이지 방문하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    lineHeight: 34,
  },
  themeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  theme: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  label: {
    fontSize: 15,
    color: '#8E8E93',
    width: 100,
    flexShrink: 0,
  },
  value: {
    fontSize: 15,
    color: '#000000',
    flex: 1,
    lineHeight: 22,
  },
  link: {
    color: '#007AFF',
  },
  description: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 24,
  },
  websiteButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  websiteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
