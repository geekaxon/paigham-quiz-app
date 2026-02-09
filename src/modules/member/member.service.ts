export interface MemberDetails {
  omjCard: string;
  name: string;
  email: string;
  phone: string;
}

export const getMemberDetails = async (omjCard: string): Promise<MemberDetails | null> => {
  // TODO: Replace with real REST API call
  // Example: const response = await fetch(`https://api.example.com/members/${omjCard}`);

  const mockMembers: Record<string, MemberDetails> = {
    "OMJ-001": {
      omjCard: "OMJ-001",
      name: "Ahmed Khan",
      email: "ahmed.khan@example.com",
      phone: "+92-300-1234567",
    },
    "OMJ-002": {
      omjCard: "OMJ-002",
      name: "Fatima Ali",
      email: "fatima.ali@example.com",
      phone: "+92-321-7654321",
    },
  };

  const member = mockMembers[omjCard];

  if (!member) {
    return null;
  }

  return member;
};
