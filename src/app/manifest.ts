import type { MetadataRoute } from "next";

// PWA 매니페스트 정보를 생성한다. 앱 이름, 아이콘, 테마색 등 설치형 앱 메타데이터를 정의한다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Calendar",
    short_name: "Calendar",
    description: "A simple offline-first calendar app",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
