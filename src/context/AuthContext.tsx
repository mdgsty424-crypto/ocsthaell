import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  ocId: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true, ocId: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ocId, setOcId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
            if (data.ocId) {
              setOcId(data.ocId);
            } else {
              setOcId(`OC-${currentUser.uid.substring(0, 8).toUpperCase()}`);
            }
          } else if (currentUser.email === 'mdgsty424@gmail.com' || currentUser.email === 'info@ocsthael.com') {
            setIsAdmin(true);
            setOcId(`OC-${currentUser.uid.substring(0, 8).toUpperCase()}`);
          } else {
            setIsAdmin(false);
            setOcId(`OC-${currentUser.uid.substring(0, 8).toUpperCase()}`);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          setOcId(`OC-${currentUser.uid.substring(0, 8).toUpperCase()}`);
        }
      } else {
        setIsAdmin(false);
        setOcId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, ocId }}>
      {children}
    </AuthContext.Provider>
  );
};
