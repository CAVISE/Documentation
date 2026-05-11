Behavior Services
=================

Behavior services are modular application-layer components attached to
vehicles and RSUs. They exchange typed ``TransportMessage`` envelopes, expose
state snapshots, and run in a deterministic per-tick execution order.

This service layer is also the attachment point used by the adversary
framework. Attack stages do not patch managers directly; they wrap capability
bindings exported by behavior services. See :doc:`attack-framework` for the
attack-side architecture.

What a Service Is
-----------------

A behavior service is any object implementing the
``BehaviorService`` protocol from
``opencda/core/application/behavior/behavior_service_protocol.py``.

Each service must define:

- ``service_type``: stable string identifier used in config and message routing
- ``priority``: integer execution order, where smaller values run earlier
- ``capability_bindings``: exported capability-to-callable map
- ``on_attach(owner)``: owner-specific initialization hook
- ``process(messages)``: per-tick message processing entrypoint
- ``get_state()``: immutable state snapshot for runtime inspection
- ``on_detach()``: cleanup hook

At runtime, the owner is either a ``VehicleManager`` or an ``RSUManager``.

Registration and Discovery
--------------------------

Builtin service packages live under:

.. code-block:: text

   opencda/core/application/behavior/services/

The package-level loader imports all builtin service modules on startup, and
concrete services self-register through
``@BehaviorServiceRegistry.register``. A service becomes instantiable by
declaring a unique ``service_type`` and importing its module.

Managers create services from scenario YAML:

.. code-block:: yaml

   behavior_services:
     - type: self_informer
     - type: aim_client
       debug: true
     - type: movement_controller

The ``type`` field is resolved through ``BehaviorServiceRegistry`` and
instantiated via ``create_service(...)``.

Manager-Side Lifecycle
----------------------

``VehicleManager`` and ``RSUManager`` use the same lifecycle:

1. read ``behavior_services`` from config
2. instantiate services through the registry
3. validate that every service implements the protocol
4. sort services by ``priority``
5. call ``on_attach(...)`` for each service
6. on every simulation tick, execute ``update_behavior_services(...)``
7. on shutdown, call ``on_detach()`` in reverse order

The per-tick execution flow is shared by both managers:

1. validate incoming ``TransportMessage`` objects
2. keep only messages addressed to the current node or valid broadcasts
3. group messages by ``dst_service_type``
4. call ``process(...)`` for each attached service in priority order
5. immediately feed self-addressed outputs back into the same tick
6. store non-local outputs in ``behavior_service_results``
7. persist the latest ``get_state()`` result into ``behavior_service_states``

That shared pipeline is the main reason new services should follow a common
implementation shape. If every service uses ad hoc control flow, it becomes
harder to reason about priority, message routing, state collection, and attack
interception.

Common Message Model
--------------------

Services communicate through typed transport envelopes:

.. code-block:: python

   @dataclass(frozen=True)
   class TransportMessage(Generic[payloadT]):
       src_owner_id: str
       src_service_type: str
       dst_owner_id: str
       dst_service_type: str
       payload: payloadT

Important routing constants:

- ``BROADCAST_OWNER_ID``: broadcast recipient at the node level
- ``BROADCAST_SERVICE_TYPE``: broadcast recipient at the service level

This gives services a uniform way to:

- publish state-like responses to sibling services
- send commands to another local service on the same node
- send requests or responses to services on other nodes

Capabilities
------------

Each service exposes a ``capability_bindings`` map keyed by the shared
capability vocabulary:

- ``request.observe``
- ``request.submit``
- ``response.observe``
- ``response.submit``
- ``command.submit``
- ``state.observe``

These bindings serve two purposes:

- they document the service's externally visible interaction points
- they provide stable hooks for the attack framework to observe or alter
  service behavior

If a service has no meaningful externally hooked operations, it may expose an
empty binding map, as ``movement_controller`` currently does.

Recommended Development Template
--------------------------------

New services should be implemented with approximately the same internal
template, even when the business logic differs. The goal is not identical code
style for its own sake, but predictable execution semantics across the whole
service layer.

Recommended package layout:

.. code-block:: text

   services/<service_name>/
     __init__.py
     service.py
     messages.py
     types.py
     utils.py

Recommended class skeleton:

.. code-block:: python

   @BehaviorServiceRegistry.register
   class ExampleService:
       service_type = "example_service"
       priority = 50

       @property
       def capability_bindings(self) -> CapabilityBindings:
           return {
               Capability.REQUEST_OBSERVE: self._observe_requests,
               Capability.RESPONSE_SUBMIT: self._build_responses,
               Capability.STATE_OBSERVE: self.get_state,
           }

       def __init__(self, priority: int = 50, **config: Any) -> None:
           self.priority = priority
           self._owner_ref = None
           self._runtime_state = None

       def on_attach(self, owner: Any) -> None:
           self._owner_ref = weakref.ref(owner)

       def get_state(self) -> ExampleServiceState:
           return ExampleServiceState(...)

       def process(
           self,
           messages: Sequence[TransportMessage[ExampleRequest]],
       ) -> tuple[TransportMessage[ExampleResponse], ...]:
           observed = self._observe_requests(messages)
           self._update_runtime_state(observed)
           return self._build_responses(observed)

       def on_detach(self) -> None:
           self._owner_ref = None

Stages Every Service Should Follow
----------------------------------

New services should follow the same conceptual processing stages on every
tick, even if some stages are trivial for a particular implementation:

1. input filtering
2. observation or decoding of relevant messages
3. internal state update or decision making
4. output construction or command emission
5. state snapshot exposure

In practice this usually means:

- keep message selection separate from business logic
- update local runtime fields before building outbound messages
- return typed ``TransportMessage`` objects instead of mutating shared state
- make ``get_state()`` reflect the latest meaningful service snapshot

This common stage model is important for three reasons:

- it keeps multi-service execution predictable when priorities differ
- it makes attack interception consistent because bindings always wrap known
  stages
- it reduces friction when implementing metrics, debugging, or adding new
  services

Builtins as Reference Implementations
-------------------------------------

The current builtin services already follow this template with different
complexity levels.

``self_informer``
^^^^^^^^^^^^^^^^^

- observes the owner's current pose and speed
- updates cached local fields
- emits a broadcast ``SelfInformerResponse``
- exposes a compact owner-state snapshot

``movement_controller``
^^^^^^^^^^^^^^^^^^^^^^^

- filters local control requests
- picks the latest valid movement command
- updates local target state
- invokes ``owner.control(...)``
- emits no outbound messages

``aim_client``
^^^^^^^^^^^^^^

- observes AIM server responses and local self-informer data
- updates its current control trajectory
- emits movement-controller commands
- emits the next request to ``aim_server``
- exposes its active trajectory as service state

``aim_server``
^^^^^^^^^^^^^^

- observes incoming AIM requests
- forwards them to ``AIMModelManager``
- emits AIM response messages
- exposes tracked-vehicle state through ``get_state()``

Configuration Examples
----------------------

Default vehicle pipeline:

.. code-block:: yaml

   vehicle_base:
     behavior_services:
       - type: self_informer
       - type: movement_controller

AIM-style setup with both vehicle and RSU services:

.. code-block:: yaml

   scenario:
     rsu_list:
       - id: 1
         behavior_services:
           - type: aim_server
             priority: 1

     single_cav_list:
       - id: 100
         behavior_services:
           - type: self_informer
           - type: aim_client
             debug: true
           - type: movement_controller

Implementation Rules
--------------------

When adding a new service, keep these rules fixed unless there is a strong
architectural reason not to:

- use one unique ``service_type`` per service
- keep ``priority`` explicit and meaningful
- export stable ``capability_bindings`` for the stages you want observable
- keep ``process(...)`` deterministic for the same inputs
- keep ``get_state()`` immutable and cheap to consume
- prefer helper methods for each processing stage over one monolithic
  ``process(...)``
- clean up all owner-dependent state in ``on_detach()``

In short, services are expected to differ in logic, not in lifecycle shape.
That consistency is what makes the service framework composable and what keeps
the attack framework, metrics, and scenario runtime aligned.
