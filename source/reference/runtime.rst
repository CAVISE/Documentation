Runtime Commands and Targets
============================

Use :doc:`/getting-started/first-simulation` for a complete first run. This
page describes command choices and advanced runtime operations.

Repository Setup
----------------

Run ``python setup.py`` in the **CAVISE root**, with its Python environment
active. Omitting repository names selects all five repositories. Omitting a
version opens an interactive branch/tag selection. It does not silently
select ``main``. Existing directories are skipped.

.. list-table::
   :header-rows: 1

   * - Repository
     - Version option
   * - ``opencda``
     - ``-o`` / ``--opencda-version``
   * - ``opencood``
     - ``-O`` / ``--opencood-version``
   * - ``sumo``
     - ``-S`` / ``--sumo-version``
   * - ``artery``
     - ``-a`` / ``--artery-version``
   * - ``scenario-manager``
     - ``-s`` / ``--scenario-manager-version``

For example, clone OpenCDA and OpenCOOD at explicit refs:

.. code-block:: bash

   python setup.py opencda opencood -o main -O main

Container Lifecycle
-------------------

Run ``./run.sh COMMAND [SERVICES...]`` from the **CAVISE root on Linux/WSL**.
Main services are ``carla``, ``opencda``, ``artery`` and ``sumo``. Omitting
services selects all main services, including CARLA on Windows. Prefer an
explicit service list for the experiment you are running.

.. list-table::
   :header-rows: 1

   * - Command
     - Behavior
   * - ``build``
     - Build images. Does not start containers or simulator processes.
   * - ``up``
     - Create/start containers in the background, recreating them when needed.
   * - ``start``
     - Start existing stopped containers. Does not apply image/config changes.
   * - ``stop``
     - Stop containers while retaining them.
   * - ``restart``
     - Restart existing containers. Does not rebuild images.
   * - ``down``
     - Remove containers via Compose. Files outside bind mounts may be lost.

For example:

.. code-block:: bash

   ./run.sh build opencda-coperception
   ./run.sh up opencda-coperception
   ./run.sh stop opencda-coperception
   ./run.sh start opencda-coperception

Only one OpenCDA target can be selected per invocation. All targets use the
same service and container name, ``opencda``. They are not simultaneous
independent containers.

.. _opencda-targets:

OpenCDA Image Targets
---------------------

.. list-table::
   :header-rows: 1
   :widths: 28 12 12 15 33

   * - Target
     - OpenCOOD
     - Protobuf
     - Custom CUDA
     - Use
   * - ``opencda-minimal``
     - No
     - No
     - No
     - Core CARLA/OpenCDA, optionally SUMO.
   * - ``opencda-protobuf``
     - No
     - Yes
     - No
     - Artery without cooperative perception.
   * - ``opencda-coperception``
     - Yes
     - No
     - No
     - Models that do not require custom CUDA extensions.
   * - ``opencda-cuda``
     - Yes
     - No
     - Yes
     - Models requiring custom CUDA extensions, such as FPV-RCNN.
   * - ``opencda``
     - Yes
     - Yes
     - Yes
     - Cooperative perception together with Artery. Default target.

All targets use the CUDA runtime base. CUDA extensions are a separate build
capability, not the switch that enables GPU computation. ``opencda-minimal``
and ``opencda-protobuf`` do not install OpenCOOD.

The default CUDA architecture is ``86``. Set ``CUDA_ARCHITECTURES`` to the
architectures supported by your GPU and the image's CUDA compiler, for example:

.. code-block:: bash

   CUDA_ARCHITECTURES="86;89" ./run.sh build opencda-cuda

Rebuild after changing a Dockerfile or dependencies. Rebuild a Protobuf target
after changing a CAPI ``.proto`` file, and a CUDA target after changing native
OpenCOOD sources. Use ``up`` afterwards: native artifacts are synchronized
into the mounted workspace by the container entrypoint.

Direct Compose Access
---------------------

``run.sh`` normally selects the target, tag, paths and model directory for
you. For direct Compose use, stay in the **CAVISE root** and prepare the model
mount before creating a container:

.. code-block:: bash

   source paths.conf
   mkdir -p "$PATH_TO_MODELS"
   export OPENCDA_BUILD_TARGET=opencda-protobuf
   export OPENCDA_IMAGE_TAG=protobuf
   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf build opencda
   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf up -d opencda

Target suffixes map to image tags ``minimal``, ``protobuf``, ``coperception``
and ``cuda``. The full target uses ``local``. Set both variables consistently.
To inspect the rendered configuration without starting anything:

.. code-block:: bash

   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf config

To remove the entire main Compose project:

.. code-block:: bash

   ./run.sh down

Scenario Manager
----------------

The web scenario manager uses a separate Compose project and is not included
in an unqualified ``run.sh up``. Run it separately:

.. code-block:: bash

   ./run.sh build scenario-manager
   ./run.sh up scenario-manager

Open ``http://localhost`` if the browser does not open automatically. Stop it
with ``./run.sh stop scenario-manager``. Keep these invocations separate from
main simulator services because the wrapper forwards service arguments to
the selected Compose projects.

OpenCDA CLI
-----------

Inside the **OpenCDA container**, run:

.. code-block:: bash

   python opencda.py --help

``-t`` selects a YAML path below ``opencda/scenario_testing/config_yaml``
without its suffix. Nested paths are accepted. ``--carla-host`` defaults to
``carla``. Docker Desktop on Windows uses ``host.docker.internal`` in these
guides. ``--artery-host`` defaults to ``artery:7777``.

Use :doc:`/guides/cosimulation`, :doc:`/guides/cooperative-perception`,
:doc:`/guides/advcp` and :doc:`/guides/results` for complete launch examples.

Artery Frontends
----------------

In the **Artery container**, from ``/workspaces/artery``, select a Qt frontend:

.. code-block:: bash

   ./tools/run_artery.py -l /cached-build/Debug/run-artery.ini -s scenarios/capi -u Qtenv

Use ``-u Cmdenv`` for a terminal frontend. Add ``-c CONFIG_NAME`` to select a
configuration declared by the scenario's ``omnetpp.ini``. Build instructions
and the full startup order are in :doc:`/guides/cosimulation`.
