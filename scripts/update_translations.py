"""Create or merge Sphinx PO catalogs without an extra build dependency."""

import argparse
from datetime import datetime
from pathlib import Path

from babel.messages.catalog import Catalog
from babel.messages.pofile import read_po, write_po


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("templates", type=Path, help="directory containing Sphinx POT files")
    parser.add_argument("catalogs", type=Path, help="target LC_MESSAGES directory")
    args = parser.parse_args()

    templates = args.templates.resolve()
    catalogs = args.catalogs.resolve()
    pot_files = sorted(templates.rglob("*.pot"))
    if not pot_files:
        parser.error(f"No POT files found in {templates}")

    for template_path in pot_files:
        relative_path = template_path.relative_to(templates).with_suffix(".po")
        catalog_path = catalogs / relative_path
        catalog_path.parent.mkdir(parents=True, exist_ok=True)

        with template_path.open("rb") as template_file:
            template = read_po(template_file)

        if catalog_path.exists():
            with catalog_path.open("rb") as catalog_file:
                catalog = read_po(catalog_file, locale="ru")
            catalog.update(template, no_fuzzy_matching=True)
        else:
            catalog = Catalog(locale="ru", domain=relative_path.stem)
            catalog.update(template, no_fuzzy_matching=True)

        catalog.project = "CAVISE"
        catalog.version = "1.0"
        catalog.copyright_holder = "CAVISE Dev Team"
        catalog.msgid_bugs_address = "https://github.com/CAVISE/Documentation/issues"
        catalog.last_translator = "CAVISE Dev Team"
        catalog.language_team = "Russian"
        if catalog.revision_date == "YEAR-MO-DA HO:MI+ZONE":
            catalog.revision_date = datetime.now().astimezone()

        with catalog_path.open("wb") as catalog_file:
            write_po(catalog_file, catalog, width=100, sort_output=True)
        print(catalog_path.relative_to(catalogs))


if __name__ == "__main__":
    main()
