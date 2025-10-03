/**
 * Authentication Service
 * Handles role-based authentication and routing
 * Replaces Supabase Auth with custom implementation
 */

import { supabase } from '@/lib/supabase';
import { healthcareService, type HealthcareUser, type AccessContext } from './healthcare-service';
import bcrypt from 'bcryptjs';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  profileData?: any;
}

export interface AuthResponse {
  user: HealthcareUser | null;
  accessContext: AccessContext | null;
  error?: string;
}

export interface SessionData {
  userId: string;
  user: HealthcareUser;
  accessContext: AccessContext;
  expiresAt: number;
}

class AuthService {
  private currentSession: SessionData | null = null;
  private sessionKey = 'healthcare_session';

  constructor() {
    this.loadSession();
  }

  /**
   * Login user with email/password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !user) {
        return {
          user: null,
          accessContext: null,
          error: 'Invalid email or password'
        };
      }

      // Check active status
      if (user.is_active === false) {
        return {
          user: null,
          accessContext: null,
          error: 'Your account is inactive. Please contact support.'
        };
      }

      // Verify password (support password_hash or password for compatibility)
      const storedHash: string | undefined = (user as any).password_hash || (user as any).password;
      let passwordMatch = false;
      if (storedHash && storedHash.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, storedHash);
      } else if (storedHash) {
        passwordMatch = password === storedHash;
      } else {
        passwordMatch = false;
      }
      if (!passwordMatch) {
        return {
          user: null,
          accessContext: null,
          error: 'Invalid email or password'
        };
      }

      // Get access context
      const accessContext = await healthcareService.getAccessContext(user.id);
      if (!accessContext) {
        return {
          user: null,
          accessContext: null,
          error: 'Failed to load user profile'
        };
      }

      // Create session
      const session: SessionData = {
        userId: user.id,
        user: accessContext.user,
        accessContext,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      this.currentSession = session;
      this.saveSession();

      return {
        user: accessContext.user,
        accessContext,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        user: null,
        accessContext: null,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Sign up new user
   */
  async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const { name, email, password, phone, role, profileData } = signupData;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        return {
          user: null,
          accessContext: null,
          error: 'User with this email already exists'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name,
          email: email.toLowerCase(),
          phone,
          role,
          password_hash: passwordHash
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        return {
          user: null,
          accessContext: null,
          error: 'Failed to create user account'
        };
      }

      // Create role-specific profile
      await this.createRoleProfile(newUser.id, role, profileData);

      // Get access context
      const accessContext = await healthcareService.getAccessContext(newUser.id);
      if (!accessContext) {
        return {
          user: null,
          accessContext: null,
          error: 'Failed to load user profile'
        };
      }

      // Create session
      const session: SessionData = {
        userId: newUser.id,
        user: accessContext.user,
        accessContext,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      this.currentSession = session;
      this.saveSession();

      return {
        user: accessContext.user,
        accessContext,
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        user: null,
        accessContext: null,
        error: 'Signup failed. Please try again.'
      };
    }
  }

  /**
   * Create role-specific profile
   */
  private async createRoleProfile(userId: string, role: string, profileData?: any) {
    try {
      if (role === 'patient') {
        await supabase
          .from('patients')
          .insert({
            user_id: userId,
            date_of_birth: profileData?.date_of_birth,
            gender: profileData?.gender,
            address: profileData?.address
          });
      } else if (role === 'doctor') {
        await supabase
          .from('doctors')
          .insert({
            user_id: userId,
            specialty: profileData?.specialty || 'General Practice',
            consultation_fee: profileData?.consultation_fee || 500,
            rating: 0
          });
      } else if (role === 'staff' || role === 'admin') {
        await supabase
          .from('staff')
          .insert({
            user_id: userId,
            position: profileData?.position || (role === 'admin' ? 'Administrator' : 'Staff Member')
          });
      }
    } catch (error) {
      console.error('Error creating role profile:', error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.currentSession = null;
    localStorage.removeItem(this.sessionKey);
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    if (!this.currentSession) {
      return null;
    }

    // Check if session is expired
    if (this.currentSession.expiresAt <= Date.now()) {
      this.logout();
      return null;
    }

    return this.currentSession;
  }

  /**
   * Get current user
   */
  getCurrentUser(): HealthcareUser | null {
    const session = this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Get current access context
   */
  getCurrentContext(): AccessContext | null {
    const session = this.getCurrentSession();
    return session?.accessContext || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Get redirect path based on user role
   */
  getRedirectPath(role: string): string {
    switch (role) {
      case 'patient':
        return '/patient/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  }

  /**
   * Refresh session (get updated user data)
   */
  async refreshSession(): Promise<AuthResponse> {
    const currentSession = this.getCurrentSession();
    if (!currentSession) {
      return {
        user: null,
        accessContext: null,
        error: 'No active session'
      };
    }

    try {
      // Get fresh access context
      const accessContext = await healthcareService.getAccessContext(currentSession.userId);
      if (!accessContext) {
        await this.logout();
        return {
          user: null,
          accessContext: null,
          error: 'Failed to refresh session'
        };
      }

      // Update session
      const session: SessionData = {
        ...currentSession,
        user: accessContext.user,
        accessContext,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Reset expiry
      };

      this.currentSession = session;
      this.saveSession();

      return {
        user: accessContext.user,
        accessContext,
      };
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.logout();
      return {
        user: null,
        accessContext: null,
        error: 'Session refresh failed'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<HealthcareUser>): Promise<AuthResponse> {
    const session = this.getCurrentSession();
    if (!session) {
      return {
        user: null,
        accessContext: null,
        error: 'Not authenticated'
      };
    }

    try {
      // Update user data
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', session.userId)
        .select()
        .single();

      if (updateError) {
        return {
          user: null,
          accessContext: null,
          error: 'Failed to update profile'
        };
      }

      // Refresh session with updated data
      return await this.refreshSession();
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        user: null,
        accessContext: null,
        error: 'Profile update failed'
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const session = this.getCurrentSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Get current user to verify password
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', session.userId)
        .single();

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', session.userId);

      if (updateError) {
        return { success: false, error: 'Failed to update password' };
      }

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Password change failed' };
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.currentSession) {
      try {
        localStorage.setItem(this.sessionKey, JSON.stringify(this.currentSession));
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData) as SessionData;
        
        // Check if session is not expired
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
        } else {
          localStorage.removeItem(this.sessionKey);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      localStorage.removeItem(this.sessionKey);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();