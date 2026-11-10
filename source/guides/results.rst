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


Cooperative Perception Metrics
------------------------------

OpenCDA uses OpenCOOD to calculate AP at BEV IoU thresholds 0.3, 0.5 and 0.7.
AP is cumulative: TP, FP, scores and GT counts are collected across frames.
The final AP is calculated from all collected data, not averaged over ticks.
Each metric excludes its first ``warmup_steps`` updates from accumulation.

Final TP, FP, FN, precision and recall use a fixed confidence threshold
(default 0.5). FN = GT - TP, precision = TP / (TP + FP), recall = TP / GT.
Predictions with a score greater than or equal to this threshold are included.
AP uses all predictions supplied to the evaluator, independently of this
metric's confidence threshold. These predictions have already passed the
model's postprocessing, including its own score filtering and non-maximum
suppression (NMS). Predictions removed there cannot contribute to AP or the
fixed-threshold metrics. Undefined final values are stored as ``null``.

When cooperative perception and ``ap_at_iou`` are enabled, final values are
saved in ``coperception.final_metrics`` in ``report.json`` and written to the
OpenCDA logs. Configure the reporting threshold and warmup in the scenario YAML:

.. code-block:: yaml

   coperception:
     metrics:
       metric_configs:
         ap_at_iou:
           warmup_steps: 0
           confidence_threshold: 0.5

This reporting threshold does not change the model's postprocessing settings.

``mean_precision_at_iou`` averages the interpolated precision envelope of the
accumulated PR curve. ``mean_recall_at_iou`` averages its recall coordinates.
Both exclude the artificial endpoints added for AP integration. These are
auxiliary curve summaries, not precision and recall at a fixed threshold.

Other metrics include ``attack_success_rate`` for removal and spoofing,
``attacker_benign_visibility_ratio`` for LiDAR point visibility, and
``attacker_target_confidence`` for confidence on attack targets.
