import { createContext } from "react"

export interface AppContextInterface {
  apiKey?: string,
  username?: string,
  permissions?: string[],
  initSession: (apiKey: string) => void,
  setSession: (username: string, permissions: string[]) => void,
  destroySession: () => void
}

export const AppContext = createContext<AppContextInterface>(undefined!);
