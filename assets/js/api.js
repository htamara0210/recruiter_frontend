class ApiService {
  constructor() {
    this.baseUrl = 'http://204.236.199.57:5678/webhook';
    this.endpoints = {
      candidates: `${this.baseUrl}/candidates`,
      candidateDetail: (id) => `${this.baseUrl}/0e7cbf8b-c960-48d1-a3e6-da817e8f70db/canditate/${id}`,
      toggleReview: (id) => `${this.baseUrl}/2534c1f7-6624-42e6-bc5a-f2ee6c6679bb/candidate/status/review/${id}`,
      downloadFile: (filename) => `${this.baseUrl}/file/${filename}`
    };
  }

  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Método actualizado para enviar filtros al backend
  async getCandidates(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    
    if (filters.page) {
      params.append('page', filters.page);
    }
    
    if (filters.limit) {
      params.append('limit', filters.limit);
    }

    const url = params.toString() ? 
      `${this.endpoints.candidates}?${params.toString()}` : 
      this.endpoints.candidates;
      
    return this.request(url);
  }

  async getCandidateDetail(id) {
    return this.request(this.endpoints.candidateDetail(id));
  }

  async toggleCandidateReview(id) {
    return fetch(this.endpoints.toggleReview(id), {
      method: 'PATCH'
    });
  }

  getFileUrl(filename) {
    return this.endpoints.downloadFile(filename);
  }
}

const apiService = new ApiService();