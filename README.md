# 🪣 나의 버킷리스트 (v2.0 - 개선 버전)

죽기 전에 꼭 해보고 싶은 일들을 작성하고 꾸며서 저장하는 인터랙티브 웹 애플리케이션

## ✨ 주요 개선사항 (v2.0)

### 🔧 코드 품질
- ✅ **유틸리티 모듈화**: `utils.js`로 재사용 가능한 함수 분리
- ✅ **전역 에러 핸들링**: 동기/비동기 에러 자동 캐치
- ✅ **localStorage 안전성 강화**: 용량 체크, 에러 처리, QuotaExceeded 대응
- ✅ **JSDoc 타입 힌트**: 주요 함수에 타입 정보 추가

### 🎨 사용자 경험
- ✅ **실행 취소/다시 실행**: History 패턴으로 최대 50단계 히스토리
- ✅ **키보드 단축키**:
  - `Ctrl+Z`: 실행 취소
  - `Ctrl+Shift+Z` / `Ctrl+Y`: 다시 실행
  - `Ctrl+S`: 수동 저장
- ✅ **에러 알림**: 사용자 친화적 에러 메시지

### 🚀 개발 환경
- ✅ **Vite 빌드 시스템**: 빠른 개발 서버 & 최적화된 프로덕션 빌드
- ✅ **ESLint + Prettier**: 코드 품질 및 일관성 유지
- ✅ **Vitest**: 단위 테스트 프레임워크
- ✅ **ES6 모듈**: import/export 문법 사용

---

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 자동 실행

### 3. 프로덕션 빌드
```bash
npm run build
```
→ `dist/` 폴더에 최적화된 파일 생성

### 4. 빌드 결과 미리보기
```bash
npm run preview
```
→ http://localhost:4173 에서 확인

---

## 🛠️ 개발 도구

### 코드 품질 검사
```bash
npm run lint          # ESLint 실행
npm run format        # Prettier로 코드 포맷팅
```

### 테스트
```bash
npm run test          # 단위 테스트 실행
npm run test:ui       # Vitest UI로 테스트
```

---

## 📁 파일 구조

```
bucket-list2/
├── index.html          # 메인 HTML (시맨틱 마크업, ARIA)
├── style.css           # 스타일시트 (2,268줄, WCAG AA 준수)
├── app.js              # 기존 애플리케이션 로직
├── app-improved.js     # 개선된 애플리케이션 로직 ⭐ NEW
├── utils.js            # 유틸리티 함수 모듈 ⭐ NEW
│
├── package.json        # 프로젝트 설정 ⭐ NEW
├── vite.config.js      # Vite 설정 ⭐ NEW
├── .eslintrc.json      # ESLint 설정 ⭐ NEW
├── .prettierrc         # Prettier 설정 ⭐ NEW
├── .gitignore          # Git 무시 파일 ⭐ NEW
│
└── README.md           # 이 파일
```

---

## 🎯 주요 기능

### 1. 4단계 사용자 플로우
- **Step 1**: 시작 화면 (애니메이션 소개)
- **Step 2**: 이름 입력 (유효성 검사)
- **Step 3**: 버킷리스트 작성 (3개 기본 카테고리 + 커스텀 추가)
- **Step 4**: 결과 커스터마이징 & 저장

### 2. 커스터마이징 시스템
- **테마**: 6종 (기본, 봄꽃, 바다, 숲속, 노을, 밤하늘)
- **패턴**: 6종 (없음, 점무늬, 줄무늬, 격자, 물결, 컨페티)
- **폰트**: 4종 (기본, 손글씨, 귀여운, 동글동글)
- **프레임**: 5종 (모던, 둥근, 티켓, 폴라로이드, 우표)
- **스티커**: 20종 + 드래그 앤 드롭
- **추천 프리셋**: 5종 (로맨틱, 모험가, 자연친화, 몽환적, 따뜻한)

### 3. 데이터 관리
- **자동 저장**: 1초 디바운스 + beforeunload 이벤트
- **localStorage**: 용량 체크, 에러 처리
- **실행 취소/다시 실행**: 최대 50단계 히스토리

---

## 🌟 utils.js 유틸리티 함수

### 함수형
- `debounce()`: 함수 실행 지연
- `throttle()`: 함수 실행 빈도 제한
- `memoize()`: 결과 캐싱

### 보안
- `sanitize()`: XSS 공격 방지
- `createSafeHTML()`: 안전한 HTML 렌더링

### 스토리지
- `storage.set()`: 에러 처리 & 용량 체크
- `storage.get()`: 안전한 데이터 불러오기
- `storage.isAvailable()`: localStorage 사용 가능 여부

### 날짜
- `formatDate()`: 한국어 날짜 포맷
- `getRelativeTime()`: 상대 시간 표시 (몇 분 전)

### DOM
- `isInViewport()`: 요소 뷰포트 확인
- `smoothScrollTo()`: 부드러운 스크롤

### 검증
- `isValidEmail()`: 이메일 형식 검증
- `isValidURL()`: URL 형식 검증
- `isEmpty()`: 빈 값 확인

### 배열
- `chunk()`: 배열 나누기
- `unique()`: 중복 제거
- `shuffle()`: 배열 셔플

### 에러 처리
- `logError()`: 에러 로깅 (컨텍스트 포함)
- `to()`: Promise 에러 안전 처리

### 기타
- `generateId()`: 랜덤 ID 생성
- `deepClone()`: 객체 깊은 복사
- `sleep()`: async/await용 대기 함수

---

## ♿ 접근성 (WCAG 2.1 AA 준수)

- **대비율**: 4.5:1 이상 (모든 테마)
- **포커스 링**: 3px solid, 2px offset
- **ARIA 레이블**: 모든 인터랙티브 요소
- **키보드 내비게이션**: Enter, Tab, Esc 지원
- **모션 감소**: prefers-reduced-motion
- **고대비 모드**: prefers-contrast: high
- **스크린 리더**: role, aria-label 완벽 지원

---

## 🔒 보안

- **XSS 방지**: 모든 사용자 입력 새니타이즈
- **CSP 권장**: Content Security Policy 헤더 추가 권장
- **HTTPS**: 프로덕션 배포 시 필수

---

## 🚀 배포

### Netlify (권장)
```bash
npm run build
# dist/ 폴더를 Netlify에 드래그 앤 드롭
```

### GitHub Pages
```bash
npm run build
# dist/ 폴더를 gh-pages 브랜치에 푸시
```

### Vercel
```bash
vercel --prod
```

---

## 📝 변경 이력

### v2.0.0 (2026-01-29)
- ✨ 유틸리티 함수 모듈화 (`utils.js`)
- 🛡️ 전역 에러 핸들링 시스템
- 💾 localStorage 안전성 강화
- ⏮️ 실행 취소/다시 실행 기능
- ⚡ Vite 빌드 시스템 도입
- 🧪 Vitest 테스트 환경 구축
- 📖 JSDoc 타입 힌트 추가
- ⌨️ 키보드 단축키 추가

### v1.0.0
- 🎉 초기 릴리스
- 기본 버킷리스트 작성 기능
- 커스터마이징 시스템
- 자동 저장 기능

---

## 🤝 기여

버그 리포트, 기능 제안, Pull Request 환영합니다!

---

## 📄 라이선스

MIT License

---

## 🙏 감사의 말

- [html2canvas](https://html2canvas.hertzen.com/) - 이미지 저장 기능
- [Vite](https://vitejs.dev/) - 빠른 빌드 도구
- [Google Fonts](https://fonts.google.com/) - 한글 폰트

---

**Made with ❤️**
