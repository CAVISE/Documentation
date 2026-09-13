OpenCDA Overview
================

OpenCDA is the scenario orchestration layer of CAVISE. It connects automated
driving logic to the CARLA world and can optionally synchronize the same
experiment with SUMO and Artery. A scenario describes the world, vehicles,
roadside units, sensors, driving behavior, communication services, metrics,
and attacks in YAML. ``opencda.py`` loads that configuration and runs the
simulation loop.

For setup and the first run, follow :doc:`/wiki/install-and-launch` and
:doc:`/getting-started/first-simulation`.

What OpenCDA Provides
---------------------

.. list-table::
   :header-rows: 1
   :widths: 24 76

   * - Area
     - Available functionality
   * - Scenario orchestration
     - Deterministic CARLA worlds with configurable maps, weather, simulation
       steps, vehicles, RSUs, destinations, background traffic, and random
       seeds.
   * - Automated driving
     - Localization, camera and LiDAR perception, map management, safety
       monitoring, route and trajectory planning, PID control, CARLA
       autopilot, and platooning.
   * - Co-simulation
     - Bidirectional CARLA--SUMO synchronization for traffic and CAPI-based
       communication with Artery network simulations.
   * - Cooperative applications
     - Vehicle and RSU behavior services, including state publication,
       movement requests and control, and AIM client/server workflows.
   * - Cooperative perception
     - OpenCOOD-based multi-agent perception with visualization, prediction
       export, and configurable evaluation metrics.
   * - Security experiments
     - Declarative attacks against behavior services and AdvCP attacks against
       cooperative perception pipelines.
   * - Evaluation and data collection
     - CARLA recording, sensor data dumping, structured logs, and metrics for
       localization, driving behavior, platooning, and cooperative perception.

Scenario Demonstration
----------------------

.. raw:: html

   <div class="opencda-demo-gallery">
     <figure class="opencda-demo">
       <img
         src="../_static/images/opencda/platoon_joining_town06.gif"
         alt="Connected automated vehicle joining a platoon in CARLA Town06"
         loading="lazy"
         decoding="async"
       />
       <figcaption>Platoon joining scenario in CARLA Town06.</figcaption>
     </figure>
   </div>

Cooperative Perception Demonstration
------------------------------------

The ``v2xp_datadump_town06_carla`` scenario demonstrates cooperative
perception with a connected vehicle and roadside infrastructure. The first
view shows the fused detections in the CARLA scene. The second shows the same
run from the bird's-eye-view visualizer.

.. raw:: html

   <div class="opencda-demo-gallery">
     <figure class="opencda-demo">
       <img
         src="../_static/images/opencda/v2xp_datadump_town06_carla_3d.gif"
         alt="Cooperative perception detections in the CARLA 3D scene"
         loading="lazy"
         decoding="async"
       />
       <figcaption>3D view of cooperative perception detections.</figcaption>
     </figure>
     <figure class="opencda-demo">
       <img
         src="../_static/images/opencda/v2xp_datadump_town06_carla_bev.gif"
         alt="Bird's-eye view of cooperative perception detections"
         loading="lazy"
         decoding="async"
       />
       <figcaption>Bird's-eye view of the same scenario.</figcaption>
     </figure>
   </div>

Learn More
----------

- :doc:`/guides/cooperative-perception`
- :doc:`/guides/advcp`
- :doc:`/scenarios/index`
- :doc:`attack-framework`
- :doc:`behavior-services`
