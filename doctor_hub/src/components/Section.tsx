import type { ReactNode } from 'react'
import { useSectionNav } from './SectionContext'

type SectionProps = {
  id: string
  children: ReactNode
}

export const Section = ({ id, children }: SectionProps) => {
  const { activeSection } = useSectionNav()

  if (activeSection !== id) {
    return null
  }

  return (
    <section className="section" data-section={id}>
      {children}
    </section>
  )
}
