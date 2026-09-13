Maps and SUMO Assets
====================

Use map assets from ``sumo/assets/maps/`` when they already match your CARLA
map. This page covers generating a new road network and polygons, and
inspecting coordinates for scenario YAML files.

Prepare the Conversion Environment
----------------------------------

Run the helper scripts from the **OpenCDA repository root** in a Python
environment with CARLA 0.9.16, lxml and sumolib. Network generation additionally
needs the SUMO distribution (including ``netconvert`` and its tools).
The OpenCDA container does not install the SUMO executable by default.

For a temporary conversion environment in the **OpenCDA container**:

.. code-block:: bash

   python -m venv --system-site-packages /tmp/cavise-map-tools
   source /tmp/cavise-map-tools/bin/activate
   python -m pip install eclipse-sumo==1.27.0
   export SUMO_HOME="$(python -c 'import sumo; print(sumo.SUMO_HOME)')"
   export PATH="$SUMO_HOME/bin:$PATH"
   netconvert --version

The temporary environment is lost when the container is recreated. The
commands below save assets into ``opencda/sumo-assets/``, which Compose mounts
from the host's ``sumo/assets/`` directory. Set ``CARLA_HOST`` as described in
:ref:`carla-client-shell`. Keep CARLA running without an active OpenCDA scenario
while converting maps, because the conversion tools can load maps and tick
the world.

.. _gen-net-xml:

Generate a Road Network
-----------------------

In the same **OpenCDA container shell**:

.. code-block:: bash

   mkdir -p opencda/sumo-assets/maps/Town06
   python scripts/netconvert_carla.py --from-carla \
     --carla-host "$CARLA_HOST" --carla-map Town06 \
     --output opencda/sumo-assets/maps/Town06/Town06.generated.net.xml

The distinct ``.generated`` filename lets you inspect the result before
replacing existing assets. Alternatively pass a local ``.xodr`` file instead
of ``--from-carla``. See :doc:`/wiki/additional-scripts` for script options.

Inspect lane connectivity and traffic lights in SUMO/netedit before using the
network in an experiment. Generate routes against this network's edge IDs.

.. _gen-poly-xml:

Generate Polygons
-----------------

Use the generated network for coordinate conversion and clipping:

.. code-block:: bash

   python scripts/polyconvert_carla.py \
     --net-file opencda/sumo-assets/maps/Town06/Town06.generated.net.xml \
     --output opencda/sumo-assets/maps/Town06/Town06.generated.poly.xml \
     --carla-host "$CARLA_HOST" --carla-map Town06

Reference the chosen polygon file in your scenario's ``.sumocfg``:

.. code-block:: xml

   <additional-files value="../maps/Town06/Town06.generated.poly.xml"/>

For manual corrections, open the scenario in netedit and switch to Polygon
Mode. Enable fill and a closed shape, set its ID/type, draw the vertices,
then save. The example toolbar and polygon settings are shown below.

.. image:: images/toolbar.png
   :alt: SUMO netedit toolbar with polygon mode controls

.. image:: images/poly_settings.png
   :alt: Polygon fill and closed-shape settings in netedit

Get Scenario Coordinates
------------------------

Use the CARLA spectator to locate a road position. From the **OpenCDA
container shell**:

.. code-block:: bash

   python scripts/get_spectator_position.py --carla-host "$CARLA_HOST"

To move the spectator:

.. code-block:: bash

   echo "10.0,20.0,50.0" | python scripts/set_spectator_position.py \
     --carla-host "$CARLA_HOST"

The printed transform is the camera position. Adapt it to a valid vehicle
spawn point on the road. Do not copy the camera altitude into a vehicle's
spawn height. Check the YAML pose convention used by your chosen scenario.
