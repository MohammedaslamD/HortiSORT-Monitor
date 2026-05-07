import { apiClient } from './apiClient'
import { MOCK_USERS } from '../data/mockData'
import type { User, CreateUserPayload, UpdateUserPayload } from '../types'

export async function getUsers(): Promise<User[]> {
  try {
    const res = await apiClient.get<User[]>('/api/v1/users')
    return res.data
  } catch { return [...MOCK_USERS] }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const res = await apiClient.get<User>(`/api/v1/users/${id}`)
    return res.data
  } catch { return MOCK_USERS.find(u => u.id === id) ?? null }
}

export async function toggleUserActive(id: number): Promise<User> {
  try {
    const res = await apiClient.patch<User>(`/api/v1/users/${id}/active`)
    return res.data
  } catch {
    const u = MOCK_USERS.find(u => u.id === id)
    if (!u) throw new Error(`User ${id} not found`)
    return { ...u, is_active: !u.is_active }
  }
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  try {
    const res = await apiClient.post<User>('/api/v1/users', data)
    return res.data
  } catch {
    return {
      id: Date.now(), ...data, password_hash: 'hashed_password_123',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      phone: data.phone ?? '', whatsapp_number: data.whatsapp_number ?? null,
      is_active: true,
    } as User
  }
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<User> {
  try {
    const res = await apiClient.patch<User>(`/api/v1/users/${id}`, data)
    return res.data
  } catch {
    const u = MOCK_USERS.find(u => u.id === id)
    if (!u) throw new Error(`User ${id} not found`)
    return { ...u, ...data, updated_at: new Date().toISOString() }
  }
}

export async function assignMachinesToUser(id: number, machineIds: number[]): Promise<void> {
  try { await apiClient.patch(`/api/v1/users/${id}/machines`, { machine_ids: machineIds }) }
  catch { /* no-op in demo mode */ }
}

export async function deleteUser(id: number): Promise<void> {
  try { await apiClient.delete(`/api/v1/users/${id}`) }
  catch { /* no-op in demo mode */ }
}
