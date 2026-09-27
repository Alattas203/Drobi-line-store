/* Supabase client — shared by global.js and the page scripts as `sb`.
   Only the publishable (public) key belongs here; never a secret key. */
const SUPABASE_URL = "https://cogucqqwqxuzhlyljmlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_CqeNy4cBGaiSIp3azqqGwg_JnLxG-_D";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
