import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvsolzuihrhjaramaosv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2c29senVpaHJoamFyYW1hb3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzOTAzMTQsImV4cCI6MjA0Nzk2NjMxNH0.fKfVGWwB79zbsaSP_esZsgtrGiL_rMcMoMQhwydQdI0'; // API Key از تنظیمات پروژه

export const supabase = createClient(supabaseUrl, supabaseKey);
