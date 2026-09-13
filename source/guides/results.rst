Recording and Results
=====================

Use the same scenario, model, seed/configuration and run length when comparing
experiments. A successful process exit alone does not establish perception
accuracy or attack success.

Bounded Runs and Logs
---------------------

In the **OpenCDA container shell**, with ``CARLA_HOST`` set as in
:ref:`carla-client-shell`:

.. code-block:: bash

   python opencda.py -t v2xp_datadump_town06_carla \
     --carla-host "$CARLA_HOST" --ticks 200

The default evaluation directory is
``simulation_output/evaluation_outputs/<scenario>_<timestamp>/``. It contains
``opencda.log.json`` and the reports/plots produced by enabled metrics.
Scenario names containing ``/`` create nested output paths. Use
``--log-file /path/to/run.log.json`` to override the log location.

``--verbose 1``, ``2``, and ``3`` select warning, informational and debug
logging respectively.

Profiling Slow Runs
-------------------

``--profile`` measures how much time Python spends in the scenario's functions.
Use it to investigate a slow simulation. It adds profiling overhead, so leave
it off when measuring normal simulation performance.

For example, in the **OpenCDA container shell**:

.. code-block:: bash

   python opencda.py -t v2xp_datadump_town06_carla \
     --carla-host "$CARLA_HOST" --ticks 200 --profile

The runner saves ``profile_output.prof`` in that run's evaluation directory.
This is a binary Python cProfile report, not a video or a perception metric.
To inspect it, replace ``RUN_DIRECTORY`` with the directory printed for your run:

.. code-block:: bash

   python -m pstats RUN_DIRECTORY/profile_output.prof

At the ``pstats`` prompt, enter ``sort cumulative`` followed by ``stats 20``
to see the 20 functions with the highest cumulative time (including calls to
other functions). Enter ``quit`` to exit.

Recording
---------

``--record`` enables CARLA recording and scenario sensor data dumping:

.. code-block:: bash

   python opencda.py -t v2xp_datadump_town06_carla \
     --carla-host "$CARLA_HOST" --record --ticks 200

CARLA recorder files are written by the **CARLA server**, so their location
belongs to its container on Linux or its host process on Windows. Copy files
out of a container before removing it if they are not on a bind mount.

Cooperative Perception Output
-----------------------------

Add these flags to a cooperative-perception or AdvCP command:

.. list-table::
   :header-rows: 1
   :widths: 23 77

   * - Flag
     - Result
   * - ``--save-vis``
     - Frames under ``simulation_output/coperception/vis_<mode>/<scenario>_<timestamp>/``.
       Available views depend on visualization configuration.
   * - ``--save-npy``
     - Prediction and ground-truth arrays under
       ``simulation_output/coperception/npy/<scenario>_<timestamp>/``.
   * - ``--show-video-vis``
     - Live visualization. Requires a working display in the container.

These directories are inside the mounted OpenCDA checkout and remain on the
host when the container is recreated. :doc:`/wiki/additional-scripts` describes
``make_video.py`` for converting a saved frame directory to a video.

Metrics and Warmup
------------------

The scenario's ``coperception.metrics`` configuration selects metric behavior.
Use its warmup settings when interpreting short runs. Inspect the logged
agent IDs and compare per-run metrics alongside the rendered output. Missing
attackers, empty inputs, or a target outside the sensor range can make an
experiment uninformative even when the simulator continues running.
