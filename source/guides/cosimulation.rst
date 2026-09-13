SUMO and Artery
===============

Add SUMO traffic synchronization to the first simulation, then optionally
connect Artery for network communication through CAPI. Keep CARLA running
as described in :ref:`start-carla`.

CARLA and SUMO
--------------

From the **CAVISE root on Linux/WSL**:

.. code-block:: bash

   ./run.sh build sumo opencda-minimal
   ./run.sh up sumo opencda-minimal

In a separate terminal, start SUMO with one TraCI client (OpenCDA):

.. code-block:: bash

   docker exec -it sumo bash
   sumo -c assets/v2xp_datadump_town06_carla/v2xp_datadump_town06_carla.sumocfg \
     --step-length 0.05 --remote-port 3000 --num-clients 1

SUMO waits for OpenCDA to connect. Use ``sumo-gui`` instead of ``sumo`` if a
display is configured. In the OpenCDA container, set ``CARLA_HOST`` as in
:ref:`carla-client-shell`, then run:

.. code-block:: bash

   python opencda.py -t v2xp_datadump_town06_carla \
     --cosim --carla-host "$CARLA_HOST" --ticks 200

The scenario's ``sumo.host`` and ``sumo.port`` must point to this SUMO server.
``--cosim`` connects to an existing server. It does not start SUMO for you.

Add Artery
----------

Stop the previous OpenCDA and SUMO processes before this run. Recreate
OpenCDA with Protobuf support. From the **CAVISE root on Linux/WSL**:

.. code-block:: bash

   ./run.sh build artery opencda-protobuf
   ./run.sh up artery opencda-protobuf sumo

The startup order is **CARLA and SUMO, then Artery, then OpenCDA**. Use
separate terminals for the long-running processes.

Start SUMO with **two clients** (Artery and OpenCDA):

.. code-block:: bash

   docker exec -it sumo bash
   sumo -c assets/v2xp_datadump_town06_carla/v2xp_datadump_town06_carla.sumocfg \
     --step-length 0.05 --remote-port 3000 --num-clients 2

In the **Artery container**:

.. code-block:: bash

   docker exec -it artery bash
   cd /workspaces/artery
   ./tools/build.py -cb --build-dir /cached-build --config Debug
   ./tools/run_artery.py -l /cached-build/Debug/run-artery.ini -s scenarios/capi -u Cmdenv

The base ``capi`` configuration connects to ``sumo:3000`` with client order 1
and listens for OpenCDA on port 7777. In the **OpenCDA container**, set
``CARLA_HOST`` again after entering the recreated container, then run:

.. code-block:: bash

   python opencda.py -t v2xp_datadump_town06_carla \
     --cosim --with-capi \
     --carla-host "$CARLA_HOST" --artery-host artery:7777 --ticks 200

``v2xp_datadump_town06_carla`` inherits OpenCDA SUMO client order 2 and a 0.05-second step
from ``default.yaml``. The commands override the SUMO file's 0.1-second
step so that both simulators advance at the same rate. For custom
scenarios, use distinct client orders, matching step lengths and consistent
map assets. See :doc:`/scenarios/index`.

CAPI plus cooperative perception requires the full ``opencda`` image.
Target choices and Artery frontend options are in :doc:`/reference/runtime`.
After stopping OpenCDA, stop remaining simulator processes with ``Ctrl+C``
in their respective terminals, then stop their containers if no longer needed.
