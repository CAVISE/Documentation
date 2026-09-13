Development Setup
=================

Run development checks in the component repository you are changing.
They are separate from the environment needed to run a simulation.

The OpenCDA repository uses ``pre-commit`` to keep formatting and basic checks
consistent before code reaches CI. Run the following commands from the OpenCDA
repository root to install and enable it once per clone. After that, the hooks
run automatically before each commit:

.. code-block:: bash

   python3 -m venv .venv
   source .venv/bin/activate
   python -m pip install pre-commit
   pre-commit install

Run all hooks manually:

.. code-block:: bash

   pre-commit run --all-files

Useful day-to-day commands:

.. code-block:: bash

   # Run only Ruff linting and automatic fixes
   pre-commit run ruff-check --all-files

   # Run only formatting
   pre-commit run ruff-format --all-files

The current hook set includes:

- ``ruff-check`` with automatic fixes enabled
- ``ruff-format``
- ``hadolint`` for the ``Dockerfile``
- common safety and hygiene checks for YAML, JSON, TOML, merge conflicts,
  whitespace, symlinks, and requirements files

CI also runs additional checks such as ``pytest``, ``mypy``, ``deadcode``, and
repository-wide ``pre-commit``. Run the local hooks before opening a pull
request to catch the most common failures early.


Documentation
-------------

See the Documentation repository README for its isolated environment,
strict build, link checker and local preview commands.
