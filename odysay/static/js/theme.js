(() => {
    // Ignore duplicate includes; a click must toggle exactly once.
    if (window.odysayThemeInitialized) return;
    window.odysayThemeInitialized = true;
    const STORAGE_KEY = "odysay-theme";
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    function readSavedTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === "light" || saved === "dark" ? saved : null;
        } catch {
            return null;
        }
    }

    let selectedTheme = readSavedTheme();

    function updateButtons() {
        const isDark = root.dataset.theme === "dark";

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.setAttribute("aria-pressed", String(isDark));
            button.title = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";

            const icon = button.querySelector("[data-theme-icon]");
            if (icon) {
                icon.textContent = isDark ? "☀" : "☾";
            }
        });
    }

    function applyTheme(theme) {
        root.dataset.theme = theme;
        root.dataset.bsTheme = theme;
        root.style.colorScheme = theme;
        updateButtons();
    }

    function applyPreference() {
        applyTheme(
            selectedTheme || (systemTheme.matches ? "dark" : "light")
        );
    }

    // 본문이 표시되기 전에 저장된 테마를 적용합니다.
    applyPreference();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", updateButtons, { once: true });
    } else {
        updateButtons();
    }

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest("[data-theme-toggle]");
        if (!button) return;

        selectedTheme = root.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(selectedTheme);

        try {
            localStorage.setItem(STORAGE_KEY, selectedTheme);
        } catch {
            // 저장이 차단된 환경에서도 현재 화면의 전환은 작동합니다.
        }
    });

    // 사용자가 직접 선택하기 전에는 기기 설정 변경도 반영합니다.
    const onSystemThemeChange = () => {
        if (selectedTheme === null) applyPreference();
    };
    if (systemTheme.addEventListener) {
        systemTheme.addEventListener("change", onSystemThemeChange);
    } else {
        systemTheme.addListener(onSystemThemeChange);
    }

    // 다른 탭에서 변경했을 때도 동기화합니다.
    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY && event.key !== null) return;
        selectedTheme = readSavedTheme();
        applyPreference();
    });
})();
