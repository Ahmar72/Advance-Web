import { createContext, useContext } from 'react'

type SectionContextValue = {
  activeSection: string
  setActiveSection: (id: string) => void
}

const SectionContext = createContext<SectionContextValue | undefined>(undefined)

export const SectionProvider = ({
  value,
  children,
}: {
  value: SectionContextValue
  children: React.ReactNode
}) => <SectionContext.Provider value={value}>{children}</SectionContext.Provider>

export const useSectionNav = () => {
  const context = useContext(SectionContext)
  if (!context) {
    throw new Error('useSectionNav must be used inside SectionProvider')
  }
  return context
}
