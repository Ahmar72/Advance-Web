import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, data?: Record<string, any>) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: data ? { data } : undefined,
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  /**
   * Sign out current user
   */
  async signOut() {
    return this.supabase.auth.signOut();
  }

  /**
   * Get current user session
   */
  async getSession() {
    return this.supabase.auth.getSession();
  }

  /**
   * Watch for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  /**
   * Insert a record into a table
   */
  async insert(table: string, data: any) {
    return this.supabase.from(table).insert(data).select();
  }

  /**
   * Update a record in a table
   */
  async update(table: string, id: string, data: any) {
    return this.supabase.from(table).update(data).eq('id', id).select();
  }

  /**
   * Select from a table
   */
  async select(table: string, options?: any) {
    let query = this.supabase.from(table).select('*');
    if (options?.filter) {
      query = query.filter(options.filter.key, options.filter.op, options.filter.value);
    }
    return query;
  }

  /**
   * Delete from a table
   */
  async delete(table: string, id: string) {
    return this.supabase.from(table).delete().eq('id', id);
  }
}
