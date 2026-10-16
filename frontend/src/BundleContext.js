import { createContext, useContext } from 'react'

export const BundleContext = createContext(null)

export function useBundles() {
  return useContext(BundleContext)
}
