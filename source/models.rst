Models and Runtime Assets
=========================

CAVISE stores OpenCOOD checkpoints and AdvCP runtime assets in the separate
`CAVISE/models <https://github.com/CAVISE/models>`_ repository. The repository
is expected at the same level as ``opencda`` and ``opencood``:

.. code-block:: text

   CAVISE/
   ├── opencda/
   ├── opencood/
   └── models/

The models repository does not use Git LFS. Each bundle contains a
``meta.yaml`` file with its ID, kind, source information, artifact sizes, and
SHA-256 checksums. OpenCDA validates this metadata before using a bundle.

On-Demand Downloads
-------------------

Pass a logical bundle ID when cooperative perception is enabled:

.. code-block:: bash

   python opencda.py \
     -t 2cars_2rsu_coperception \
     --with-coperception \
     --model-id pointpillar-late-opv2v-30

OpenCDA first checks ``../models/coperception/<model-id>``. If the bundle is
missing, it logs a warning and creates a partial sparse checkout of
``https://github.com/CAVISE/models.git`` at ``main``. Only the requested bundle
is downloaded. Requesting another model later extends the same sparse checkout
instead of cloning the full repository.

If cloning fails, the requested ID does not exist, or artifact validation
fails, OpenCDA raises a runtime error and does not start the simulation.

The ``.models.lock`` File
-------------------------

An automatic fetch creates ``.models.lock`` next to the models directory. For
the default layout, its path is ``CAVISE/.models.lock``. OpenCDA holds an
advisory ``flock`` on this file while changing the sparse checkout, preventing
two simulation processes from cloning or extending it concurrently.

The file is intentionally empty, may remain after OpenCDA exits, and is ignored
by Git. It does not record model versions. It is not created when a requested
bundle is already available locally and no fetch is needed.

Repository and Checkout Overrides
---------------------------------

Use command-line options to test a fork, branch, tag, or another checkout
location:

.. code-block:: bash

   python opencda.py \
     -t 2cars_2rsu_coperception \
     --with-coperception \
     --model-id pointpillar-late-opv2v-30 \
     --models-repository https://github.com/example/models.git \
     --models-ref feature/new-checkpoint \
     --models-root /tmp/cavise-models

The equivalent environment variables are:

- ``CAVISE_MODELS_ROOT``
- ``CAVISE_MODELS_REPOSITORY``
- ``CAVISE_MODELS_REF``
- ``CAVISE_MODELS_AUTO_FETCH``

Explicit command-line values take precedence over their environment-variable
counterparts.

Offline and Custom Models
-------------------------

Disable network access after populating the required sparse checkout:

.. code-block:: bash

   python opencda.py \
     -t 2cars_2rsu_coperception \
     --with-coperception \
     --model-id pointpillar-late-opv2v-30 \
     --no-auto-fetch-models

The command fails immediately if the selected bundle is not present. Set
``CAVISE_MODELS_AUTO_FETCH=0`` for the same behavior by default.

For an unpacked custom model that is not registered as a bundle, bypass the
models repository:

.. code-block:: bash

   python opencda.py \
     -t 2cars_2rsu_coperception \
     --with-coperception \
     --model-dir /path/to/custom-model

``--model-id`` and ``--model-dir`` are mutually exclusive.

AdvCP Assets
------------

AdvCP resolves its mesh and partition files from an ``advcp`` bundle in the
same repository. The default bundle ID is ``base-car``:

.. code-block:: bash

   python opencda.py \
     -t 3cars_advcp_removal_check \
     --with-coperception \
     --model-id pointpillar-late-opv2v-30 \
     --with-advcp \
     --advcp-config removal_forward \
     --advcp-assets-id base-car

Both the cooperative-perception checkpoint and the AdvCP bundle are resolved
before the simulation starts.

Adding a Bundle
---------------

Create a new directory directly under ``coperception/`` or ``advcp/`` in a
complete models checkout, place the artifacts there, and run:

.. code-block:: bash

   python scripts/generate_metadata.py coperception/my-model \
     --source-repository example/models \
     --source-url https://github.com/example/models \
     --source-license MIT

All three source arguments are required. The generator adds only the new
bundle and checks every artifact SHA-256 against the existing catalog. If the
same file is already registered under another bundle ID, it aborts without
changing metadata.

Validate the repository before opening a pull request:

.. code-block:: bash

   python scripts/validate_metadata.py
   pre-commit run --all-files
