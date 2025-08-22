import React from 'react'
import { SectionDropdown } from './SectionDropdown'
import { ActionButtons } from './ActionButtons'

interface ControlPanelProps {
  currentSection: 'public' | 'anonymous' | string
  onSectionChange: (section: 'public' | 'anonymous' | string) => void
  onCreatePostOpen: () => void
  onCreateCommunityOpen: () => void
  onAddMemberOpen: () => void
  onCommunityInfoOpen: () => void
  onAddToCartOpen: () => void
  onRefresh: () => void
  isRefreshing?: boolean
  refreshTrigger?: number
}

export function ControlPanel({
  currentSection,
  onSectionChange,
  onCreatePostOpen,
  onCreateCommunityOpen,
  onAddMemberOpen,
  onCommunityInfoOpen,
  onAddToCartOpen,
  onRefresh,
  isRefreshing = false,
  refreshTrigger
}: ControlPanelProps) {
  return (
    <div className="sticky top-20 z-30 bg-gradient-to-r from-blue-50/80 via-white/80 to-purple-50/80 backdrop-blur-xl border-b border-white/30">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Section Dropdown */}
          <SectionDropdown
            currentSection={currentSection}
            onSectionChange={onSectionChange}
            refreshTrigger={refreshTrigger}
          />

          {/* Action Buttons */}
          <ActionButtons
            onCreatePostOpen={onCreatePostOpen}
            onCreateCommunityOpen={onCreateCommunityOpen}
            onAddMemberOpen={onAddMemberOpen}
            onCommunityInfoOpen={onCommunityInfoOpen}
            onAddToCartOpen={onAddToCartOpen}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            section={currentSection}
          />
        </div>
      </div>
    </div>
  )
}
