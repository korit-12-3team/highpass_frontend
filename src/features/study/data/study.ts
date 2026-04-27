export interface Study {
  id: number;
  userId: number;
  userName: string;
  userNickname: string;
  userAge: string;
  userGender: string;
  userRegion: string;
  title: string;
  content: string;
  locationName: string;
  latitude: number;
  longitude: number;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  cert: string | null;
}

// Frontend dummy data removed. Replace with backend API responses.
export const studies: Study[] = [];

export function getAllStudies() {
  return studies;
}

export function getStudyById(id: number) {
  return studies.find((study) => study.id === id);
}
