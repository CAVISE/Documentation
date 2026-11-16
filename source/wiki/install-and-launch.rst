Installation
============

Prepare the workspace once, then continue to :doc:`/getting-started/first-simulation`.
The Docker workflow uses Linux containers on both platforms. On Windows,
CARLA runs on the Windows host and the CAVISE commands run in Ubuntu under WSL2.

Platform Requirements
---------------------

The current CARLA image and OpenCDA client use **CARLA 0.9.16**. Keep the
server, Python client, and additional maps on the same release. The OpenCDA
images use Ubuntu 24.04 and CUDA 13.0.3. The host setup script needs Python
3.10 or newer.

The supplied Compose configuration requests an NVIDIA GPU. Install a driver
compatible with the image's CUDA runtime. Image builds, CARLA maps, and model
checkpoints require substantial disk space. Download only the components and
models needed for your experiment.

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      Install Git, Python with venv support, Docker Engine with the Compose v2
      plugin, and the NVIDIA Container Toolkit. Follow the
      `Docker Engine installation guide <https://docs.docker.com/engine/install/ubuntu/>`_
      and `NVIDIA Container Toolkit guide <https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html>`_.

      CARLA runs in the ``carla`` container. GUI programs also need a working
      X11/XWayland display. See :doc:`troubleshooting` for display diagnostics.

   .. tab-item:: Windows
      :sync: windows

      Install WSL2 with Ubuntu and Docker Desktop. Enable Docker Desktop's
      WSL2 backend and integration with your Ubuntu distribution. Follow
      `Docker's GPU setup guide <https://docs.docker.com/desktop/features/gpu/>`_.

      In **Windows PowerShell**, check the WSL version:

      .. code-block:: powershell

         wsl --version
         wsl --list --verbose

      Install Git and Python with venv support inside Ubuntu. Keep the CAVISE
      checkout in the WSL filesystem, for example ``~/CAVISE``.

      Download the **Windows package for CARLA 0.9.16** and the matching additional
      maps using the `CARLA package instructions <https://carla.readthedocs.io/en/0.9.16/start_quickstart/>`_.
      Install the maps into the extracted CARLA package, including Town06 used by
      these guides. No Windows Python environment is needed to run the server.
      Map queries and scenario control below use the client in the OpenCDA container.

Check the host environment from **Linux Bash or Ubuntu in WSL2**:

.. code-block:: bash

   git --version
   python3 --version
   docker version
   docker compose version
   nvidia-smi

``docker version`` must report a reachable server. Host ``nvidia-smi`` alone
does not prove container GPU access. The first-run guide checks it inside
OpenCDA as well.

Clone the Workspace
-------------------

Run in **Linux Bash or Ubuntu in WSL2**:

.. code-block:: bash

   git clone https://github.com/CAVISE/CAVISE.git
   cd CAVISE
   python3 -m venv venv
   source venv/bin/activate
   python -m pip install -r requirements.txt
   python setup.py

Setup asks for a branch or tag for ``opencda``, ``opencood``, ``sumo``,
``artery``, and ``scenario-manager``. Choose compatible versions. The current
main branches use separate OpenCOOD and models repositories.

Existing directories are skipped. **Running setup again does not update an
existing checkout.** When upgrading, review local changes and update each
component deliberately. See :doc:`/reference/runtime` for selective setup and
version flags.

Workspace Paths
---------------

Run ``run.sh`` from the CAVISE root, where ``paths.conf`` resides. It loads
paths from that file and selects the appropriate Compose configuration.
The standard layout is:

.. code-block:: text

   CAVISE/
   ├── paths.conf
   ├── run.sh
   ├── carla/               # Dockerfile and downloaded additional maps
   ├── opencda/
   ├── opencood/
   ├── sumo/
   ├── artery/
   ├── scenario-manager/
   └── models/              # created when needed

``models`` is not cloned by setup. ``run.sh up`` prepares its bind-mount
directory. OpenCDA fetches requested bundles at runtime. See :doc:`/models`
for offline use and custom checkpoints.

.. _carla-images:

Build CARLA and Install Additional Maps
---------------------------------------

These steps run in **Linux Bash, from the CAVISE root**. On Windows, use the Windows
package and install its matching maps as described above.

The local Dockerfile downloads the official prebuilt Linux package for CARLA 0.9.16. No
CARLA source checkout or Unreal Engine compilation is needed. Install Docker Compose
2.17 or newer with BuildKit named context support, plus host ``curl`` and ``tar`` for
additional maps.

Choose ``carla`` for the base image (``carla:0.9.16-default``), which contains only maps from the main package:

.. code-block:: bash

   ./run.sh build carla
   ./run.sh up carla

**Town06 is in the additional maps archive and is absent from the base package.** For
the default ``v2xp_datadump_town06_carla`` scenario, build and start ``carla-extended``
(``carla:0.9.16-extended``) together with OpenCDA:

.. code-block:: bash

   ./run.sh build carla-extended opencda-minimal
   ./run.sh up carla-extended opencda-minimal

Both variants use the same Compose service and container name, ``carla``. Select one
variant per command. After rebuilding or switching variants, run ``up`` to apply the
image; ``start`` only starts an existing container. Start the CARLA server and run the
Town06 scenario as shown in :doc:`/getting-started/first-simulation`.

Reuse a Downloaded Maps Archive
-------------------------------

For ``build carla-extended``, ``run.sh`` downloads
``https://downloads.carlasim.com/Linux/AdditionalMaps_${CARLA_VERSION}.tar.gz`` on the
host. By default, the archive is stored at
``$PATH_TO_CARLA/$CARLA_VERSION/AdditionalMaps_${CARLA_VERSION}.tar.gz``, for example
``carla/0.9.16/AdditionalMaps_0.9.16.tar.gz``. Later builds reuse that file. You can
also place a downloaded archive there before building.

To use an archive from another directory, set ``CARLA_MAPS_ARCHIVE`` when building. The
filename can be arbitrary; paths with spaces are supported. Relative paths are resolved
from the CAVISE root. The contents must be additional maps compatible with the selected
CARLA release; renaming an archive does not change its version.

.. code-block:: bash

   CARLA_MAPS_ARCHIVE="/home/user/CARLA assets/my-maps.tar.gz" ./run.sh build carla-extended
   ./run.sh up carla-extended

The supplied archive is read directly without copying it into the checkout or
downloading a replacement. A missing or invalid supplied archive stops the build.
Downloads use a temporary ``.part`` file until validation succeeds. Full archive
validation may take several minutes; ``run.sh`` prints a message before checking.

The extended build mounts the archive temporarily and imports the maps with the packaged
``ImportAssets.sh``. Extracted maps become part of the image; the archive stays on the
host. No maps volume or archive path is required when starting the built container. Base
builds do not download additional maps.

Select a CARLA Release
----------------------

``CARLA_VERSION`` defaults to ``0.9.16`` and controls the main package URL, additional
maps URL, default archive directory, image tag and Python client in the CARLA image.
Export it before both building and starting:

.. code-block:: bash

   export CARLA_VERSION=0.9.16
   ./run.sh build carla-extended
   ./run.sh up carla-extended

The main package is downloaded inside Docker from
``https://downloads.carlasim.com/Linux/CARLA_${CARLA_VERSION}.tar.gz``. Use the same
version and variant for ``build`` and ``up``. OpenCDA pins its own CARLA client
separately; changing this variable does not update OpenCDA. This recipe targets 0.9.16.
CARLA 0.10.0 uses UE5 and requires separate validation of runtime dependencies, launch
commands, maps and clients.

Next: :doc:`/getting-started/first-simulation` builds only the images needed
for a CARLA/OpenCDA scenario.
