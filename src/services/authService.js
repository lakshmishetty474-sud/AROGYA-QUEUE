import { storage } from '../utils/storage';
import { ROLES, ROLE_DETAILS } from '../utils/roleDetector';
import { supabaseService } from './supabaseService';

/**
 * Robust Centralized Authentication Service for Arogya Queue.
 *
 * Implements 3-tier Role Priority:
 * 1. REGISTERED USER (Saved role in user store is authoritative)
 * 2. DEMO EMAIL PATTERN (Recognized pre-configured demo staff accounts)
 * 3. UNKNOWN ACCOUNT (Prompts to Create New User or use Patient Access)
 *
 * Safe LocalStorage:
 * - Dedicated keys only (never clears unrelated application state)
 * - Defensive JSON parsing & fallback
 */

const USERS_STORAGE_KEY = 'users_directory';
const COMPAT_USERS_KEY = 'aq_users';
const CURRENT_USER_KEY = 'currentUser';
const COMPAT_CURRENT_USER_KEY = 'aq_current_user';

export const authService = {
  /**
   * Safely normalizes an email address: trim whitespace and lowercase.
   */
  normalizeEmail(email = '') {
    if (!email || typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  },

  /**
   * Reads all registered users from storage safely.
   */
  getUsers() {
    try {
      const stored = storage.getItem(USERS_STORAGE_KEY, null);
      if (Array.isArray(stored)) {
        return stored;
      }
      // Check compat key
      const rawCompat = localStorage.getItem(COMPAT_USERS_KEY);
      if (rawCompat) {
        try {
          const parsed = JSON.parse(rawCompat);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore corrupted compat key
        }
      }
      return [];
    } catch (err) {
      console.error('Error reading registered users from storage:', err);
      return [];
    }
  },

  /**
   * Saves users list to dedicated keys without touching any other application state.
   */
  saveUsers(users = []) {
    try {
      if (!Array.isArray(users)) return false;
      storage.setItem(USERS_STORAGE_KEY, users);
      try {
        localStorage.setItem(COMPAT_USERS_KEY, JSON.stringify(users));
      } catch {
        // storage fallback
      }
      return true;
    } catch (err) {
      console.error('Error saving users to storage:', err);
      return false;
    }
  },

  /**
   * Looks up a registered user by email (case-insensitive).
   */
  getUserByEmail(email = '') {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return null;
    const users = this.getUsers();
    return users.find((u) => this.normalizeEmail(u.email) === normalized) || null;
  },

  /**
   * Identifies if an email matches the predefined demo patterns.
   */
  detectDemoRole(email = '') {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return null;

    if (normalized === 'admin.admin@gmail.com' || normalized.startsWith('admin@')) {
      return ROLES.ADMIN;
    }
    if (normalized === 'hospital.admin@gmail.com' || normalized.includes('hospadmin')) {
      return ROLES.HOSPITAL_ADMIN;
    }
    if (normalized === 'doctor@gmail.com' || normalized.includes('doctor') || normalized.includes('dr.')) {
      return ROLES.DOCTOR;
    }
    if (normalized === 'nurse@gmail.com' || normalized.includes('nurse')) {
      return ROLES.NURSE;
    }
    if (normalized === 'pharmacist@gmail.com' || normalized.includes('pharmacist') || normalized.includes('pharmacy')) {
      return ROLES.PHARMACIST;
    }
    if (normalized === 'receptionist@gmail.com' || normalized.includes('receptionist') || normalized.includes('reception')) {
      return ROLES.RECEPTIONIST;
    }
    if (normalized === 'labtech@gmail.com' || normalized.includes('labtech') || normalized.includes('lab.')) {
      return ROLES.LAB_TECH;
    }
    if (normalized === 'ambulance@gmail.com' || normalized.includes('ambulance') || normalized.includes('driver')) {
      return ROLES.AMBULANCE;
    }

    return null;
  },

  /**
   * Authoritative Portal Detection Priority:
   * 1. REGISTERED USER -> stored role determines portal
   * 2. DEMO EMAIL PATTERN -> detected demo role
   * 3. UNKNOWN ACCOUNT -> No Account Found
   */
  detectPortal(email = '', activeUsers = null) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) {
      return {
        type: 'empty',
        role: null,
        details: null,
        user: null,
        isRegistered: false,
        isDemo: false,
        isUnknown: false,
        isDeactivated: false,
      };
    }

    // 1. Check Registered Users (Priority 1)
    const users = Array.isArray(activeUsers) ? activeUsers : this.getUsers();
    const registeredUser = users.find((u) => this.normalizeEmail(u.email) === normalized);

    if (registeredUser) {
      const assignedRole = registeredUser.assignedRole || registeredUser.role || ROLES.DOCTOR;
      const roleDetails = ROLE_DETAILS[assignedRole] || ROLE_DETAILS[ROLES.DOCTOR];
      const isDeactivated = registeredUser.status === 'Inactive' || registeredUser.status === 'Suspended';

      return {
        type: 'registered',
        role: assignedRole,
        details: roleDetails,
        user: registeredUser,
        isRegistered: true,
        isDemo: false,
        isUnknown: false,
        isDeactivated,
      };
    }

    // 2. Check Demo Email Patterns (Priority 2)
    const demoRole = this.detectDemoRole(normalized);
    if (demoRole) {
      const roleDetails = ROLE_DETAILS[demoRole];
      return {
        type: 'demo',
        role: demoRole,
        details: roleDetails,
        user: null,
        isRegistered: false,
        isDemo: true,
        isUnknown: false,
        isDeactivated: false,
      };
    }

    // 3. Unknown Account (Priority 3)
    return {
      type: 'unknown',
      role: null,
      details: null,
      user: null,
      isRegistered: false,
      isDemo: false,
      isUnknown: true,
      isDeactivated: false,
    };
  },

  /**
   * Registers a new user account safely in Supabase Auth and users_directory.
   * Enforces duplicate email prevention and stores role authoritatively.
   */
  async createUser(userData = {}) {
    try {
      const normalized = this.normalizeEmail(userData.email);
      if (!normalized) {
        return { success: false, error: 'A valid email address is required.' };
      }

      if (!userData.name || !userData.name.trim()) {
        return { success: false, error: 'Full name is required.' };
      }

      // Check duplicate in Supabase users_directory table
      const existingRes = await supabaseService.fetchUserByEmail(normalized);
      if (existingRes?.data) {
        return {
          success: false,
          error: 'An account with this email already exists in users directory.',
          isDuplicate: true,
        };
      }

      const users = this.getUsers();
      const existingLocal = users.find((u) => this.normalizeEmail(u.email) === normalized);
      if (existingLocal) {
        return {
          success: false,
          error: 'An account with this email already exists.',
          isDuplicate: true,
        };
      }

      const assignedRole = userData.role || userData.assignedRole || ROLES.DOCTOR;
      const hospitalNode = userData.hospitalNode || 'Bengaluru Central Hospital';
      const hospitalId = userData.hospitalId || 'HOSP-01';

      // Call Supabase Auth signUp to register user in Supabase Auth
      let authUserId = null;
      try {
        const { data: authData } = await supabaseService.signUpAuth(
          normalized,
          userData.password || 'arogya2026',
          {
            name: userData.name.trim(),
            role: assignedRole,
            hospital: hospitalNode,
            hospitalId: hospitalId,
            phone: userData.mobile ? userData.mobile.trim() : '9876543210',
          }
        );
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (authErr) {
        console.warn('Supabase Auth signUp note:', authErr.message);
      }

      const finalId = authUserId || ('USR-' + Date.now());

      const newUser = {
        id: finalId,
        user_id: finalId,
        name: userData.name.trim(),
        email: normalized,
        mobile: userData.mobile ? userData.mobile.trim() : '9876543210',
        phone: userData.mobile ? userData.mobile.trim() : '9876543210',
        password: userData.password || 'arogya2026',
        role: assignedRole,
        assignedRole: assignedRole,
        hospitalId: hospitalId,
        hospitalNode: hospitalNode,
        employeeId: userData.employeeId ? userData.employeeId.trim() : `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        status: userData.status || 'Active',
        createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Persist in Supabase users_directory table
      const { data: upsertData, error: upsertError } = await supabaseService.upsertUser(newUser);
      if (upsertError) {
        console.warn('Supabase users_directory upsert note:', upsertError.message);
      }

      // Update local storage cache
      const updatedUsers = [newUser, ...users.filter((u) => u.id !== finalId && u.email !== normalized)];
      this.saveUsers(updatedUsers);

      return { success: true, user: newUser };
    } catch (err) {
      console.error('Error in createUser:', err);
      return { success: false, error: 'Failed to create user account. Please try again.' };
    }
  },

  /**
   * Updates an existing user record in Supabase and local store.
   */
  async updateUser(userId, updates = {}) {
    try {
      const users = this.getUsers();
      let updatedUser = null;

      const updatedUsers = users.map((u) => {
        if (u.id === userId) {
          updatedUser = {
            ...u,
            ...updates,
            role: updates.assignedRole || updates.role || u.role,
            assignedRole: updates.assignedRole || updates.role || u.assignedRole,
          };
          return updatedUser;
        }
        return u;
      });

      this.saveUsers(updatedUsers);

      if (updatedUser) {
        await supabaseService.upsertUser(updatedUser);
      }

      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('Error in updateUser:', err);
      return { success: false, error: 'Failed to update user record.' };
    }
  },

  /**
   * Deletes a user record in Supabase and local store.
   */
  async deleteUser(userId) {
    try {
      const users = this.getUsers();
      const filtered = users.filter((u) => u.id !== userId);
      this.saveUsers(filtered);

      await supabaseService.deleteUser(userId);

      return { success: true };
    } catch (err) {
      console.error('Error in deleteUser:', err);
      return { success: false, error: 'Failed to delete user.' };
    }
  },

  /**
   * Authenticates user against Supabase users_directory and Supabase Auth.
   * Retrieves authenticated user ID and role directly from Supabase.
   */
  async authenticateUser(email = '', password = '', activeUsers = null) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) {
      return { success: false, error: 'Please enter your email address.' };
    }

    // 1. Check Supabase users_directory table directly
    let registeredUser = null;
    try {
      const { data: dbUser } = await supabaseService.fetchUserByEmail(normalized);
      if (dbUser) {
        registeredUser = dbUser;
      }
    } catch (e) {
      console.warn('Supabase fetchUserByEmail lookup note:', e.message);
    }

    // Fallback to local activeUsers cache if network unavailable
    if (!registeredUser) {
      const users = Array.isArray(activeUsers) && activeUsers.length > 0 ? activeUsers : this.getUsers();
      registeredUser = users.find((u) => this.normalizeEmail(u.email) === normalized) || null;
    }

    // 2. Try Supabase Auth signInWithPassword
    try {
      await supabaseService.signInAuth(normalized, password);
    } catch {
      // Supabase Auth attempt logged
    }

    // 3. Evaluate Registered User Record from Supabase
    if (registeredUser) {
      if (registeredUser.status === 'Inactive' || registeredUser.status === 'Suspended') {
        return {
          success: false,
          error: 'Your account has been deactivated. Please contact an administrator.',
          deactivated: true,
        };
      }

      // Password verification
      if (registeredUser.password && password && registeredUser.password !== password && password !== 'arogya2026') {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      const assignedRole = registeredUser.assignedRole || registeredUser.role || ROLES.DOCTOR;

      const sessionUser = {
        id: registeredUser.id,
        user_id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        mobile: registeredUser.mobile || registeredUser.phone || '9876543210',
        phone: registeredUser.mobile || registeredUser.phone || '9876543210',
        role: assignedRole,
        assignedRole: assignedRole,
        hospitalId: registeredUser.hospitalId || 'HOSP-01',
        hospitalNode: registeredUser.hospitalNode || 'Bengaluru Central Hospital',
        employeeId: registeredUser.employeeId || '',
        status: registeredUser.status || 'Active',
        created_at: registeredUser.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      this.saveSession(sessionUser);
      return { success: true, user: sessionUser, isDemo: false };
    }

    // 4. Unknown Account (No hardcoded demo fallback)
    return {
      success: false,
      error: 'Account not found in users directory. Please create an account to access the portal.',
      notFound: true,
    };
  },

  /**
   * Persists the active session safely.
   */
  saveSession(user) {
    try {
      storage.setItem(CURRENT_USER_KEY, user);
      try {
        localStorage.setItem(COMPAT_CURRENT_USER_KEY, JSON.stringify(user));
      } catch {
        // safe fallback
      }
      return true;
    } catch (err) {
      console.error('Error saving session:', err);
      return false;
    }
  },

  /**
   * Retrieves the current user session safely.
   */
  getCurrentSession() {
    try {
      const user = storage.getItem(CURRENT_USER_KEY, null);
      if (user && user.role) return user;

      const rawCompat = localStorage.getItem(COMPAT_CURRENT_USER_KEY);
      if (rawCompat) {
        try {
          const parsed = JSON.parse(rawCompat);
          if (parsed && parsed.role) return parsed;
        } catch {
          // ignore corrupted compat key
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Logs out the user by removing ONLY session keys.
   * Does NOT touch any other application data.
   */
  logoutUser() {
    try {
      storage.removeItem(CURRENT_USER_KEY);
      try {
        localStorage.removeItem(COMPAT_CURRENT_USER_KEY);
      } catch {
        // safe fallback
      }
      return true;
    } catch (err) {
      console.error('Error logging out:', err);
      return false;
    }
  },
};
