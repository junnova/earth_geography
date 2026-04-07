import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export function fetchLandmarks() {
  return api.get('/landmarks').then((res) => res.data)
}

export function fetchLandmark(id) {
  return api.get(`/landmarks/${id}`).then((res) => res.data)
}

export function createLandmark(data) {
  return api.post('/landmarks', data).then((res) => res.data)
}

export function updateLandmark(id, data) {
  return api.put(`/landmarks/${id}`, data).then((res) => res.data)
}

export function deleteLandmark(id) {
  return api.delete(`/landmarks/${id}`).then((res) => res.data)
}

export function searchLandmarks(keyword) {
  return api.get('/landmarks/search', { params: { q: keyword } }).then((res) => res.data)
}

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)
}
