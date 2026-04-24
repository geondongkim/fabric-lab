import { Travel, TravelsResponse } from '@/types/travel';

// const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = 'https://3dt005-hhe8d7frerbef3hb.koreacentral-01.azurewebsites.net';

export const api = {
  /**
   * 전체 관광지 목록 조회
   */
  async fetchTravels(): Promise<Travel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/travels`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TravelsResponse = await response.json();
      return data.namhae_travels.items;
    } catch (error) {
      console.error('Error fetching travels:', error);
      throw error;
    }
  },

  /**
   * 특정 관광지 상세 정보 조회
   */
  async fetchTravelDetail(no: number): Promise<Travel> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/travels/${no}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Travel = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching travel detail:', error);
      throw error;
    }
  },
};
