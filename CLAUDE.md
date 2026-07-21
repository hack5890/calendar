# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 명령어

- `npm run dev` — 개발 서버 실행 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드
- `npm run start` — 프로덕션 빌드 실행
- `npm run lint` — ESLint 실행

이 프로젝트에는 테스트 스위트가 구성되어 있지 않습니다.

## 아키텍처

오프라인 우선 캘린더 앱: Next.js App Router + Server Actions 구조이며, SQLite(`better-sqlite3`)가 유일한 데이터 저장소다. 외부 API도, 클라이언트 사이드 데이터 페칭 라이브러리도 없다. 자체 아이디/비밀번호 인증과 캘린더 공유(사용자별 캘린더 + 초대) 기능이 있다.

데이터 흐름:

1. `src/proxy.ts`(Next 16부터 Middleware가 Proxy로 이름이 바뀜, Node.js 런타임에서 실행)가 모든 요청에서 세션 쿠키(`session_token`)를 `db.ts`의 `getSession()`으로 직접 검증해 미인증 사용자를 `/login`으로 리다이렉트한다.
2. `src/app/page.tsx`(서버 컴포넌트)가 `getCurrentUser()`(`src/lib/server/auth.ts`)로 로그인한 사용자를 확인하고, `getMyCalendars()`/`getAllEvents(ownerId)`로 접근 가능한 캘린더 목록과 자기 캘린더의 초기 이벤트를 `Calendar`에 전달한다.
3. `src/components/Calendar.tsx`(클라이언트 컴포넌트)가 현재 보고 있는 캘린더(`selectedOwnerId`)의 이벤트 상태를 로컬에서 관리한다. 변경 작업은 낙관적 업데이트 방식이다: 로컬 상태를 먼저 갱신하고, 그다음 해당 서버 액션(`src/lib/actions.ts`의 `saveEvent`/`deleteEvent`, 둘 다 `(event/id, ownerId)` 형태로 대상 캘린더를 받는다)을 await한다. 서버 액션은 SQLite에 기록한 뒤 `revalidatePath("/")`를 호출한다. 캘린더를 전환하면 `getAllEvents(ownerId)`를 다시 호출해 이벤트를 새로 불러온다.
4. `src/lib/actions.ts`의 모든 캘린더 관련 액션은 `authorizeCalendar(ownerId, "view" | "edit")`로 현재 사용자가 해당 캘린더에 필요한 권한(본인 소유는 항상 edit, 공유받은 경우 `calendar_shares.permission`)을 가졌는지 확인한 뒤에만 DB에 접근한다 — 새로운 캘린더 관련 액션을 추가할 때도 이 권한 체크를 거칠 것.
5. `src/lib/server/db.ts`만이 DB(`data/calendar.db`, WAL 모드)에 직접 접근한다. 스키마 생성, 임시방편적 마이그레이션, CRUD를 모두 여기서 담당한다(`events`, `users`, `sessions`, `calendar_shares` 테이블). `src/lib/actions.ts`는 이를 감싸는 얇은 `"use server"` 래퍼일 뿐이다 — 새로운 변경 작업을 추가할 때도 이 구조(DB 로직은 `db.ts`에, 액션 래퍼·권한 체크·`revalidatePath`는 `actions.ts`에)를 따를 것.
6. 비밀번호는 `src/lib/server/auth.ts`에서 Node의 `crypto.scryptSync`로 해시한다(추가 의존성 없음). 세션은 DB의 `sessions` 테이블 + `httpOnly` 쿠키(30일 만료)로 관리한다.

반복 일정(`src/components/Calendar.tsx`): 발생(occurrence)을 저장하는 별도 테이블은 없다. `CalendarEvent`는 선택적으로 `repeat`(`daily`/`weekly`/`monthly`/`yearly`)와 `repeatUntil`을 가지며, `date` 필드가 반복의 기준일(anchor) 역할을 겸한다. `eventOccursOnDate()`가 현재 화면에 보이는 달의 각 날짜 셀에 대해 해당 이벤트가 그날 발생하는지를 계산한다 — 발생 인스턴스는 절대 실체화되거나 저장되지 않는다. 반복 일정을 수정하거나 삭제하면 기준일(anchor) 이벤트 자체에 적용되므로 시리즈 전체에 영향을 준다. 특정 발생 하나만 예외 처리하는 기능은 없다.

기존 `data/calendar.db` 파일에 대한 스키마 마이그레이션은 마이그레이션 프레임워크 없이 `db.ts`에서 `PRAGMA table_info` 확인 후 `ALTER TABLE ADD COLUMN`을 실행하는 방식으로 임시방편적으로 처리한다 — 새 컬럼을 추가할 때도 이 패턴을 따를 것.

## 자율 진행 원칙

- 되돌릴 수 있는 변경(코드 수정, 새 파일 생성 등 git으로 복구 가능한 것)은
  진행 방식이 여러 개 있어도 네가 판단한 가장 합리적인 방법으로 스스로 결정해서
  바로 실행해. 매 단계 "이렇게 할까요?"라고 묻지 말고, 다 끝난 뒤에 뭘 어떻게
  했는지만 요약해서 보고해.
- 다음 경우에만 멈추고 질문해:
  1. 되돌리기 어려운 작업 (파일/브랜치 삭제, force push, DB 마이그레이션 실제 적용 등)
  2. 요구사항 자체가 모순되거나, 선택에 따라 결과물의 방향이 완전히 달라지는 경우
- 그 외에는 알아서 결정하고 실행하는 걸 우선해.
