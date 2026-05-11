Available Services
==================

This page lists the builtin behavior services currently available in
``opencda/core/application/behavior/services/``.

At the moment, the builtin catalog contains four services:

- ``self_informer``
- ``movement_controller``
- ``aim_client``
- ``aim_server``

For the service framework, shared lifecycle, and recommended implementation
template, see :doc:`behavior-services`.

``self_informer``
-----------------

Publishes the current vehicle state for sibling services on the same node.

- ``service_type``: ``self_informer``
- ``owner``: ``VehicleManager``
- ``default priority``: ``1``
- ``capabilities``: ``request.submit``
- ``state snapshot``: owner id, current location, current speed

Typical role:

- run early in the tick
- collect the owner's current pose and speed
- emit a local broadcast message consumed by other vehicle services

Config fields:

- ``priority``: optional integer execution priority

Example:

.. code-block:: yaml

   behavior_services:
     - type: self_informer

Notes:

- this is usually the first vehicle-side service in the chain
- ``aim_client`` depends on its outputs for local state context

``movement_controller``
-----------------------

Consumes local movement commands and applies them to the vehicle controller.

- ``service_type``: ``movement_controller``
- ``owner``: ``VehicleManager``
- ``default priority``: ``100``
- ``capabilities``: none
- ``state snapshot``: owner id, current target position

Typical role:

- run near the end of the vehicle service pipeline
- receive local control commands
- invoke ``owner.control(...)``
- emit no outbound messages

Config fields:

- ``priority``: optional integer execution priority

Example:

.. code-block:: yaml

   behavior_services:
     - type: movement_controller

Notes:

- this is usually the terminal vehicle-side service
- ``aim_client`` sends command messages to this service

``aim_client``
--------------

Runs on a vehicle, consumes AIM responses, and converts them into local motion
commands plus the next AIM request.

- ``service_type``: ``aim_client``
- ``owner``: ``VehicleManager``
- ``default priority``: ``20``
- ``capabilities``:
  ``response.observe``, ``command.submit``, ``request.submit``
- ``state snapshot``: owner id, current active control trajectory

Typical role:

- observe local self state from ``self_informer``
- observe remote responses from ``aim_server``
- compute the next control trajectory
- emit local ``movement_controller`` commands
- emit the next request for ``aim_server``

Config fields:

- ``priority``: optional integer execution priority
- ``debug``: optional bool, enables debug trajectory visualization

Example:

.. code-block:: yaml

   behavior_services:
     - type: self_informer
     - type: aim_client
       debug: true
     - type: movement_controller

Dependencies:

- expects ``self_informer`` on the same vehicle
- typically expects ``movement_controller`` on the same vehicle
- expects at least one reachable ``aim_server`` service on an RSU

``aim_server``
--------------

Runs on an RSU, collects AIM requests from vehicles, performs trajectory
prediction through ``AIMModelManager``, and returns AIM responses.

- ``service_type``: ``aim_server``
- ``owner``: ``RSUManager``
- ``default priority``: ``20``
- ``capabilities``:
  ``request.observe``, ``response.submit``, ``state.observe``
- ``state snapshot``:
  tracked vehicle ids, trajectory vehicle ids, and their counts

Typical role:

- observe incoming AIM request messages
- run the configured AIM model backend
- emit response messages back to vehicles
- expose runtime state for attacks, metrics, and debugging

Config fields:

- ``priority``: optional integer execution priority
- ``control_radius``: optional integer radius for controlled vehicles
- ``control_center_location``: optional explicit center position
- ``debug``: optional bool, enables debug visualization
- ``model`` and additional AIM backend parameters passed through to model
  initialization

Example:

.. code-block:: yaml

   behavior_services:
     - type: aim_server
       priority: 1
       control_radius: 15
       control_center_location:
         x: 256
         y: -171
         z: 15
       model: "MTP"

Notes:

- intended for RSU-side deployment
- usually paired with one or more vehicle-side ``aim_client`` services

Common Service Chains
---------------------

Default local vehicle chain:

.. code-block:: text

   self_informer -> movement_controller

AIM-enabled vehicle chain:

.. code-block:: text

   self_informer -> aim_client -> movement_controller

AIM-enabled RSU chain:

.. code-block:: text

   aim_server

The exact execution order is determined by ``priority``, but the chains above
reflect the intended functional flow.
