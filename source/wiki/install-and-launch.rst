Install And Launch
==================

Install CARLA on Windows
------------------------

1. Download **CARLA** for Windows from the official releases.
2. Optionally move the contents of ``AdditionalMaps_0.9.X`` into
   ``CARLA_0.9.X/WindowsNoEditor``.
3. In ``WindowsNoEditor``, create and activate a Python virtual environment.
   Ensure the Python version matches CARLA requirements.

.. code-block:: powershell

   python -m venv venv
   # or
   py -3.10 -m venv venv
   .\venv\Scripts\activate
   pip install carla==0.9.X numpy psutil py-cpuinfo pygame python-tr

4. Start CARLA from the main directory:

.. code-block:: powershell

   ./CarlaUE4.exe

5. Verify the Python API:

.. code-block:: powershell

   python .\PythonAPI\util\config.py --map Town06

6. CARLA is now ready. When running OpenCDA scenarios from inside the OpenCDA
   container using ``python opencda.py``, specify:

.. code-block:: text

   --carla-host host.docker.internal

Install Dependencies
--------------------

**WSL on Windows**

Ensure WSL is installed. The setup has been tested on WSL2 with Ubuntu
24.04.1 LTS. Docker must also be available inside WSL.

Ensure Python 3.10 or newer is installed, then clone the project and run:

.. code-block:: bash

   python3 -m venv venv
   source ./venv/bin/activate
   pip install -r requirements.txt

**Linux**

Ensure Python 3.10 or newer is installed, then run:

.. code-block:: bash

   python3 -m venv venv
   source ./venv/bin/activate
   pip3 install -r requirements.txt

Install Required Repositories
-----------------------------

Before running the setup script, ensure the base paths are configured:

.. code-block:: bash

   source paths.conf

**Install all repositories**

.. code-block:: bash

   ./setup.py

**Install a specific repository**

Clone only ``opencda``:

.. code-block:: bash

   ./setup.py opencda

Clone only ``artery``:

.. code-block:: bash

   ./setup.py artery

**Install with an explicit version**

You can skip the interactive prompt by specifying a branch or tag directly.

For ``opencda``:

.. code-block:: bash

   ./setup.py -o main

or

.. code-block:: bash

   ./setup.py --opencda-version v0.1.0

For ``artery``:

.. code-block:: bash

   ./setup.py -a develop

or

.. code-block:: bash

   ./setup.py --artery-version v0.1.0

**Install a specific repository with a specific version**

.. code-block:: bash

   ./setup.py opencda -o v0.1.0

.. code-block:: bash

   ./setup.py artery -a develop

**Install both with explicit versions**

.. code-block:: bash

   ./setup.py -o main -a develop

Build And Run The Simulator
---------------------------

**Using ``run.sh`` (Recommended)**

You do not need to manually build or run the CARLA container on Windows.

Build everything:

.. code-block:: bash

   ./run.sh build

Start everything:

.. code-block:: bash

   ./run.sh up

Run specific services:

.. code-block:: bash

   ./run.sh build <service-name>
   ./run.sh up <service-name>
   ./run.sh start <service-name>
   ./run.sh stop <service-name>
   ./run.sh restart <service-name>
   ./run.sh down <service-name>

**Select OpenCDA capabilities**

OpenCDA is available as four image targets. Select the smallest target that
provides the native components required by the scenario.

.. list-table::
   :header-rows: 1
   :widths: 22 12 12 54

   * - Target
     - Protobuf
     - CUDA extensions
     - Use when
   * - ``opencda-minimal``
     - No
     - No
     - The scenario does not communicate with Artery and the selected
       cooperative perception model does not require the custom OpenCOOD CUDA
       extensions.
   * - ``opencda-protobuf``
     - Yes
     - No
     - OpenCDA communicates with Artery through CAPI.
   * - ``opencda-cuda``
     - No
     - Yes
     - The selected cooperative perception model requires the custom OpenCOOD
       CUDA extensions, for example FPV-RCNN.
   * - ``opencda``
     - Yes
     - Yes
     - Both Artery/CAPI and a CUDA-dependent cooperative perception model are
       required.

Cooperative perception does not require the CUDA target by itself. Models
that do not use the custom OpenCOOD CUDA extensions can run with
``opencda-minimal``. Use ``opencda-protobuf`` when the same workload also
communicates with Artery.

Build and start the selected target through ``run.sh``:

.. code-block:: bash

   ./run.sh build opencda-minimal
   ./run.sh up opencda-minimal

Replace ``opencda-minimal`` with ``opencda-protobuf``, ``opencda-cuda``, or
``opencda`` as required. The full ``opencda`` target is the default when no
explicit OpenCDA target is provided.

The same target aliases are accepted by every lifecycle command:

.. code-block:: bash

   ./run.sh stop opencda-protobuf
   ./run.sh start opencda-protobuf
   ./run.sh restart opencda-protobuf
   ./run.sh down opencda-protobuf

CUDA extensions target compute capability ``8.6`` by default. Override the
architecture list when building for other GPUs:

.. code-block:: bash

   CUDA_ARCHITECTURES="75;86;89" ./run.sh build opencda-cuda

Rebuild ``opencda-protobuf`` or ``opencda`` after changing a ``.proto`` file.
Rebuild ``opencda-cuda`` or ``opencda`` after changing a CUDA or C++ extension
source. Generated native artifacts are synchronized into the bind-mounted
OpenCDA workspace when the container starts.

All four targets currently use the CUDA runtime base and install the same
Python dependencies. Selecting a smaller target skips unnecessary native
compilation; it does not create a CPU-only image.

Use ``run.sh`` as the recommended CAVISE interface. It configures the correct
Compose service, build target, image tag, and CUDA architecture arguments.
Docker Compose can also be used directly when lower-level control is needed.

**Using Docker Compose**

Build and start all components:

.. code-block:: bash

   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf build
   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf up -d

Build and start a specific service:

.. code-block:: bash

   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf build <service-name>
   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf up -d <service-name>

Start, stop, or restart an existing service:

.. code-block:: bash

   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf start <service-name>
   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf stop <service-name>
   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf restart <service-name>

Stop and remove the complete Compose project:

.. code-block:: bash

   docker compose -f dc-configs/docker-compose.yml --env-file paths.conf down

When using Docker Compose directly, select an OpenCDA target and its image tag
through environment variables. For example, build and start the Protobuf
variant:

.. code-block:: bash

   OPENCDA_BUILD_TARGET=opencda-protobuf OPENCDA_IMAGE_TAG=protobuf \
     docker compose -f dc-configs/docker-compose.yml --env-file paths.conf \
     build opencda

   OPENCDA_BUILD_TARGET=opencda-protobuf OPENCDA_IMAGE_TAG=protobuf \
     docker compose -f dc-configs/docker-compose.yml --env-file paths.conf \
     up -d opencda

Use ``minimal``, ``cuda``, and ``local`` as the corresponding image tags for
``opencda-minimal``, ``opencda-cuda``, and the full ``opencda`` target.
Set ``CUDA_ARCHITECTURES`` in the environment before a direct Compose build to
override the default architecture.

Run Individual Components
-------------------------

**CARLA on Windows**

Start CARLA:

.. code-block:: bash

   ./CarlaUE4.exe

Low-quality rendering:

.. code-block:: bash

   ./CarlaUE4.exe --quality-level=Low

Headless mode:

.. code-block:: bash

   ./CarlaUE4.exe -RenderOffScreen

Change map or weather:

.. code-block:: bash

   python .\PythonAPI\util\config.py --map Town06
   python .\PythonAPI\util\config.py --weather ClearNoon

**CARLA on Linux**

Enter the CARLA container:

.. code-block:: bash

   docker exec -it carla bash

Start CARLA:

.. code-block:: bash

   ./CarlaUE4.sh

Low-quality rendering:

.. code-block:: bash

   ./CarlaUE4.sh --quality-level=Low

Headless mode:

.. code-block:: bash

   ./CarlaUE4.sh -RenderOffScreen

Change map or weather:

.. code-block:: bash

   ./PythonAPI/util/config.py --map Town06
   ./PythonAPI/util/config.py --weather ClearNoon

**SUMO**

Enter the SUMO container:

.. code-block:: bash

   docker exec -it sumo bash

Start SUMO:

.. code-block:: bash

   sumo-gui -c /path/to/scenario.sumocfg --remote-port <port> --num-clients <n>

Start SUMO in non-GUI mode:

.. code-block:: bash

   sumo -c /path/to/scenario.sumocfg --remote-port <port> --num-clients <n>

Example:

.. code-block:: bash

   sumo-gui -c assets/rsu_check/rsu_check.sumocfg --remote-port 3000 --num-clients 2

**OpenCDA**

On Windows, specify ``--carla-host host.docker.internal`` when running
``python opencda.py`` from the OpenCDA container.

Before starting OpenCDA, build and create a container with the target required
by the scenario. For a scenario without Artery or CUDA-dependent OpenCOOD
models:

.. code-block:: bash

   ./run.sh build opencda-minimal
   ./run.sh up opencda-minimal

OpenCDA communication with Artery requires generated Protobuf modules. Build
and start either the Protobuf target or the full target before running a CAPI
scenario:

.. code-block:: bash

   ./run.sh build opencda-protobuf
   ./run.sh up opencda-protobuf

Enter the OpenCDA container:

.. code-block:: bash

   docker exec -it opencda bash

Run a scenario:

.. code-block:: bash

   python opencda.py -t rsu_check

Run SUMO during simulation:

.. code-block:: bash

   python opencda.py -t rsu_check --cosim

Free camera:

.. code-block:: bash

   python opencda.py -t rsu_check --cosim --free-spectator

Run cooperative perception models:

.. code-block:: bash

   python opencda.py -t rsu_check --cosim --with-coperception \
   --model-dir opencda/coperception_models/pointpillar-where2comm-intermediate-v2xsim-50

This Where2Comm example does not require the custom OpenCOOD CUDA extensions,
so it can use ``opencda-minimal`` or ``opencda-protobuf``. Build
``opencda-cuda`` or the full ``opencda`` target only for models that require
the extensions, such as FPV-RCNN.

Help:

.. code-block:: bash

   python opencda.py -h

**Artery**

Enter the Artery container:

.. code-block:: bash

   docker exec -it artery bash

Ensure the cached build directory exists:

.. code-block:: bash

   ls /cached-build/Debug

Upon container start, the working directory with source code is mounted to
``/workspaces/artery`` to mimic the devcontainer layout. You can build and run
Artery from there.

Build template:

.. code-block:: bash

   cd /workspaces/artery
   ./tools/build.py -cb --build-dir /cached-build <any other build args>

Re-run the build after changing any part of the Artery source code.

Run the simulation with the Qt frontend:

.. code-block:: bash

   ./tools/run_artery.py -l /cached-build/Debug/run-artery.ini -s scenarios/<scenario>

Run the simulation with the command-line frontend:

.. code-block:: bash

   ./tools/run_artery.py -l /cached-build/Debug/run-artery.ini -s scenarios/<scenario> -u Cmdenv

Use a non-default configuration:

.. code-block:: bash

   ./tools/run_artery.py -l /cached-build/Debug/run-artery.ini -s scenarios/<scenario> -u Cmdenv -c <configuration>

Example for the base CAPI scenario:

.. code-block:: bash

   ./tools/run_artery.py -l /cached-build/Debug/run-artery.ini -s scenarios/capi -u Cmdenv

The ``capi`` scenario is a base setup and can be used with any OpenCDA
scenario.

You may also use CMake. Note that stopping OMNeT++ is harder in this mode:

.. code-block:: bash

   cmake --build /cached-build/Debug --target run_<scenario>

Start SUMO first, then run the OpenCDA scenario:

.. code-block:: bash

   python opencda.py -t <scenario> -c --with-capi
