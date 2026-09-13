"""Check local links, assets and fragments in a built Sphinx HTML site."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("name"):
            self.ids.add(attrs["name"])
        for attribute in ("href", "src", "action"):
            if attrs.get(attribute):
                self.links.append(attrs[attribute])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path, nargs="?", default=Path("build/html"))
    args = parser.parse_args()
    site = args.site.resolve()
    pages = {}
    for path in site.rglob("*.html"):
        page = PageParser()
        page.feed(path.read_text(encoding="utf-8"))
        pages[path] = page
    if not pages:
        parser.error(f"No HTML pages in {site}; build the site first.")

    errors = []
    checked = 0
    for path, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            checked += 1
            url_path = unquote(url.path)
            if url_path.startswith("/"):
                target = (site / url_path.lstrip("/")).resolve()
            elif url_path:
                target = (path.parent / url_path).resolve()
            else:
                target = path
            if target.is_dir():
                target /= "index.html"
            error = None
            if not target.is_relative_to(site):
                error = "outside site"
            elif not target.is_file():
                error = "missing file"
            elif url.fragment and target in pages:
                fragment = unquote(url.fragment)
                # Sphinx uses '#' as a top-of-page link, which has no fragment.
                if fragment not in pages[target].ids:
                    error = "missing anchor"
            if error:
                errors.append(f"{path.relative_to(site)}: {link} ({error})")
    for error in sorted(set(errors)):
        print(error)
    if errors:
        raise SystemExit(1)
    print(f"Checked {checked} local references across {len(pages)} HTML pages.")


if __name__ == "__main__":
    main()
