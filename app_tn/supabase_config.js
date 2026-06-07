// =============================================
//  supabase_config.js
//  CHỈ chứa URL, KEY, headers dùng chung
//  Load ĐẦU TIÊN trong mọi trang HTML
// =============================================

const SUPABASE_URL = 'https://pnoaugtrwpsvilcmluqb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBub2F1Z3Ryd3BzdmlsY21sdXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjMzNTcsImV4cCI6MjA5NDczOTM1N30.eHyIitGPJH4k8xgAntkz2RTaHa2wCxxWiG5pf9HpC0Q';

const SB_HEADERS = {
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation'
};
