import { useState } from 'react'

import { Doctor, DoctorContext } from '@/hooks/use-doctor-context'

export default function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  return (
    <DoctorContext.Provider value={{ selectedDoctor, setSelectedDoctor }}>
      {children}
    </DoctorContext.Provider>
  )
}
