// =============================================
//  supabase_config.js
//  CHỈ chứa URL, KEY, headers dùng chung
//  Load ĐẦU TIÊN trong mọi trang HTML
// =============================================

const SUPABASE_URL = 'https://ubqeyizismgjgljtoglx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicWV5aXppc21namdsanRvZ2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTAzNDksImV4cCI6MjA5Nzk2NjM0OX0.mpsNJzDfIX2ZxBryHSA6NmskctgflbVUOFuQhIGb7u8';

const SB_HEADERS = {
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation'
};
