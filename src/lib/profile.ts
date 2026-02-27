export type Language = {
  name: string;
  level: string;
};

export interface Profile {
  avatar?: string;
  name: string;
  username: string;
  email: string;
  occupation: string;
  bio: string;
  country: string;

  skills: string[];
  experienceYears: number;
  education: string;
  availability: string[];
  languages: Language[];

  cvFile?: string;
}

const STORAGE_KEY = "brujula_profile";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}