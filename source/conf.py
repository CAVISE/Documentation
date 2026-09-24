import os

# Configuration file for the Sphinx documentation builder.

project = "CAVISE"
copyright = "2026, CAVISE Dev Team"
author = "CAVISE Dev Team"
release = "1.0"

# Build the English site at the publication root and the Russian translation
# under /ru/. Taskfile.yml and the Pages workflow set DOCS_LANGUAGE for the
# translated build.
language = os.environ.get("DOCS_LANGUAGE", "en")
docs_languages = [
    item.strip()
    for item in os.environ.get("DOCS_LANGUAGES", "en,ru").split(",")
    if item.strip()
]
docs_default_language = os.environ.get("DOCS_DEFAULT_LANGUAGE", "en")
locale_dirs = ["locale/"]
gettext_compact = False
gettext_additional_targets = ["raw", "image"]

html_logo = "_static/images/logo.svg"
html_favicon = "_static/images/favicon.svg"
html_title = "Документация CAVISE" if language == "ru" else "CAVISE Documentation"
html_short_title = "Документация CAVISE" if language == "ru" else "CAVISE Docs"

extensions = ["sphinx_design"]
pygments_style = "monokai"

templates_path = ["_templates"]
exclude_patterns = []

html_theme = "cavise"
html_theme_path = [os.path.join(os.path.dirname(__file__), "_theme")]
html_static_path = ["_static"]
html_js_files = ["js/cavise-theme.js"]
html_permalinks = False
html_context = {
    "docs_language": language,
    "docs_languages": docs_languages,
    "docs_default_language": docs_default_language,
    "github_repo_name": "CAVISE/CAVISE",
    "github_repo_url": "https://github.com/CAVISE/CAVISE",
    "github_repo_api": "https://api.github.com/repos/CAVISE/CAVISE",
}

html_theme_options = {
    "logo_only": True,
    "collapse_navigation": False,
    "navigation_depth": 4,
    "titles_only": True,
    "style_external_links": True,
    "style_nav_header_background": "#0c1224",
    "sticky_navigation": True,
}
