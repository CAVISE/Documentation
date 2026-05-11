Attack Configuration Reference
==============================

This document describes the YAML format currently supported by the adversary
framework in ``opencda/core/attack/adversary_framework``.

Each attack config file must contain one top-level ``attack`` object.

Example
-------

.. code-block:: yaml

   attack:
     name: aim_client_request_speed_spoofing

     requirements:
       all:
         - source:
             kind: snapshot
             node_type: rsu
             service_type: aim_server
           verb: exists
         - source:
             kind: snapshot
             node_type: vehicle
             service_type: aim_client
           verb: exists

     start_trigger:
       source:
         kind: snapshot
         node_type: rsu
         service_type: aim_server
         field: tracked_vehicle_count
       verb: increased
       value: 1

     stop_trigger:
       source:
         kind: snapshot
         node_type: rsu
         service_type: aim_server
         field: tracked_vehicle_count
       verb: eq
       value: 0

     targets:
       kind: service_state_field
       source:
         kind: snapshot
         node_type: rsu
         service_type: aim_server
         field: tracked_vehicle_ids
       resolve_to:
         node_type: vehicle
         service_type: aim_client
       selection: all

     stages:
       - id: spoof_aim_client_requests
         type: spoofer
         capabilities:
           - request.submit
         params:
           rewrites:
             - path: payload.speed
               operation: add
               value: 5.0
             - path: payload.yaw
               operation: add
               value: 10.0
         stage_stop_trigger:
           source:
             kind: snapshot
             node_type: rsu
             service_type: aim_server
             field: tracked_vehicle_count
           verb: eq
           value: 0

Top-Level Attack Fields
-----------------------

``attack.name``
^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: yes
| ``Meaning``: Unique runtime attack name.

``attack.requirements``
^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``ConditionSpec`` | ``Required``: no
| ``Meaning``: Preconditions that must be satisfied before the attack may start.
| ``Default``: If omitted, requirements are treated as satisfied.

``attack.start_trigger``
^^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``ConditionSpec`` | ``Required``: effectively yes
| ``Meaning``: Condition that starts the attack.
| ``Default``: If omitted, the attack never starts.

``attack.stop_trigger``
^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``ConditionSpec`` | ``Required``: no
| ``Meaning``: Condition that stops an active attack before stage execution on that tick.
| ``Default``: If omitted, there is no attack-level stop trigger.

``attack.targets``
^^^^^^^^^^^^^^^^^^

| ``Type``: ``TargetSpec`` | ``Required``: usually yes
| ``Meaning``: Describes how live target services are resolved from the current snapshot.
| ``Default``: If omitted, no target services are resolved.

``attack.stages``
^^^^^^^^^^^^^^^^^

| ``Type``: ``list[StageSpec]`` | ``Required``: no
| ``Meaning``: Ordered list of attack stages.
| ``Default``: Empty list.

Condition Specification
-----------------------

Conditions are used by:

- ``attack.requirements``
- ``attack.start_trigger``
- ``attack.stop_trigger``
- ``stage.requirements``
- ``stage.stage_start_trigger``
- ``stage.stage_stop_trigger``

A condition can be:

- a leaf predicate,
- an ``all`` group,
- an ``any`` group.

Leaf predicate example
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: yaml

   source:
     kind: snapshot
     node_type: rsu
     service_type: aim_server
     field: tracked_vehicle_count
   verb: increased
   value: 1

Grouped condition example
^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: yaml

   all:
     - source:
         kind: snapshot
         node_type: rsu
         service_type: aim_server
       verb: exists
     - any:
         - source:
             kind: snapshot
             node_type: vehicle
             service_type: aim_client
           verb: exists
         - source:
             kind: snapshot
             node_type: vehicle
             service_type: movement_controller
           verb: exists

Rules
^^^^^

- A condition must define either a leaf predicate, ``all``, or ``any``.
- ``all`` and ``any`` cannot appear at the same level together.
- Nested condition groups are supported.

Source Fields
-------------

Every leaf predicate contains a ``source`` object.

``source.kind``
^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: yes
| ``Supported values``: ``snapshot``, ``attack``, ``stage``

Snapshot Sources
~~~~~~~~~~~~~~~~

Snapshot sources read values from the current or previous
``SimulationSnapshot``.

Example:

.. code-block:: yaml

   source:
     kind: snapshot
     node_type: rsu
     node_id: rsu-1
     service_type: aim_server
     field: tracked_vehicle_count

``source.node_type``
^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Supported values``: ``vehicle``, ``rsu``
| ``Meaning``: Restricts matching nodes by type.
| ``Default``: If omitted, both vehicle and RSU nodes are searched.

``source.node_id``
^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Restricts matching nodes by exact node id.

``source.service_type``
^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Reads data from the state of one behavior service.

``source.field``
^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Field to read from the matched object.

Notes:

- If ``service_type`` is set, ``field`` is read from that service's state map.
- If ``service_type`` is omitted, ``field`` is read from the matched
  ``NodeSnapshot``.
- If ``field`` is omitted, the whole matched object is used.
- Current node-level snapshot fields are ``node_id``, ``node_type``, and
  ``service_states``.

Attack Sources
~~~~~~~~~~~~~~

Attack sources read runtime fields from the current attack instance.

Example:

.. code-block:: yaml

   source:
     kind: attack
     attack_name: aim_client_response_sniffer
     field: status

``source.attack_name``
^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Restricts the condition to a specific attack name.
| ``Default``: If omitted, the current attack is used.

``source.field``
^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: usually yes
| ``Stable supported value``: ``status``

Stage Sources
~~~~~~~~~~~~~

Stage sources read runtime fields from one or more stages of the current
attack.

Example:

.. code-block:: yaml

   source:
     kind: stage
     attack_name: aim_client_response_sniffer
     stage_id: sniff_aim_client_responses
     field: status

``source.attack_name``
^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Restricts the condition to a specific attack name.

``source.stage_id``
^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Restricts the condition to one configured stage id.
| ``Default``: If omitted, all stages of the current attack are considered.

``source.field``
^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: usually yes
| ``Stable supported value``: ``status``

Supported Verbs
---------------

Snapshot verbs
^^^^^^^^^^^^^^

The following verbs are supported for ``source.kind: snapshot``:

- ``exists``
- ``eq``
- ``gt``
- ``gte``
- ``lt``
- ``lte``
- ``changed``
- ``increased``
- ``decreased``
- ``became``
- ``added``
- ``removed``

Notes:

- ``increased`` and ``decreased`` compare the current snapshot with the
  previous tick.
- ``added`` and ``removed`` are intended for collection-like values.

Runtime verbs
^^^^^^^^^^^^^

The following verbs are supported for ``source.kind: attack`` and
``source.kind: stage``:

- ``exists``
- ``eq``
- ``gt``
- ``gte``
- ``lt``
- ``lte``
- ``changed``
- ``became``
- ``increased``
- ``decreased``

Notes:

- ``added`` and ``removed`` are not supported for runtime sources.
- ``increased`` and ``decreased`` use delta ``1`` if ``value`` is omitted.

The ``value`` Field
-------------------

``value``
^^^^^^^^^

| ``Type``: ``any`` | ``Required``: depends on the verb
| ``Meaning``: Comparison target or delta parameter.

Typical usage:

- ``eq``, ``gt``, ``gte``, ``lt``, ``lte``: ``value`` should be provided.
- ``increased``, ``decreased``: ``value`` is the minimum delta.
- ``became``: ``value`` is the new value that must appear this tick.
- ``added``, ``removed``: ``value`` is the specific collection item.

Target Specification
--------------------

Targets describe how the attack resolves live behavior service instances.

Example:

.. code-block:: yaml

   targets:
     kind: service_state_field
     source:
       kind: snapshot
       node_type: rsu
       service_type: aim_server
       field: tracked_vehicle_ids
     resolve_to:
       node_type: vehicle
       service_type: aim_client
     selection: first

``targets.kind``
^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: yes
| ``Currently supported value``: ``service_state_field``

``targets.source``
^^^^^^^^^^^^^^^^^^

| ``Type``: ``TriggerSourceSpec`` | ``Required``: yes
| ``Meaning``: Snapshot source whose value must resolve to one node id or a collection of node ids.

``targets.resolve_to``
^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``object`` | ``Required``: yes
| ``Meaning``: Describes which live services are resolved for every target node id.

``targets.resolve_to.node_type``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: yes
| ``Expected values``: ``vehicle``, ``rsu``
| ``Meaning``: Informational type hint used by diagnostics and availability logging.

``targets.resolve_to.service_type``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Meaning``: Optional service filter passed to the runtime service resolver.
| ``Default``: If omitted, all behavior services of each resolved node are returned.

``targets.selection``
^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: no
| ``Supported values``: ``all``, ``first``
| ``Default``: ``all``

Notes:

- ``service_state_field`` target resolution normalizes the source value into a
  set of node ids.
- A scalar string becomes one target node id.
- A tuple, list, set, or frozenset contributes every string item it contains.

Stage Specification
-------------------

Each item in ``attack.stages`` describes one stage in the ordered runtime
pipeline.

Example:

.. code-block:: yaml

   stages:
     - id: spoof_selected_aim_client_position
       type: spoofer
       capabilities:
         - request.submit
       params:
         rewrites:
           - path: payload.position.x
             operation: add
             value: -20.0
       requirements: ...
       stage_start_trigger: ...
       stage_stop_trigger: ...

``stage.id``
^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: yes
| ``Meaning``: Unique stage id inside the attack.
| ``Notes``: Duplicate ids are rejected.

``stage.type``
^^^^^^^^^^^^^^

| ``Type``: ``string`` | ``Required``: yes
| ``Currently built-in``: ``sniffer``, ``dropper``, ``replayer``, ``spoofer``

``stage.capabilities``
^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``list[string]`` | ``Required``: no
| ``Meaning``: Explicit capability set used to match target services.
| ``Default``: If omitted, the stage's built-in default capabilities are used.

The current capability vocabulary is:

- ``request.observe``
- ``request.submit``
- ``response.observe``
- ``response.submit``
- ``command.submit``
- ``state.observe``

``stage.params``
^^^^^^^^^^^^^^^^

| ``Type``: ``mapping`` | ``Required``: no
| ``Meaning``: Stage-specific configuration payload.

Builtin stage params:

- ``sniffer``: no params
- ``replayer``: no params
- ``dropper``:
  ``drop_rate`` (float in ``[0.0, 1.0]``, default ``1.0``),
  optional ``seed``
- ``spoofer``:
  required ``rewrites`` sequence

``stage.requirements``
^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``ConditionSpec`` | ``Required``: no
| ``Meaning``: Additional preconditions for this stage only.
| ``Default``: No extra stage-level requirement.

``stage.stage_start_trigger``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``ConditionSpec`` | ``Required``: no
| ``Meaning``: Explicit condition for starting this stage.
| ``Default``: The first stage starts when the attack becomes active. Every later stage starts when the previous stage reaches ``success``.

``stage.stage_stop_trigger``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

| ``Type``: ``ConditionSpec`` | ``Required``: no
| ``Meaning``: Explicit condition for stopping an active stage.
| ``Default``: A successful ``execute()`` immediately marks the stage as ``success``.

Spoofer Rewrite Rules
---------------------

``spoofer`` stages use ``params.rewrites``. Each rewrite rule must contain:

- ``path``: dot-separated field path such as ``payload.position.x``
- ``operation``: ``set``, ``add``, or ``multiply``
- ``value``: operand for the selected operation

Example:

.. code-block:: yaml

   params:
     rewrites:
       - path: src_owner_id
         operation: set
         value: cav-spoofed
       - path: payload.speed
         operation: add
         value: 8.0

Runtime Status Values
---------------------

Use the following values when checking ``field: status`` in ``attack`` or
``stage`` conditions:

- ``inactive``
- ``active``
- ``success``
- ``fail``
- ``stopped``

Note:

- The runtime also uses an internal ``STARTED`` state, but condition
  evaluation normalizes it to ``active``.

Default Runtime Behavior
------------------------

Attack defaults
^^^^^^^^^^^^^^^

- Omitted ``requirements`` means requirements are treated as satisfied.
- Omitted ``start_trigger`` means the attack never starts.
- Omitted ``stop_trigger`` means there is no attack-level stop trigger.
- Omitted ``targets`` means no target services can be resolved.

Stage defaults
^^^^^^^^^^^^^^

- Omitted ``requirements`` means no extra stage-level requirement.
- Omitted ``stage_start_trigger`` means:

  - the first stage starts when the attack is active,
  - later stages start after the previous stage succeeds.

- Omitted ``stage_stop_trigger`` means a successful ``execute()`` immediately
  marks the stage as ``success``.

Target resolution failure
^^^^^^^^^^^^^^^^^^^^^^^^^

If an attack start trigger fires but target resolution returns no services,
the framework reports that attack execution as failed for the current tick.
