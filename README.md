# Persona Collection Lab

`persona_simulation_research_context.md`의 MVP 방향을 실행 가능한 정적 웹 프로토타입으로 옮긴 버전입니다. v3에서는 자유 프롬프트에서 아기 상태의 초기 latent seed를 만들고, 부모·환경 성장 사건을 거친 뒤 성인기 사건에 투입합니다.

## 실행

실제 문장 임베딩 모델까지 쓰려면 Node 서버로 실행합니다.

```powershell
npm install
npm start
```

그다음 브라우저에서 `http://localhost:8787`을 엽니다. 서버는 `@xenova/transformers`의 `Xenova/all-MiniLM-L6-v2` feature-extraction 모델을 로드하고, `/api/embed`에서 프롬프트 임베딩을 반환합니다. 첫 실행 때 모델 파일을 내려받느라 시간이 걸릴 수 있습니다.

서버 없이 `index.html`을 직접 열어도 실행은 됩니다. 이 경우 프롬프트 해석은 결정적 해시 fallback을 사용합니다.

```powershell
Start-Process .\index.html
```

## 포함 기능

- 고정 세계관 1개: 몰락 직전의 왕국
- 사건 템플릿 5개
- 엔딩 10개
- 자유 프롬프트 입력
- M3 잠재 페르소나 schema 설계 모델
- M1 프롬프트 → 페르소나 해석 모델
- M2 페르소나 → 사건/행동/근거 해석 모델
- 브라우저 내 경량 딥러닝 모델
  - M1 prompt encoder: tanh-linear layer
  - M2 event/action encoder: tanh-linear layer
  - 피드백 로그 기반 action encoder 학습
- 로컬 모델 서버
  - Transformers.js `Xenova/all-MiniLM-L6-v2`
  - 같은 프롬프트는 같은 문장 임베딩에서 출발
  - 서버가 없을 때만 deterministic fallback 사용
- 텍스트 기반 초기 latent persona vector 생성
- M3가 생성한 schema에 따른 가변 차원 latent 표시
- 아기 상태에서 시작하는 성장 시뮬레이션
- 부모·환경·상실·역할 압력에 의한 latent 변화 로그
- 사건·행동 임베딩과 latent vector의 상호작용으로 행동 결정
- 잠재 차원 연결 구조 시각화
- 피드백 버튼을 통한 latent vector 업데이트
- 피드백 반영 후 같은 성인기 사건 재시뮬레이션
- 기존 행동과 재시뮬레이션 행동 비교 카드
- 자동 행동 시뮬레이션
- 결과 카드와 엔딩 카드
- 유저 화면과 관리자 화면 분리
- 가벼운 피드백 버튼
- `localStorage` 로그 저장
- JSON 데이터 내보내기

## 테스트 포인트

- 샘플 버튼으로 캐릭터를 채운 뒤 자동 시뮬레이션 실행
- 성장 로그 `G001~G004`가 먼저 생성되는지 확인
- 서로 다른 캐릭터 2명 이상 실행 후 최근 캐릭터 비교
- 사건 카드의 피드백 버튼 클릭 후 latent vector와 수집 로그 변화 확인
- `피드백 로그로 모델 학습` 버튼으로 loss와 trained steps 변화 확인
- `현재 페르소나로 다시 실행` 버튼으로 행동 변화 비교 확인
- JSON 내보내기로 데이터셋 스냅샷 다운로드
