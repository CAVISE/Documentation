AdvCP
=====

AdvCP modifies cooperative-perception inference during a live CAVISE
simulation. It is enabled through OpenCDA's CLI and an attack YAML file.
The separate ``AdvCollaborativePerception`` research repository has its own
dataset evaluation workflow. It is not needed for this integrated example.

Prerequisites
-------------

Complete :doc:`cooperative-perception`. Keep CARLA 0.9.16 running with Town06
available, use the ``opencda-coperception`` container, and set ``CARLA_HOST``
inside its shell as shown in :ref:`carla-client-shell`.

This example pairs:

- scenario ``advcp-scenarios/advcp_check`` (includes attacker ``cav-5``).
- model ``pointpillar-late-opv2v-30`` (late fusion).
- attack configuration ``removal_forward`` (removal mode).
- runtime asset bundle ``base-car``.

The scenario name includes its directory beneath ``config_yaml``. Do not
substitute ``3cars_advcp_removal_check`` without also adapting the attack
configuration: that scenario does not contain ``cav-5``.

Run a Baseline
--------------

In the **OpenCDA container shell**, run the same scenario and model without
AdvCP first:

.. code-block:: bash

   python opencda.py -t advcp-scenarios/advcp_check \
     --carla-host "$CARLA_HOST" --with-coperception \
     --model-id pointpillar-late-opv2v-30 \
     --ticks 200 --save-vis --save-npy

Run with Removal Enabled
------------------------

After the baseline finishes, run:

.. code-block:: bash

   python opencda.py -t advcp-scenarios/advcp_check \
     --carla-host "$CARLA_HOST" --with-coperception \
     --model-id pointpillar-late-opv2v-30 \
     --with-advcp --advcp-config removal_forward \
     --advcp-assets-id base-car \
     --ticks 200 --save-vis --save-npy

``--with-advcp`` requires both ``--with-coperception`` and
``--advcp-config``. OpenCDA resolves the model and AdvCP assets before starting
simulation. See :doc:`/models` to prepare the bundles for an offline run.

Check Activation and Compare Results
------------------------------------

Look for ``AdvCP mode: removal`` and ``AdvCP attackers: cav-5`` in the log.
These confirm configuration and attacker validation, not attack success.
If no configured attacker exists in the scenario, initialization raises an
error. An attacker can also be absent from an individual model input batch.

Compare the baseline and attack run's saved predictions, visualizations and
evaluation metrics under ``simulation_output``. See :doc:`results`. The
example scenario configures a five-step metric warmup. An attack is not
guaranteed to succeed on every frame: outcomes depend on visibility, the
selected model, fusion mode, and attack geometry.

Configure an Experiment
-----------------------

Named configurations resolve under
``opencda/scenario_testing/config_yaml/advcp-configs/``. The ``.yaml`` suffix
is optional. An absolute path selects a custom file. Relative names are
resolved against that directory, not against the shell's working directory.

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Field
     - Purpose
   * - ``mode``
     - ``removal`` suppresses target detections. ``spoofing`` introduces fake
       targets. The implementation depends on the model's fusion mode.
   * - ``attacker_ids``
     - Existing scenario agent IDs such as ``cav-5`` or ``rsu-1``. Use runtime
       IDs, not display names or bare numeric YAML IDs.
   * - ``boxes`` / ``default_size``
     - Target geometry: each box uses either ``absolute`` (world) or
       ``relative`` (ego) pose ``[x, y, z, roll, yaw, pitch]``. Distances are
       in metres, angles in degrees. Size is ``[length, width, height]``.
       Per-box ``size`` overrides ``default_size``.
   * - ``advshape``
     - Enables the shape-based variant where supported. Additional pretrained
       shape files may be required. Keep it false for the first example.
   * - ``density`` / ``dense_distance``
     - Point sampling settings used by applicable LiDAR attack paths.
   * - ``step`` / ``lr`` / ``max_perturb`` / ``feature_size``
     - Optimization parameters used by applicable intermediate-fusion paths.
   * - ``sync`` / ``init`` / ``online``
     - Temporal and initialization settings for applicable attack paths.

Fusion mode comes from the model configuration, not from a separate AdvCP CLI
flag. Parameters used in one fusion mode may be ignored in another. Do not
assume that changing every YAML field affects late fusion.

To try spoofing with the same seven-agent scenario, replace
``--advcp-config removal_forward`` with ``--advcp-config spoofing_forward``.
For another model, first select its required :doc:`image target </reference/runtime>`
and establish a new baseline. Intermediate-fusion model support must also be
checked against the implementation. Not every OpenCOOD model is supported.

Behavior-service attacks configured with a scenario's ``attacks`` list use
:doc:`/opencda/attack-framework`. That configuration is separate from AdvCP.
