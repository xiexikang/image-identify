// API服务封装
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'

interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    avatar?: string
  }
}

interface RecognitionItem {
  keyword: string
  name?: string
  year?: string
  score: number
  root?: string
  type?: number
  location?: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface RecognitionResult {
  record_id: number
  keyword: string
  name?: string
  score: number
  description: string
  results?: RecognitionItem[]
  color_result?: string
  location_result?: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface Record {
  id: number
  type: string
  image_url: string
  result: string
  confidence: number
  created_at: string
  raw_response?: string
}

// 获取token
function getToken(): string | null {
  return localStorage.getItem('token')
}

// 设置token
function setToken(token: string): void {
  localStorage.setItem('token', token)
}

// 清除token
function clearToken(): void {
  localStorage.removeItem('token')
}

// 请求封装
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    throw new Error(`API request failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || data
}

// 原始请求（不解包顶层data），用于分页等复杂响应
async function requestRaw<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    throw new Error(`API request failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// 用户认证API
export const authAPI = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.token) {
      setToken(response.token)
    }
    
    return response
  },

  async register(username: string, password: string): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.token) {
      setToken(response.token)
    }
    
    return response
  },

  logout(): void {
    clearToken()
  },
}

// 图像识别API
export const recognitionAPI = {
  async uploadImage(imageFile: File, type: string): Promise<{ record_id: number; image_url: string }> {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('type', type)

    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/recognize/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  },

  async analyzeImage(imageBase64: string, type: string): Promise<RecognitionResult> {
    return request<RecognitionResult>('/recognize/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64, type }),
    })
  },
}

// 记录管理API
export const recordsAPI = {
  async getRecords(page: number = 1, pageSize: number = 10, type?: string): Promise<{
    data: Record[]
    pagination: {
      total: number
      page: number
      page_size: number
      pages: number
    }
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    if (type) {
      params.append('type', type)
    }

    return requestRaw(`/records?${params.toString()}`)
  },

  async getRecord(id: number): Promise<Record> {
    return request(`/records/${id}`)
  },

  async deleteRecord(id: number): Promise<void> {
    await request(`/records/${id}`, {
      method: 'DELETE',
    })
  },

  async backfillRecordImages(): Promise<{ updated: number }> {
    return request<{ updated: number }>(`/records/backfill_images`, {
      method: 'POST',
    })
  },
}

export default {
  authAPI,
  recognitionAPI,
  recordsAPI,
}