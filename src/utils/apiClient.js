// API Client utility with automatic authentication
class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Get default headers including authentication
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: this.getHeaders(options.headers)
    };

    try {
      // console.log(`🌐 API Call: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      //console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Token expired or invalid');
        console.log('🧹 Clearing localStorage and redirecting to login');
        // Token expired or invalid, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Only redirect if we're not on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          return;
        }
        
        // If we're on login page, throw error to be handled by login form
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error(`API Request failed: ${config.method || 'GET'} ${url}`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // File upload method (without JSON headers)
  async uploadFile(endpoint, formData, options = {}) {
    const token = this.getAuthToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Call fetch directly to avoid getHeaders() which adds Content-Type
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'POST',
      headers: headers, // Only auth header, no Content-Type
      body: formData
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Only redirect if we're not on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          return;
        }
        
        // If we're on login page, throw error to be handled by login form
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Upload failed: ${url}`, error);
      throw error;
    }
  }

  // Auth-specific methods
  async login(email, password) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(userData) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAuthToken();
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;