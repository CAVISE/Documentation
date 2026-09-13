Creating a Scenario
===================

Start with a working scenario close to your experiment. A CARLA-only scenario
needs an OpenCDA YAML file. Add SUMO assets only for co-simulation, and Artery
configuration only when the experiment uses CAPI.

Create the OpenCDA YAML
-----------------------

In the **OpenCDA repository**:

.. code-block:: bash

   cp opencda/scenario_testing/config_yaml/v2xp_datadump_town06_carla.yaml \
     opencda/scenario_testing/config_yaml/my_scenario.yaml

Edit the map, agent spawn positions, destinations, sensors and behaviors.
The runner merges the file over ``config_yaml/default.yaml``. Vehicle and
RSU IDs must be unique within their corresponding agent type. AdvCP uses
runtime IDs such as ``cav-5`` and ``rsu-1``. Behavior-service attacks are
selected independently through the top-level ``attacks`` list.

With CARLA running and ``CARLA_HOST`` set in the **OpenCDA container**:

.. code-block:: bash

   python opencda.py -t my_scenario --carla-host "$CARLA_HOST" --ticks 200

A scenario in a subdirectory is selected with its relative path, for example
``-t advcp-scenarios/advcp_check``. Validate a CARLA-only run before adding
co-simulation. Use :doc:`maps` to inspect coordinates and prepare map assets.

Add SUMO
--------

Create ``sumo/assets/my_scenario/`` in the **CAVISE workspace**. Reuse a road
network from ``sumo/assets/maps/`` that matches the CARLA map, or generate
one following :doc:`maps`.

.. list-table::
   :header-rows: 1

   * - File
     - Purpose
   * - ``my_scenario.sumocfg``
     - References routes, network, optional polygons and simulation settings.
   * - ``my_scenario.rou.xml``
     - Vehicle routes or flows using valid edge IDs from the network.
   * - ``.net.xml``
     - SUMO road network. Can be shared by scenarios on the same map.
   * - ``.poly.xml``
     - Optional static geometry for visualization and propagation models.

Paths within ``.sumocfg`` are relative to that configuration file. For example,
``v2xp_datadump_town06_carla.sumocfg`` references ``../maps/Town06/Town06.net.xml`` rather than
copying the network into its scenario directory.

Set the SUMO connection in the OpenCDA YAML (these values can also be inherited
from ``default.yaml``):

.. code-block:: yaml

   sumo:
     host: sumo
     port: 3000
     gui: false
     client_order: 2
     step_length: ${world.fixed_delta_seconds}

Start the server with the required client count and then launch OpenCDA with
``--cosim``. Follow :doc:`/guides/cosimulation` for the commands. Keep the
server's step length consistent with ``world.fixed_delta_seconds`` and ensure
routes reference existing edges. Provide traffic or a valid long-lived vehicle
so the intended experiment does not end before its clients finish.

Add Artery
----------

For a first CAPI run, use the shared ``artery/scenarios/capi`` configuration
from :doc:`/guides/cosimulation`. It connects to the separate SUMO container
at port 3000. This avoids duplicating the network and route files in Artery.

For a custom Artery configuration, use the base ``capi`` scenario as a
reference. Preserve ``*.withCAPI = true``, the CAPI endpoint, and the TraCI
connection settings. With two clients, use client order 1 for Artery and 2
for OpenCDA and start SUMO with ``--num-clients 2``.

A scenario using ``PosixLauncher`` starts its own SUMO process. One using
``ConnectLauncher`` connects to a server you started separately. Do not mix
the two launch methods for the same experiment. If adding a CMake run target,
follow ``artery/scenarios/CMakeLists.txt`` and rebuild Artery.

Services and Attacks
--------------------

- :doc:`/opencda/behavior-services` describes reusable CAV/RSU services and
  their configuration.
- :doc:`/opencda/attack-framework` describes attacks against those services.
- :doc:`/guides/advcp` describes attacks against cooperative perception.

Check a baseline without attacks first, then enable one change at a time and
compare :doc:`/guides/results`.
