import { redirect } from "next/navigation";
import Calendar from "@/components/Calendar";
import { getAllEvents, getMyCalendars } from "@/lib/actions";
import { getCurrentUser } from "@/lib/server/auth";

// 앱의 메인 페이지. 로그인한 사용자와 접근 가능한 캘린더 목록, 자기 캘린더의
// 초기 이벤트를 서버에서 불러와 Calendar에 전달한다.
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const calendars = await getMyCalendars();
  const initialEvents = await getAllEvents(user.id);

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <Calendar
        initialEvents={initialEvents}
        calendars={calendars}
        currentUserId={user.id}
        currentUsername={user.username}
      />
    </div>
  );
}
