import axios, { AxiosInstance } from 'axios';
import { APP_CONFIG } from '../config/app';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({ baseURL: APP_CONFIG.API_BASE_URL });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async get<T>(url: string) {
    const response = await this.axiosInstance.get<T>(url);
    return response.data;
  }
}

export const api = new ApiService();
