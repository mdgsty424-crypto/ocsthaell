import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isTeam: boolean;
  loading: boolean;
  ocId: string | null;
  profileData: any | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, isTeam: false, loading: true, ocId: null, profileData: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeam, setIsTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ocId, setOcId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check for admin/team status in Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.data();
          if (userData) {
            setProfileData({
              ...userData,
              displayName: userData.displayName || userData.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
            });
          } else {
            setProfileData({
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              email: currentUser.email,
              role: 'user'
            });
          }
          
          if (currentUser.email === 'info@ocsthael.com' || userData?.role === 'admin') {
            setIsAdmin(true);
            setIsTeam(true);
          } else if (userData?.role === 'team' || userData?.role === 'staff') {
            setIsAdmin(false);
            setIsTeam(true);
          } else {
            setIsAdmin(false);
            setIsTeam(false);
          }
          
          setOcId(userData?.ocId || `OC-${currentUser.uid.substring(0, 8).toUpperCase()}`);
        } catch (error) {
          console.error("Error checking roles:", error);
          setIsAdmin(false);
          setIsTeam(false);
          setOcId(`OC-${currentUser.uid.substring(0, 8).toUpperCase()}`);
          setProfileData(null);
        }
      } else {
        setIsAdmin(false);
        setIsTeam(false);
        setOcId(null);
        setProfileData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isTeam, loading, ocId, profileData }}>
      {children}
    </AuthContext.Provider>
  );
};
