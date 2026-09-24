(function () {
  const isRussian = (document.documentElement.lang || "").toLowerCase().startsWith("ru");
  const interfaceText = isRussian
    ? { code: "Код", text: "Текст", console: "Консоль", copy: "Копировать", copied: "Скопировано", failed: "Ошибка" }
    : { code: "Code", text: "Text", console: "Console", copy: "Copy", copied: "Copied", failed: "Failed" };

  function syncScrollState() {
    if (!document.body) {
      return;
    }

    document.body.classList.toggle("cavise-scrolled", window.scrollY > 12);
  }

  function formatCompactNumber(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }

    return String(value);
  }

  async function hydrateGitHubStats() {
    const githubBadge = document.querySelector("[data-github-api]");
    if (!githubBadge) {
      return;
    }

    const apiUrl = githubBadge.getAttribute("data-github-api");
    if (!apiUrl) {
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const releaseTarget = githubBadge.querySelector("[data-github-release]");
      const starsTarget = githubBadge.querySelector("[data-github-stars]");
      const forksTarget = githubBadge.querySelector("[data-github-forks]");

      let releaseLabel = null;

      try {
        const releaseResponse = await fetch(`${apiUrl}/releases/latest`, {
          headers: {
            Accept: "application/vnd.github+json",
          },
        });

        if (releaseResponse.ok) {
          const releaseData = await releaseResponse.json();
          releaseLabel = releaseData.tag_name || releaseData.name;
        } else {
          const tagsResponse = await fetch(`${apiUrl}/tags?per_page=1`, {
            headers: {
              Accept: "application/vnd.github+json",
            },
          });

          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            if (Array.isArray(tagsData) && tagsData.length > 0) {
              releaseLabel = tagsData[0].name;
            }
          }
        }
      } catch (_error) {
        // Keep placeholder if the release lookup is unavailable.
      }

      if (releaseTarget && releaseLabel) {
        releaseTarget.textContent = releaseLabel;
      }

      if (starsTarget) {
        starsTarget.textContent = formatCompactNumber(data.stargazers_count);
      }

      if (forksTarget) {
        forksTarget.textContent = formatCompactNumber(data.forks_count);
      }
    } catch (_error) {
      // Keep placeholders if the GitHub API is unavailable.
    }
  }

  function initSidebarToggle() {
    const toggle = document.querySelector("[data-cavise-sidebar-toggle]");
    if (!toggle || !document.body) {
      return;
    }

    // Keep this breakpoint aligned with the mobile rules in cavise-theme.css.
    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    const compactDesktopQuery = window.matchMedia("(max-width: 1280px)");
    const sidebar = document.querySelector(".cavise-sidebar");
    let sidebarOverride = null;

    function syncSidebarState() {
      if (!desktopQuery.matches) {
        document.body.classList.remove("cavise-sidebar-collapsed");
        toggle.setAttribute("aria-expanded", "false");
        sidebar.inert = true;
        return;
      }

      let collapsed = compactDesktopQuery.matches;
      if (sidebarOverride === "open") {
        collapsed = false;
      } else if (sidebarOverride === "closed") {
        collapsed = true;
      }

      document.body.classList.toggle("cavise-sidebar-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      sidebar.inert = collapsed;
    }

    toggle.addEventListener("click", function () {
      if (!desktopQuery.matches) {
        return;
      }

      sidebarOverride = document.body.classList.contains("cavise-sidebar-collapsed")
        ? "open"
        : "closed";
      syncSidebarState();
    });

    function resetSidebarState() {
      sidebarOverride = null;
      syncSidebarState();
    }

    desktopQuery.addEventListener("change", resetSidebarState);
    compactDesktopQuery.addEventListener("change", resetSidebarState);

    syncSidebarState();
  }

  function initMobileNavigation() {
    const toggle = document.querySelector("[data-cavise-mobile-toggle]");
    const sidebar = document.querySelector(".wy-nav-side");
    if (!toggle || !sidebar) {
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 1024px)");
    const background = document.querySelectorAll(".wy-nav-top, .wy-nav-content");
    const closeButton = sidebar.querySelector("[data-cavise-mobile-close]");
    let isOpen = false;
    let scrollPosition = 0;
    sidebar.id = "cavise-mobile-sidebar";
    sidebar.setAttribute("aria-labelledby", "cavise-mobile-sidebar-title");

    function setOpen(open) {
      open = open && mobileQuery.matches;
      if (open && !isOpen) {
        scrollPosition = window.scrollY;
        document.body.style.setProperty("--cavise-scroll-top", `-${scrollPosition}px`);
      }

      document.body.classList.toggle("cavise-mobile-menu-open", open);
      background.forEach((element) => { element.inert = open; });
      toggle.setAttribute("aria-expanded", String(open));

      if (!open && isOpen) {
        document.body.style.removeProperty("--cavise-scroll-top");
        window.scrollTo(0, scrollPosition);
        const target = mobileQuery.matches
          ? toggle
          : document.querySelector("[data-cavise-sidebar-toggle]");
        if (target) {
          target.focus({ preventScroll: true });
        }
      }

      sidebar.inert = !open;
      sidebar.setAttribute("aria-hidden", String(!open));
      if (open) {
        sidebar.setAttribute("role", "dialog");
        sidebar.setAttribute("aria-modal", "true");
        // Move focus after the drawer's visibility change has reached the browser.
        window.setTimeout(() => closeButton.focus({ preventScroll: true }), 0);
      } else {
        sidebar.removeAttribute("role");
        sidebar.removeAttribute("aria-modal");
      }
      isOpen = open;
    }

    toggle.addEventListener("click", () => setOpen(!isOpen));
    document.querySelectorAll("[data-cavise-mobile-close]").forEach((button) => {
      button.addEventListener("click", () => setOpen(false));
    });
    sidebar.addEventListener("click", (event) => {
      // RTD's expand buttons sit inside links and must only expand the tree.
      if (event.target.closest("a") && !event.target.closest("button")) {
        setOpen(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!isOpen) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "Tab") {
        const focusable = Array.from(sidebar.querySelectorAll(
          'a[href], button, input:not([type="hidden"]), [tabindex="0"]',
        )).filter((element) => !element.disabled && element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    mobileQuery.addEventListener("change", () => setOpen(false));
    window.addEventListener("pagehide", () => setOpen(false));
    setOpen(false);
  }

  function formatCodeLanguage(language) {
    const normalized = (language || "").toLowerCase();
    const map = {
      bash: "Bash",
      shell: "Shell",
      sh: "Shell",
      zsh: "Shell",
      python: "Python",
      py: "Python",
      yaml: "YAML",
      yml: "YAML",
      json: "JSON",
      toml: "TOML",
      ini: "INI",
      xml: "XML",
      html: "HTML",
      css: "CSS",
      javascript: "JavaScript",
      js: "JavaScript",
      typescript: "TypeScript",
      ts: "TypeScript",
      cpp: "C++",
      cxx: "C++",
      c: "C",
      cmake: "CMake",
      text: interfaceText.text,
      console: interfaceText.console,
    };

    if (map[normalized]) {
      return map[normalized];
    }

    if (!normalized) {
      return interfaceText.code;
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function initCodeBlocks() {
    const blocks = document.querySelectorAll('.rst-content div[class^="highlight-"]');
    if (!blocks.length) {
      return;
    }

    blocks.forEach((block) => {
      const className = Array.from(block.classList).find((name) =>
        name.startsWith("highlight-"),
      );
      const language = className ? className.replace("highlight-", "") : "code";
      const formattedLanguage = formatCodeLanguage(language);

      if (block.querySelector(".cavise-code-header")) {
        return;
      }

      const pre = block.querySelector("pre");
      if (!pre) {
        return;
      }

      const header = document.createElement("div");
      header.className = "cavise-code-header";

      const languageLabel = document.createElement("span");
      languageLabel.className = "cavise-code-language";
      languageLabel.textContent = formattedLanguage;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "cavise-code-copy";
      button.textContent = interfaceText.copy;

      button.addEventListener("click", async () => {
        try {
          await copyText(pre.innerText);
          button.textContent = interfaceText.copied;
          button.classList.add("is-copied");
          window.setTimeout(() => {
            button.textContent = interfaceText.copy;
            button.classList.remove("is-copied");
          }, 1600);
        } catch (_error) {
          button.textContent = interfaceText.failed;
          window.setTimeout(() => {
            button.textContent = interfaceText.copy;
          }, 1600);
        }
      });

      header.appendChild(languageLabel);
      header.appendChild(button);
      block.insertBefore(header, block.firstChild);
    });
  }

  function initTheme() {
    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });
    initSidebarToggle();
    initMobileNavigation();
    initCodeBlocks();
    hydrateGitHubStats();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme, { once: true });
  } else {
    initTheme();
  }
})();
