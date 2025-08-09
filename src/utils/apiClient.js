// API Client utility with automatic authentication
class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
    console.log('🔧 API Client initialized with baseURL:', this.baseURL);
  }

  // Get auth token from localStorage
  getAuthToken() {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('🎫 Token retrieved from localStorage - Length:', token.length);
      console.log('🎫 Token starts with:', token.substring(0, 20) + '...');
      console.log('🎫 Token ends with:', '...' + token.substring(token.length - 10));
      
      // Check for common token corruption issues
      if (token.includes('\n') || token.includes('\r')) {
        console.warn('⚠️ Token contains newline characters!');
      }
      if (token.includes(' ') && !token.startsWith('Bearer ')) {
        console.warn('⚠️ Token contains spaces but is not a Bearer token!');
      }
      if (token.split('.').length !== 3) {
        console.warn('⚠️ Token does not have 3 parts (invalid JWT format)!');
      }
    } else {
      console.log('🎫 No token found in localStorage');
    }
    return token;
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
      console.log(`🌐 API Call: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Token expired or invalid');
        console.log('🧹 Clearing localStorage and redirecting to login');
        // Token expired or invalid, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Authentication required');
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

    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: headers, // Don't set Content-Type for FormData
      body: formData
    });
  }

  // Auth-specific methods
  async login(email, password) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.token) {
      console.log('🎫 Login - Token received from server - Length:', response.token.length);
      console.log('🎫 Login - Token starts with:', response.token.substring(0, 20) + '...');
      console.log('🎫 Login - Token ends with:', '...' + response.token.substring(response.token.length - 10));
      console.log('🎫 Login - Token parts count:', response.token.split('.').length);
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Verify token was stored correctly
      const storedToken = localStorage.getItem('authToken');
      console.log('🎫 Login - Token stored correctly:', storedToken === response.token);
      if (storedToken !== response.token) {
        console.error('❌ Token corruption detected during storage!');
        console.log('Original length:', response.token.length, 'Stored length:', storedToken?.length);
      }
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
    console.log('🔐 Auth check - Token:', token ? 'Present' : 'Missing');
    console.log('🔐 Auth check - User:', user ? 'Present' : 'Missing');
    const isAuth = !!(token && user);
    console.log('🔐 Auth result:', isAuth);
    return isAuth;
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