First Simulation
================

Run ``v2xp_datadump_town06_carla`` in CARLA Town06. Complete :doc:`/wiki/install-and-launch`
first. This example uses CARLA and core OpenCDA. SUMO, Artery, and learned
cooperative perception are optional additions in the later guides.

Create the Containers
---------------------

Run in **Linux Bash or Ubuntu in WSL2**, from the CAVISE root:

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      .. code-block:: bash

         ./run.sh build carla opencda-minimal
         ./run.sh up carla opencda-minimal

   .. tab-item:: Windows
      :sync: windows

      CARLA runs on Windows, so build only OpenCDA here:

      .. code-block:: bash

         ./run.sh build opencda-minimal
         ./run.sh up opencda-minimal

Check that the container is running and can access the GPU:

.. code-block:: bash

   docker ps
   docker exec opencda nvidia-smi

``up`` creates containers that wait with ``sleep infinity``. Start CARLA and
the scenario explicitly in separate terminals below.

.. _start-carla:

Start CARLA
-----------

Keep this terminal open while the scenario runs.

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      In **Linux Bash**:

      .. code-block:: bash

         docker exec -it carla bash
         ./CarlaUE4.sh -quality-level=Low

      For off-screen rendering, use ``./CarlaUE4.sh -RenderOffScreen`` instead.

   .. tab-item:: Windows
      :sync: windows

      In **Windows PowerShell**, change to the extracted CARLA directory
      containing ``CarlaUE4.exe``, then run:

      .. code-block:: powershell

         .\CarlaUE4.exe -quality-level=Low

      For off-screen rendering, use ``.\CarlaUE4.exe -RenderOffScreen`` instead.

.. _carla-client-shell:

Connect from OpenCDA
--------------------

In a **new Linux/WSL terminal**, enter the OpenCDA container:

.. code-block:: bash

   docker exec -it opencda bash

The shell starts in the mounted OpenCDA repository. Set the CARLA address
**inside this container shell**:

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      .. code-block:: bash

         export CARLA_HOST=carla

   .. tab-item:: Windows
      :sync: windows

      .. code-block:: bash

         export CARLA_HOST=host.docker.internal

      This address is provided by Docker Desktop. A Docker Engine installed
      independently inside WSL may require a different Windows host address.
      See :doc:`/wiki/troubleshooting`.

All subsequent guides use ``--carla-host "$CARLA_HOST"``. Repeat this export
whenever you open a new container shell. ``CARLA_HOST`` is a shell variable
used by these examples. The runner does not read it automatically.

Before launching, query both API versions and the available Town06 map:

.. code-block:: bash

   python - <<'PYTHON'
   import os
   import carla
   client = carla.Client(os.environ["CARLA_HOST"], 2000)
   client.set_timeout(30.0)
   print("Client:", client.get_client_version())
   print("Server:", client.get_server_version())
   print("Town06:", [m for m in client.get_available_maps() if m.endswith("/Town06")])
   PYTHON

Both versions should match and Town06 should be listed. Resolve a connection
or map error before continuing.

Run the Scenario
----------------

In the same **OpenCDA container shell**:

.. code-block:: bash

   python opencda.py -t v2xp_datadump_town06_carla \
     --carla-host "$CARLA_HOST" --ticks 200

OpenCDA loads ``opencda/scenario_testing/config_yaml/v2xp_datadump_town06_carla.yaml`` over
``default.yaml``, initializes Town06, creates the configured agents, and
advances the simulation. ``--ticks`` bounds the run. It may end sooner if its
scenario completion conditions are met. Logs and evaluation output are under
``simulation_output/evaluation_outputs/`` in the mounted OpenCDA repository.

Use ``--free-spectator`` to keep manual control of the CARLA camera. See
:doc:`/guides/results` for recording, visualization, and output files.

Stop and Run Again
------------------

Let the bounded run finish, or press ``Ctrl+C`` in the OpenCDA terminal.
Stop CARLA with ``Ctrl+C`` in its terminal when no longer needed.
To stop the containers, run from the **CAVISE root on Linux/WSL**:

.. tab-set::
   :sync-group: os

   .. tab-item:: Linux
      :sync: linux

      .. code-block:: bash

         ./run.sh stop carla opencda-minimal

   .. tab-item:: Windows
      :sync: windows

      .. code-block:: bash

         ./run.sh stop opencda-minimal

Use ``run.sh start`` with the same services to restart existing containers,
then launch the simulator processes again. Use ``up`` after rebuilding or
changing an image target. ``start`` does not recreate a container.
