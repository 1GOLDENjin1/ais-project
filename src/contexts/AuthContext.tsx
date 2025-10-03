import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { generateUUID } from '@/utils/browser-crypto';

export type UserRole = 'doctor' | 'staff' | 'admin' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  signup: (userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading to prevent redirect flicker

  // Check for existing Supabase session on app start
  useEffect(() => {
    const getSession = async () => {
      console.log('🔄 Checking authentication session...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ Found Supabase session');
          // Load user profile from Supabase session
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const userData: User = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              phone: profile.phone
            };
            
            console.log(`✅ User authenticated via Supabase: ${userData.name} (${userData.role})`);
            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          }
        } else {
          console.log('⚠️ No Supabase session, checking localStorage...');
          // Fallback: check localStorage for database auth session
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              const userData: User = JSON.parse(storedUser);
              
              // Verify user still exists in database
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', userData.id)
                .single();
              
              if (profile) {
                // No RLS policies needed - using application layer security
                console.log(`✅ Session restored from localStorage: ${profile.name} (${profile.role})`);
                
                const restoredUserData: User = {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                  role: profile.role,
                  phone: profile.phone
                };
                
                setUser(restoredUserData);
              } else {
                console.warn('❌ User not found in database, clearing localStorage');
                localStorage.removeItem('currentUser');
                setUser(null);
              }
            } catch (error) {
              console.warn('❌ Could not restore session from localStorage:', error);
              localStorage.removeItem('currentUser');
              setUser(null);
            }
          } else {
            console.log('ℹ️ No stored session found');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('✅ Authentication check completed');
      }
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            phone: profile.phone
          };
          
          // No RLS policies - using application layer security
          
          setUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('currentUser');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User }> => {
    if (isLoading || user) {
      console.log('🚫 Login attempt blocked - already authenticating or logged in');
      return { success: !!user, user };
    }
    
    setIsLoading(true);
    
    try {
      // First, check if user exists in our database
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userRecord) {
        console.error('User not found:', userError);
        setIsLoading(false);
        return { success: false };
      }

      // Block login if user is inactive
      if (userRecord.is_active === false) {
        console.error('User account is inactive');
        setIsLoading(false);
        return { success: false };
      }

      // Verify password (check if it's hashed or plain text)
      let passwordMatch = false;
      if (typeof userRecord.password === 'string' && userRecord.password.startsWith('$2')) {
        // Password is hashed with bcrypt
        passwordMatch = await bcrypt.compare(password, userRecord.password);
      } else {
        // Password is stored in plain text (fallback)
        passwordMatch = password === userRecord.password;
      }

      if (!passwordMatch) {
        console.error('Invalid password');
        setIsLoading(false);
        return { success: false };
      }

      // Skip Supabase Auth for now - using custom database authentication
      // This prevents the 400 Bad Request error from Supabase Auth
      console.log('✅ Authenticating user:', email.replace(/(.{3}).*(@.*)/, '$1***$2'));

      // Create user object from database record
      const user: User = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        phone: userRecord.phone
      };

      // No RLS policies - using application layer security

      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setIsLoading(false);
      return { success: true, user };
      
    } catch (error) {
      console.error('Login error:', error);
    }
    
    setIsLoading(false);
    return { success: false };
  };

  const signup = async (userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
  }): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.error('Email already exists');
        setIsLoading(false);
        return false;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Generate UUID for the user
      const userId = generateUUID();

      // Create user profile in database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          role: userData.role,
          password: hashedPassword,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setIsLoading(false);
        return false;
      }

      // Create role-specific records
      if (userData.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: userId,
            date_of_birth: null,
            gender: null,
            address: null
          });
        
        if (patientError) {
          console.error('Patient record creation error:', patientError);
        }
      } else if (userData.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            user_id: userId,
            specialty: 'General Medicine',
            consultation_fee: 1500.00,
            rating: 0.0
          });
        
        if (doctorError) {
          console.error('Doctor record creation error:', doctorError);
        }
      } else if (userData.role === 'staff') {
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            user_id: userId,
            position: 'Staff Member'
          });
        
        if (staffError) {
          console.error('Staff record creation error:', staffError);
        }
      }

      // Try to create Supabase Auth user (optional for session management)
      try {
        await supabase.auth.signUp({
          email: userData.email,
          password: userData.password
        });
      } catch (authError) {
        console.log('Supabase auth creation failed, but user created in database');
      }
        
      setIsLoading(false);
      return true;
      
    } catch (error) {
      console.error('Signup error:', error);
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    console.log('🔴 Logout function called');
    
    // Set a timeout as fallback to ensure redirect happens
    const fallbackTimeout = setTimeout(() => {
      console.log('⏰ Fallback timeout triggered, forcing redirect');
      window.location.href = '/login';
    }, 2000);
    
    try {
      console.log('🔄 Signing out from Supabase...');
      await supabase.auth.signOut();
      console.log('✅ Supabase sign out successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
    
    console.log('🧹 Clearing user state and localStorage...');
    setUser(null);
    localStorage.removeItem('currentUser');
    
    // Clear any existing auth tokens/sessions
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🔀 Redirecting to login page...');
    clearTimeout(fallbackTimeout);
    
    // Multiple redirect attempts to ensure it works
    try {
      window.location.replace('/login');
    } catch (replaceError) {
      console.error('Replace failed, trying href:', replaceError);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};