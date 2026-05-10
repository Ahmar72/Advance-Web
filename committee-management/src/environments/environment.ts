// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  supabase: {
    // IMPORTANT: Replace these with your Supabase project credentials
    // Get these from: https://app.supabase.com -> Project Settings -> API
    url: 'https://swdwbvzmgjgaheulldpz.supabase.co', // project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHdidnptZ2pnYWhldWxsZHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTE0MDEsImV4cCI6MjA5MzgyNzQwMX0.fqSsPLFYuKdNZVg9xAm_X3uALq_8k0W1v563VnFitUc', // anon public key
  },
};
