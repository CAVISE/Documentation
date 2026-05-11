Attack Framework
================

The adversary framework executes declarative, event-driven attacks against
live behavior services in the simulation runtime. Attack behavior is described
in YAML, converted into structured specs, and evaluated on every simulation
tick against a normalized snapshot of vehicle and RSU service state.

The framework is generic at the orchestration layer. See
:ref:`module-level architecture <attack-framework-architecture>`,
:doc:`behavior-services` for the behavior-service lifecycle and development
template, :doc:`available-attacks` for the builtin attack catalog, and
:doc:`attack-scenario-description` for the YAML reference.

.. _attack-framework-architecture:

.. image:: /_static/images/attack-framework-architecture.png
   :alt: Attack framework architecture
   :class: align-center


Enabling Attacks
----------------

Scenario configs enable attacks through the top-level ``attacks`` list:

.. code-block:: yaml

   attacks:
     - aim_server_response_jamming
     - aim_client_identity_spoofing

Each attack name is resolved to:

.. code-block:: text

   opencda/core/attack/adversary_framework/attacks/<attack-name>/config.yaml

At scenario startup, each YAML file is loaded, parsed into an ``AttackSpec``,
and converted into a runtime ``Attack`` object via ``Attack.from_spec(...)``.

Runtime Integration
-------------------

The framework is evaluated from the main scenario loops. On each tick, the
scenario code:

1. updates vehicle and RSU behavior services,
2. builds a ``SimulationSnapshot``,
3. calls ``AttackManager.evaluate(...)``,
4. resolves live target services through ``CavWorld.resolve_behavior_services``.

The overall per-tick attack evaluation workflow is shown below.

.. image:: /_static/images/attack-framework-workflow.png
   :alt: Attack framework workflow
   :class: align-center


The snapshot passed to the attack framework has the following structure:

.. code-block:: python

   @dataclass(frozen=True, slots=True)
   class NodeSnapshot:
       node_id: str
       node_type: str
       service_states: dict[str, Any]

   @dataclass(frozen=True, slots=True)
   class SimulationSnapshot:
       tick: int
       vehicle_nodes: tuple[NodeSnapshot, ...]
       rsu_nodes: tuple[NodeSnapshot, ...]

``service_states`` contains the latest ``get_state()`` outputs of attached
behavior services, keyed by ``service_type``.

Core Components
---------------

``AttackManager``
^^^^^^^^^^^^^^^^^

``AttackManager`` owns the previous snapshot and advances all configured
attacks against the current snapshot. It is responsible for:

- checking attack start and stop triggers,
- resolving target services for attacks that should run,
- executing active stages,
- emitting ``AttackResult`` objects,
- logging success, stop, and failure outcomes.

If an attack start trigger fires but no target services can be resolved for
that tick, the manager reports that attack execution as failed.

``Attack``
^^^^^^^^^^

``Attack`` is the runtime object built from ``AttackSpec``. It stores:

- the parsed spec,
- runtime lifecycle state,
- ordered stage runtimes,
- per-stage last results.

The default lifecycle is:

- an inactive attack may start when its requirements and start trigger are
  satisfied,
- the first stage starts when the attack becomes active,
- every later stage starts after the previous stage reaches ``success``,
- an attack stops when its stop trigger fires,
- an attack succeeds when all stages complete successfully.

``ConditionEvaluator``
^^^^^^^^^^^^^^^^^^^^^^

Conditions are evaluated against:

- the current and previous ``SimulationSnapshot``,
- the current attack runtime,
- the current stage runtimes.

Supported source kinds are ``snapshot``, ``attack``, and ``stage``.

``TargetResolver``
^^^^^^^^^^^^^^^^^^

Target resolution currently supports one strategy: ``service_state_field``.
The resolver:

1. reads one snapshot field,
2. normalizes its value into one or more node ids,
3. resolves live behavior services for those node ids,
4. optionally filters by ``service_type``.

Builtin Stages
--------------

Builtin stages are auto-registered through ``AttackStageRegistry`` when the
framework module is imported.

``sniffer``
^^^^^^^^^^^

Passive observer that records outputs returned by matched capability handlers.

- Default capability: ``response.observe``
- Supported capabilities:
  ``request.observe``, ``request.submit``, ``response.observe``,
  ``response.submit``, ``command.submit``, ``state.observe``
- Parameters: none

``dropper``
^^^^^^^^^^^

Replaces selected outputs with an empty batch or probabilistically drops items
from iterable outputs.

- Default capability: ``response.submit``
- Supported capabilities:
  ``request.observe``, ``request.submit``, ``response.observe``,
  ``response.submit``, ``command.submit``
- Parameters:
  ``drop_rate`` (``float`` in ``[0.0, 1.0]``, default ``1.0``),
  ``seed`` (optional RNG seed)

``replayer``
^^^^^^^^^^^^

Replays the previous output seen on each matched service/capability binding.

- Default capability: ``response.submit``
- Supported capabilities:
  ``request.observe``, ``request.submit``, ``response.observe``,
  ``response.submit``, ``command.submit``
- Parameters: none

``spoofer``
^^^^^^^^^^^

Rewrites selected fields inside ``TransportMessage`` envelopes or payloads.

- Default capability: ``request.submit``
- Supported capabilities:
  ``request.submit``, ``response.submit``, ``command.submit``
- Parameters:
  required ``rewrites`` list with per-rule ``path``, ``operation``, and
  ``value``

Capabilities
------------

The current cross-service capability vocabulary is:

- ``request.observe``
- ``request.submit``
- ``response.observe``
- ``response.submit``
- ``command.submit``
- ``state.observe``

Stages declare the capabilities they need, and the framework matches them
against each target service's ``capability_bindings`` map.

Interception Model
------------------

Stages do not mutate the framework itself. Instead, they temporarily wrap the
bound methods exposed by behavior-service capability bindings.

In practice, builtin stages install output interceptors on the resolved target
service instances and remove them later through ``deactivate()`` or when the
attack is stopped.

Results and Logging
-------------------

The framework emits ``AttackResult`` objects with:

- ``attack_name``
- ``status``
- ``reason``
- ``stage_history``

Result statuses are:

- ``success``
- ``fail``
- ``stop``

Attack and stage runtime conditions use lifecycle status values such as
``inactive``, ``active``, ``success``, ``fail``, and ``stopped``. Internally,
the runtime also has a ``STARTED`` state, but condition evaluation normalizes
it to ``active``.

The scenario loop currently relies on framework logging for visibility into
attack execution.
