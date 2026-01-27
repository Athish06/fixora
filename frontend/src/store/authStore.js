import { create } from 'zustand';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper to get user from sessionStorage
const getStoredUser = () => {
  try {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper to store user in sessionStorage
const storeUser = (user) => {
  if (user) {
    sessionStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('user');
  }
};

export const useAuthStore = create((set, get) => ({
  token: getCookie('auth_token'),
  user: getStoredUser(),
  isAuthenticated: !!getCookie('auth_token'),
  
  setToken: (token) => {
    setCookie('auth_token', token, 7); // 7 days expiry
    set({ token, isAuthenticated: true });
  },
  
  setUser: (user) => {
    storeUser(user);
    set({ user });
  },
  
  logout: () => {
    deleteCookie('auth_token');
    sessionStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  // Fetch user data using stored token
  fetchUser: async () => {
    const token = getCookie('auth_token');
    if (!token) return false;
    
    try {
      const response = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        // Token is invalid, clear it
        get().logout();
        return false;
      }
      
      const userData = await response.json();
      get().setUser(userData);
      return true;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return false;
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      get().setToken(data.access_token);
      
      // Fetch user data
      const userResponse = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await userResponse.json();
      get().setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },
  
  register: async (email, password, full_name) => {
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      const data = await response.json();
      get().setToken(data.access_token);
      
      // Fetch user data
      const userResponse = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await userResponse.json();
      get().setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }
}));