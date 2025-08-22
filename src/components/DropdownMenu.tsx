import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, UserX } from 'lucide-react'

interface DropdownMenuProps {
  currentSection: 'public' | 'anonymous'
  onSectionChange: (section: 'public' | 'anonymous') => void
}

export function DropdownMenu({ currentSection, onSectionChange }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sections = [
    {
      id: 'public' as const,
      name: 'Public',
      description: 'Posts with your name visible',
      icon: Globe,
    },
    {
      id: 'anonymous' as const,
      name: 'Anonymous',
      description: 'Text-only posts without your name',
      icon: UserX,
    },
  ]

  const currentSectionData = sections.find(s => s.id === currentSection)
  const CurrentIcon = currentSectionData?.icon || Globe

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-6 py-4 backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl hover:bg-white/80 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl min-w-[220px]"
      >
        <CurrentIcon className="w-5 h-5 text-gray-700" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-gray-800">
            {currentSectionData?.name}
          </p>
          <p className="text-xs text-gray-600">
            {currentSectionData?.description}
          </p>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu - Enhanced visibility */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          {sections.map((section, index) => {
            const Icon = section.icon
            const isActive = section.id === currentSection
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-6 py-4 text-left hover:bg-white/60 transition-colors duration-150 ${
                  isActive ? 'bg-white/60' : ''
                } ${index === 0 ? 'rounded-t-2xl' : 'rounded-b-2xl'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-700'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                    {section.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {section.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
