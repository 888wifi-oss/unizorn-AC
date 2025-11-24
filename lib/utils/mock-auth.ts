// lib/utils/mock-auth.ts
"use client"

/**
 * Simple authentication for development
 * Uses real user data from database
 */

// Guest user (not logged in)
const GUEST_USER = {
  id: 'guest',
  email: 'guest@example.com',
  full_name: 'Guest',
  role: 'guest',
  roleDisplay: 'ไม่ได้เข้าสู่ระบบ',
  phone: ''
}

/**
 * Get current user ID (mock)
 * Replace with real session/auth in production
 */
export function getCurrentUserId(): string {
  // Check localStorage for saved user
  if (typeof window !== 'undefined') {
    const savedUserId = localStorage.getItem('mock_user_id')
    if (savedUserId) {
      return savedUserId
    }
  }
  
  // Default to guest (not logged in)
  return 'guest'
}

/**
 * Set current user (mock)
 */
export function setCurrentUserId(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_user_id', userId)
  }
}

/**
 * Set current user data in localStorage
 */
export function setCurrentUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_user', JSON.stringify(user))
    localStorage.setItem('mock_user_id', user.id)
  }
}

/**
 * Get current user data
 */
export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('current_user')
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (e) {
        return GUEST_USER
      }
    }
  }
  return GUEST_USER
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(): boolean {
  return getCurrentUserId() === '00000000-0000-0000-0000-000000000001'
}

/**
 * Login user
 */
export function loginUser(user: any) {
  setCurrentUser(user)
  if (typeof window !== 'undefined') {
    window.location.href = '/companies'
  }
}

/**
 * Logout user
 */
export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('current_user')
    localStorage.removeItem('mock_user_id')
    window.location.href = '/login'
  }
}

/**
 * User switcher for development (Quick switch)
 */
export function switchUser(user: any) {
  setCurrentUser(user)
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
