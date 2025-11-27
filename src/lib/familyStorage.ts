export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  relationship: string;
  sex: string;
  pronouns?: string;
  referral?: string;
  seekingCare: string;
  avatar?: string;
}

const STORAGE_KEY = 'family_members';

export const getFamilyMembers = (): FamilyMember[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading family members:', error);
    return [];
  }
};

export const saveFamilyMembers = (members: FamilyMember[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.error('Error saving family members:', error);
  }
};

export const addFamilyMember = (member: Omit<FamilyMember, 'id' | 'age'>): FamilyMember => {
  const members = getFamilyMembers();
  const age = calculateAge(member.dateOfBirth);
  const newMember: FamilyMember = {
    ...member,
    id: Date.now().toString(),
    age,
  };
  members.push(newMember);
  saveFamilyMembers(members);
  return newMember;
};

export const updateFamilyMember = (id: string, updates: Partial<FamilyMember>): void => {
  const members = getFamilyMembers();
  const index = members.findIndex(m => m.id === id);
  if (index !== -1) {
    members[index] = { ...members[index], ...updates };
    if (updates.dateOfBirth) {
      members[index].age = calculateAge(updates.dateOfBirth);
    }
    saveFamilyMembers(members);
  }
};

export const deleteFamilyMember = (id: string): void => {
  const members = getFamilyMembers();
  const filtered = members.filter(m => m.id !== id);
  saveFamilyMembers(filtered);
};

export const getFamilyMember = (id: string): FamilyMember | undefined => {
  const members = getFamilyMembers();
  return members.find(m => m.id === id);
};

const calculateAge = (dateOfBirth: string): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
