import { createContext, useContext } from 'react'

export type MedicinePricing = {
  '7_days': number
  '15_days': number
  '1_month': number
  '2_months': number
}

export const DEFAULT_PRICING: MedicinePricing = {
  '7_days': 375,
  '15_days': 750,
  '1_month': 1500,
  '2_months': 3000,
}

export type Doctor = {
  id: string
  full_name: string
  specialty?: string | null
  bio?: string | null
  rating?: number | null
  medicine_price?: MedicinePricing | null
}

export type DoctorContextData = {
  selectedDoctor: Doctor | null
  setSelectedDoctor: (doctor: Doctor | null) => void
}

export const DoctorContext = createContext<DoctorContextData>({
  selectedDoctor: null,
  setSelectedDoctor: () => {},
})

export function useDoctorContext() {
  return useContext(DoctorContext)
}
