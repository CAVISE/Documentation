Troubleshooting
===============

First identify which step fails: image build, container startup, simulator
startup, connection, or scenario execution. ``run.sh up`` only creates waiting
containers. It does not launch CARLA, SUMO, Artery or OpenCDA.

CARLA Cannot Be Reached
-----------------------

Check that the CARLA process is running, then repeat the version/map query in
:ref:`carla-client-shell` from the OpenCDA container. The default RPC port is
2000. Increase ``--carla-timeout`` if the map takes longer to load.

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      The Compose service name is ``carla``. In the OpenCDA shell:

      .. code-block:: bash

         export CARLA_HOST=carla

      Check that both containers belong to the same Compose network and that
      ``CarlaUE4.sh`` is running inside the CARLA container.

   .. tab-item:: Windows
      :sync: windows

      With Docker Desktop, use the Windows host address in the OpenCDA shell:

      .. code-block:: bash

         export CARLA_HOST=host.docker.internal

      Check Docker Desktop's WSL integration and the Windows firewall rule for
      CARLA. If using an independent Docker Engine inside WSL, verify its route
      to the Windows host instead of assuming this hostname exists. Pass the
      reachable host address explicitly through ``--carla-host``.


Town06 Is Missing or Versions Differ
------------------------------------

Install the additional maps for the same CARLA release as the server.
The CAVISE CARLA Dockerfile imports the matching map archive during its build.
On Windows install the maps into the extracted package. Recheck
``client.get_available_maps()`` before launching the scenario.

The current server and Python client should both be 0.9.16. Rebuild an outdated
image or install the matching Windows package when they differ. Changing the
scenario name alone does not install a missing map.

Unknown Model Flag or Missing Build Target
------------------------------------------

``--model-id`` and ``opencda-coperception`` require the OpenCDA version that
uses separate OpenCOOD/models repositories. Check the component versions,
not just the top-level CAVISE commit. In the OpenCDA container:

.. code-block:: bash

   python opencda.py --help

Setup skips existing repositories. It is not an update command. After updating
compatible checkouts, rebuild the selected target and run ``up`` to recreate
its container.

Missing OpenCOOD or CUDA Extension
----------------------------------

For ``No module named opencood``, check that the sibling OpenCOOD checkout
exists and choose ``opencda-coperception``, ``opencda-cuda`` or ``opencda``.
The minimal and Protobuf-only images do not install OpenCOOD.

If a model requires an extension such as ``roiaware_pool3d_cuda``, run from the
**CAVISE root**:

.. code-block:: bash

   ./run.sh build opencda-cuda
   ./run.sh up opencda-cuda

Use the full ``opencda`` target if the same experiment requires CAPI. Verify
inside the OpenCDA container:

.. code-block:: bash

   python -c "from opencood.pcdet_utils.roiaware_pool3d import roiaware_pool3d_cuda; print(roiaware_pool3d_cuda.__file__)"

If an extension reports an unsupported GPU architecture, rebuild with an
appropriate ``CUDA_ARCHITECTURES`` value. See :doc:`/reference/runtime`.

Models Cannot Be Downloaded
---------------------------

Check the bundle ID, network access, repository/ref and permissions on the
host's ``models`` directory. Use ``run.sh up`` so the directory is created by
your user before Docker bind-mounts it. For direct Compose use, create it
first as described in :doc:`/reference/runtime`.

``--no-auto-fetch-models`` requires a complete valid bundle already on disk.
Metadata or checksum failures require a valid bundle, not a disabled check.
See :doc:`/models` for supported overrides.

AdvCP Does Not Start or Does Not Affect Predictions
---------------------------------------------------

- Use both ``--with-coperception`` and ``--advcp-config`` with ``--with-advcp``.
- Include the scenario subdirectory: ``-t advcp-scenarios/advcp_check``.
- Check that the configured ``attacker_ids`` exist in that scenario. The
  default ``removal_forward`` selects ``cav-5``.
- Check model/fusion compatibility, sensor visibility and metric warmup.
  Configuration activation does not guarantee a successful attack.

Use the matched baseline and attack commands in :doc:`/guides/advcp`.

SUMO or Artery Waits for a Client
---------------------------------

Check SUMO's client count, port and each client's connection order. The
:doc:`/guides/cosimulation` example uses one client for OpenCDA alone, or two
for OpenCDA plus Artery. Start SUMO before its clients. A two-client server
waits if only one client connects. Also check that a previous run did not
leave a process occupying the same port.

GPU and Display Problems
------------------------

Use ``docker exec opencda nvidia-smi`` after creating the container. If GPU
access fails, revisit the platform-specific requirements in
:doc:`install-and-launch` before debugging the scenario itself.

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      For an X11/XWayland display error, check ``DISPLAY`` on the host and the
      ``/tmp/.X11-unix`` mount. When the X server rejects container clients,
      allow local Docker connections from the host's graphical session:

      .. code-block:: bash

         xhost +local:docker

      After the session, revoke that access with ``xhost -local:docker``.
      If no graphical session is available, use CARLA off-screen rendering,
      ``sumo`` and Artery's ``Cmdenv`` frontend.

   .. tab-item:: Windows
      :sync: windows

      CARLA renders on the Windows host. GUI applications inside Linux
      containers additionally need a working WSL display/socket setup.
      For a run without container windows, use ``sumo`` and Artery's ``Cmdenv``
      frontend and save perception visualizations instead of opening live views.
