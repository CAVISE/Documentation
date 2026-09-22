<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/cavise-text-logo-light.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/cavise-text-logo-dark.svg">
  <img
    alt="CAVISE - Connected & Automated Vehicle Integrated Simulation Environment"
    src="./assets/cavise-text-logo-light.svg"
    width="80%"
  >
</picture>

<br />
<br />

[![Web-docs](https://img.shields.io/badge/Docs-Documentation-blue?style=flat&logo=readthedocs)](https://cavise.github.io/Documentation/)

</div>

## Build and preview

Run from this **Documentation repository root** in Linux or Ubuntu under WSL2.
Use Python 3.11 or newer for the pinned Sphinx version. This environment is
independent of the CAVISE simulation containers.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m sphinx -b html -n -W --keep-going source build/html
python scripts/check_links.py build/html
python -m http.server 8000 --bind 127.0.0.1 --directory build/html
```

Open <http://localhost:8000>. Stop the server with `Ctrl+C`.

For automatic rebuilds while editing:

```bash
source .venv/bin/activate
python -m sphinx_autobuild --host 127.0.0.1 --port 8000 source build/html
```

Run either server, not both on the same port. With Task installed and this
environment active, `task html`, `task serve` and `task live` provide the same
workflows. `task linkcheck` checks external links as well. It needs network
access and may report sites that reject automated requests.

## Content conventions

- Keep the first simulation short and complete. Put alternative modes in
  guides and exhaustive flags in the reference pages.
- State the working directory and terminal before each command sequence:
  Linux/WSL host, Windows PowerShell, or a named container.
- Put only OS-specific steps in `sphinx-design` tab sets. Use
  `:sync-group: os` and the `linux` / `windows` sync keys throughout the site.
- Link to the canonical guide instead of copying its complete instructions.
  Preserve published URLs where practical and check raw HTML links after builds.
- Check scenario paths, CLI flags, image targets and attacker IDs against the
  matching component revisions before publishing command examples.
- Keep setup, baseline and attack commands aligned. Document expected outputs
  and distinguish configuration activation from experiment success.

Navigation lives in `source/_nav.rstinc`. `source/conf.py` enables extensions,
and `source/_theme/cavise/static/css/cavise-theme.css` styles the site.
