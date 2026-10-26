import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

const toAuthUser = (user) => {
  if (!user) return null;

  return {
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    uid: user.uid,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(toAuthUser(user));
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const signup = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateFirebaseProfile(credential.user, { displayName });
      setCurrentUser(toAuthUser(credential.user));
    }

    return credential;
  };

  const updateDisplayName = async (displayName) => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to update your name.");
    }

    await updateFirebaseProfile(auth.currentUser, { displayName });
    setCurrentUser(toAuthUser(auth.currentUser));
  };

  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({
      authLoading,
      currentUser,
      login,
      logout,
      signup,
      updateDisplayName,
    }),
    [authLoading, currentUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
};
