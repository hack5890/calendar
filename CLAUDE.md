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

오프라인 우선 캘린더 앱: Next.js App Router + Server Actions 구조이며, SQLite(`better-sqlite3`)가 유일한 데이터 저장소다. 외부 API도, 클라이언트 사이드 데이터 페칭 라이브러리도 없다.

데이터 흐름:
1. `src/app/page.tsx`(서버 컴포넌트)가 `getAllEvents()`를 호출해 그 결과를 `initialEvents`로 `Calendar`에 전달한다.
2. `src/components/Calendar.tsx`(클라이언트 컴포넌트)가 모든 이벤트 상태를 로컬에서 관리한다. 변경 작업은 낙관적 업데이트 방식이다: 로컬 상태를 먼저 갱신하고, 그다음 해당 서버 액션(`src/lib/actions.ts`의 `saveEvent`/`deleteEvent`)을 await한다. 서버 액션은 SQLite에 기록한 뒤 `revalidatePath("/")`를 호출한다.
3. `src/lib/server/db.ts`만이 DB(`data/calendar.db`, WAL 모드)에 직접 접근한다. 스키마 생성, 임시방편적 마이그레이션, CRUD를 모두 여기서 담당한다. `src/lib/actions.ts`는 이를 감싸는 얇은 `"use server"` 래퍼일 뿐이다 — 새로운 변경 작업을 추가할 때도 이 구조(DB 로직은 `db.ts`에, 액션 래퍼와 `revalidatePath`는 `actions.ts`에)를 따를 것.

반복 일정(`src/components/Calendar.tsx`): 발생(occurrence)을 저장하는 별도 테이블은 없다. `CalendarEvent`는 선택적으로 `repeat`(`daily`/`weekly`/`monthly`/`yearly`)와 `repeatUntil`을 가지며, `date` 필드가 반복의 기준일(anchor) 역할을 겸한다. `eventOccursOnDate()`가 현재 화면에 보이는 달의 각 날짜 셀에 대해 해당 이벤트가 그날 발생하는지를 계산한다 — 발생 인스턴스는 절대 실체화되거나 저장되지 않는다. 반복 일정을 수정하거나 삭제하면 기준일(anchor) 이벤트 자체에 적용되므로 시리즈 전체에 영향을 준다. 특정 발생 하나만 예외 처리하는 기능은 없다.

기존 `data/calendar.db` 파일에 대한 스키마 마이그레이션은 마이그레이션 프레임워크 없이 `db.ts`에서 `PRAGMA table_info` 확인 후 `ALTER TABLE ADD COLUMN`을 실행하는 방식으로 임시방편적으로 처리한다 — 새 컬럼을 추가할 때도 이 패턴을 따를 것.
