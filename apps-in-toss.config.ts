import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "pension-alarm",
  brand: {
    primaryColor: "#1E7F5C", // 연금복권 용지의 초록 톤
  },
  permissions: [],
  webBundleDir: "dist",
  // 토스 네이티브 상단 바: 뒤로가기 버튼 사용 (graniteEvent.backEvent 로 연결)
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
  },
});
