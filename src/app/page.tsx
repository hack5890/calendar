import Calendar from "@/components/Calendar";
import { getAllEvents } from "@/lib/actions";

// 앱의 메인 페이지. 서버에서 초기 이벤트 목록을 불러와 Calendar에 전달한다.
export default async function Home() {
  const initialEvents = await getAllEvents();
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <Calendar initialEvents={initialEvents} />
    </div>
  );
}
