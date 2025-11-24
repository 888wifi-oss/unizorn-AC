"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUserId } from '@/lib/utils/mock-auth'
import { getProjects } from '@/lib/actions/project-actions'

interface ProjectContextValue {
  selectedProjectId: string | null
  selectedProject: any | null
  availableProjects: any[]
  setSelectedProjectId: (projectId: string | null) => void
  loading: boolean
  isProjectSelected: boolean
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function ProjectContextProvider({ children }: { children: ReactNode }) {
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [availableProjects, setAvailableProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const currentUserId = getCurrentUserId()

  // Load available projects on mount
  useEffect(() => {
    loadProjects()
  }, [currentUserId])

  // Update selected project when ID changes
  useEffect(() => {
    if (selectedProjectId && availableProjects.length > 0) {
      const project = availableProjects.find(p => p.id === selectedProjectId)
      setSelectedProject(project || null)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_project_id', selectedProjectId)
      }
    } else {
      setSelectedProject(null)
    }
  }, [selectedProjectId, availableProjects])

  // Restore from localStorage (only once when projects are loaded)
  useEffect(() => {
    if (typeof window !== 'undefined' && availableProjects.length > 0 && !selectedProjectId) {
      const savedProjectId = localStorage.getItem('selected_project_id')
      if (savedProjectId && availableProjects.some(p => p.id === savedProjectId)) {
        console.log('[ProjectContext] Restoring from localStorage:', savedProjectId)
        setSelectedProjectIdState(savedProjectId)
      }
    }
  }, [availableProjects])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const result = await getProjects(currentUserId)
      if (result.success) {
        setAvailableProjects(result.projects || [])
        
        // Auto-select if only one project (and not already selected)
        if (result.projects?.length === 1 && !selectedProjectId) {
          console.log('[ProjectContext] Auto-selecting single project:', result.projects[0].id)
          setSelectedProjectIdState(result.projects[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const setSelectedProjectId = (projectId: string | null) => {
    console.log('[ProjectContext] Changing project to:', projectId)
    setSelectedProjectIdState(projectId)
    
    if (projectId === null && typeof window !== 'undefined') {
      localStorage.removeItem('selected_project_id')
    }
    
    // Force reload by triggering a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId } }))
    }
  }

  const value: ProjectContextValue = {
    selectedProjectId,
    selectedProject,
    availableProjects,
    setSelectedProjectId,
    loading,
    isProjectSelected: selectedProjectId !== null
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectContextProvider')
  }
  return context
}

