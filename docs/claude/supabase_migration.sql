-- M3 학습 데이터 인프라 + 운영 보안 마이그레이션
-- Supabase SQL Editor에서 실행하세요. 재실행해도 안전합니다.

BEGIN;

-- characters: 프롬프트 임베딩 + latent seed 추가
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS prompt_embedding  float[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS embedding_model   text     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latent_seed       float[]  DEFAULT NULL;

-- simulations: 행동 시퀀스 + latent 궤적 추가
ALTER TABLE simulations
  ADD COLUMN IF NOT EXISTS infant_latent      float[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS final_latent       float[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS event_actions      jsonb    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS development_actions jsonb   DEFAULT NULL;

-- feedback: M3 학습 핵심 입력 컬럼 추가
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS latent_before    float[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latent_after     float[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS action_embedding float[]  DEFAULT NULL;

-- 연구 데이터는 브라우저에서 Supabase로 직접 접근하지 않고 서버 API만 사용한다.
-- 운영 서버는 SUPABASE_SERVICE_ROLE_KEY를 secret으로 보관한다.
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE characters FROM anon, authenticated;
REVOKE ALL ON TABLE simulations FROM anon, authenticated;
REVOKE ALL ON TABLE feedback FROM anon, authenticated;

-- 자주 사용하는 조인/집계 경로 인덱스
CREATE INDEX IF NOT EXISTS simulations_character_id_idx
  ON simulations (character_id);
CREATE INDEX IF NOT EXISTS feedback_character_id_idx
  ON feedback (character_id);
CREATE INDEX IF NOT EXISTS feedback_event_id_idx
  ON feedback (event_id);

-- 기존 데이터가 있어도 마이그레이션 자체는 막지 않도록 NOT VALID로 추가한다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'characters_latent_seed_len'
  ) THEN
    ALTER TABLE characters ADD CONSTRAINT characters_latent_seed_len
      CHECK (latent_seed IS NULL OR cardinality(latent_seed) = 8) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'simulations_infant_latent_len'
  ) THEN
    ALTER TABLE simulations ADD CONSTRAINT simulations_infant_latent_len
      CHECK (infant_latent IS NULL OR cardinality(infant_latent) = 8) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'simulations_final_latent_len'
  ) THEN
    ALTER TABLE simulations ADD CONSTRAINT simulations_final_latent_len
      CHECK (final_latent IS NULL OR cardinality(final_latent) = 8) NOT VALID;
  END IF;
END $$;

COMMIT;
