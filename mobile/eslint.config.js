const expoConfig = require("eslint-config-expo/flat");
const { defineConfig, globalIgnores } = require("eslint/config");

module.exports = defineConfig([
  expoConfig,
  globalIgnores(["dist/**", ".expo/**", "expo-env.d.ts"]),
  {
    rules: {
      // 마운트 시 데이터를 불러오는 표준 fetch-on-mount 패턴(CalendarContext, share.tsx 등)에서
      // 걸린다. 의도된 동작이라 리팩터링 대상이 아니므로 error 대신 warn으로 낮춘다.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
