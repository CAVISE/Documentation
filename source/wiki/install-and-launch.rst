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
   ├── opencda/
   ├── opencood/
   ├── sumo/
   ├── artery/
   ├── scenario-manager/
   └── models/              # created when needed

``models`` is not cloned by setup. ``run.sh up`` prepares its bind-mount
directory. OpenCDA fetches requested bundles at runtime. See :doc:`/models`
for offline use and custom checkpoints.

Next: :doc:`/getting-started/first-simulation` builds only the images needed
for a CARLA/OpenCDA scenario.
