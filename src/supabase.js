import { createClient } from '@supabase/supabase-js';

// .env.local 파일에 적어 둔 주소와 공개용 키를 읽어서
// 데이터베이스와 이야기할 수 있는 "연결 통로"를 하나 만들어요.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
