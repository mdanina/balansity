import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { getProfile } from "@/lib/profileStorage";
import type { Database } from "@/lib/supabase";
import childFemaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-girl-7-yo--soft.png";
import childMaleAvatar from "@/assets/friendly-and-clean-face-of-a-white-boy-7-yo--soft- (1).png";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function CheckupIntro() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId } = useCurrentProfile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Используем profileId из URL или из контекста
  const profileId = params.profileId || currentProfileId;

  // Функция для выбора аватара на основе пола ребенка
  const getAvatarImage = useCallback((profile: Profile | null) => {
    if (!profile) {
      return childFemaleAvatar; // Fallback
    }
    return profile.gender === 'male' ? childMaleAvatar : childFemaleAvatar;
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (profileId) {
        try {
          const loadedProfile = await getProfile(profileId);
          setProfile(loadedProfile);
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadProfile();
  }, [profileId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={3} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">1 / 31</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12 text-center">
          <img
            src={getAvatarImage(profile)}
            alt={profile ? `${profile.first_name}` : "Ребенок"}
            className="mx-auto h-80 w-80 rounded-full object-cover"
          />
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              {profile ? (
                <>Давайте сосредоточимся на <span className="font-bold">{profile.first_name}</span>.</>
              ) : (
                <>Давайте сосредоточимся на ребенке.</>
              )}
            </h1>
          </div>

          <Button
            size="lg"
            onClick={() => {
              if (profileId) {
                navigate(`/checkup-questions/${profileId}`);
              } else {
                navigate("/checkup");
              }
            }}
            className="h-14 w-full max-w-md text-base font-medium"
          >
            Начнем
          </Button>
        </div>
      </div>
    </div>
  );
}
