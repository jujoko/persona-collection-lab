-- M3 학습 데이터 인프라 마이그레이션
-- Supabase SQL Editor에서 실행하세요.

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
