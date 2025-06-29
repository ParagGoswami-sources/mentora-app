import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://tjxduuwnwxuasxkavulv.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeGR1dXdud3h1YXN4a2F2dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzOTc5NDgsImV4cCI6MjA2NTk3Mzk0OH0.dxlJLyUZmWnGU8NgPX4ulcgnpH39tS2f3s5MIXgNJ78";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
