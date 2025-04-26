import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

const authService = {
  async login(credentials: LoginCredentials) {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axios.post(`${API_URL}/auth/token`, formData);
    const token = response.data.access_token;
    
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return response.data;
  },

  async register(credentials: RegisterCredentials) {
    const response = await axios.post(`${API_URL}/auth/register`, credentials);
    return response.data;
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/auth/users/me`);
      return response.data;
    } catch (error: unknown) {
        console.error('Error fetching current user:', error);
        localStorage.removeItem('token');
        return null;
      }
  },

  logout() {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

export default authService;