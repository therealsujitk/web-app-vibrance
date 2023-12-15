import { AlertColor } from "@mui/material";
import { createContext } from "react"

export interface AppContextInterface {
  apiKey?: string,
  username?: string,
  permissions?: string[],
  initSession: (apiKey: string) => void,
  setSession: (username: string, permissions: string[]) => void,
  destroySession: () => void,
  displayAlert: (type: AlertColor, message: Error|string, action?: { name: string, onClick: () => void }) => void,
  displayError: (message: Error|string|string[], action?: { name: string, onClick: () => void }) => void,
  displayWarning: (message: string) => void,
  displaySuccess: (message: string) => void
}

export const AppContext = createContext<AppContextInterface>(undefined!);
