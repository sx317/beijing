import { createContext } from "react";

export interface LightboxAPI {
  open: (src: string, group?: string) => void;
  registerGroup: (group: string, srcs: string[]) => void;
  setPhotoMode: (on: boolean) => void;
  photoMode: boolean;
}

export const LightboxContext = createContext<LightboxAPI | null>(null);
