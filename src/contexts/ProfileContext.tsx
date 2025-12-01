// Контекст для управления текущим профилем (ребенка, для которого проходится опрос)
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileContextType {
  currentProfileId: string | null;
  currentProfile: Profile | null;
  setCurrentProfileId: (id: string | null) => void;
  setCurrentProfile: (profile: Profile | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  return (
    <ProfileContext.Provider
      value={{
        currentProfileId,
        currentProfile,
        setCurrentProfileId,
        setCurrentProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useCurrentProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useCurrentProfile must be used within a ProfileProvider');
  }
  return context;
}






