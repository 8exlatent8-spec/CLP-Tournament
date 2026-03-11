import { useRouter } from 'next/router';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { auth, database } from '@/backend/Firebase'

const Context = createContext();

export const StateContext = ({ children }) => {

  // Variables to Carry Across Multiple Pages
  const [user, setUser] = useState(undefined)
  const [admin, setAdmin] = useState(false)
  const [tournamentName, setTournamentName] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { asPath } = useRouter()

  // Initialize anonymous authentication and load persisted tournament name
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            
            // Load saved tournament name from Firestore
            try {
              const userPrefsDoc = await getDoc(
                doc(database, 'userPreferences', currentUser.uid)
              );
              
              if (userPrefsDoc.exists()) {
                const savedTournamentName = userPrefsDoc.data().tournamentName;
                if (savedTournamentName) {
                  setTournamentName(savedTournamentName);
                }
              }
            } catch (error) {
              console.error('Error loading tournament preference:', error);
            }
            
            setIsLoading(false);
          } else {
            // No user, try to sign in anonymously
            try {
              await signInAnonymously(auth);
            } catch (error) {
              console.error('Error signing in anonymously:', error);
              setIsLoading(false);
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error initializing authentication:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Save tournament name to Firestore whenever it changes
  useEffect(() => {
    if (tournamentName && user && !isLoading) {
      const saveTournamentPreference = async () => {
        try {
          await setDoc(
            doc(database, 'userPreferences', user.uid),
            {
              tournamentName: tournamentName,
              lastUpdated: new Date(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error('Error saving tournament preference:', error);
        }
      };

      saveTournamentPreference();
    }
  }, [tournamentName, user, isLoading]);

  return(
    <Context.Provider
      value={{
        user,
        setUser,
        admin,
        setAdmin,
        tournamentName,
        setTournamentName,
        isLoading,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useStateContext = () => useContext(Context);
