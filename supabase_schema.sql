-- 1. users 테이블 (Supabase Auth와 연동하기 위해 설계)
-- Auth가입 트리거로 생성되거나 수동으로 삽입될 수 있습니다.
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  credit_limit integer DEFAULT 5 NOT NULL,
  credit_used integer DEFAULT 0 NOT NULL,
  is_premium boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. review_cards 테이블
CREATE TABLE public.review_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  original_text text NOT NULL,
  summarized_text text NOT NULL,
  template_style text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. [핵심] 동시성 방어 크레딧 차감 RPC (Stored Procedure)
-- 이 함수는 트랜잭션 내에서 원자적으로 크레딧 한도를 검사하고 차감합니다.
CREATE OR REPLACE FUNCTION use_credit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_credit_limit int;
  v_credit_used int;
  v_is_premium boolean;
BEGIN
  -- 1) 현재 유저의 상태를 배타적 락(FOR UPDATE)으로 조회하여 동시성 문제를 완벽 차단
  SELECT credit_limit, credit_used, is_premium 
  INTO v_credit_limit, v_credit_used, v_is_premium
  FROM public.users 
  WHERE id = user_uuid 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 2) 무제한 프리미엄 유저인 경우 차감 없이 성공 반환
  IF v_is_premium THEN
    RETURN true;
  END IF;

  -- 3) 크레딧 한도 체크
  IF v_credit_used >= v_credit_limit THEN
    -- 크레딧 초과
    RETURN false;
  END IF;

  -- 4) 크레딧 차감 (사용량 1 증가)
  UPDATE public.users 
  SET credit_used = credit_used + 1 
  WHERE id = user_uuid;

  RETURN true;
END;
$$;
