OpenCDA Service Layer
==========

Behavior Service Orchestration
-------------------------------

A behavior service system has been introduced for simulation participants, including
Road-Side Units (RSU) and vehicles.

The ``BehaviorService`` interface defines the protocol that every service attached to
a participant must implement. It describes the service lifecycle:

* ``on_attach`` - initialize the service for a particular participant instance
* ``process`` - process incoming messages and return a typed result
* ``on_detach`` - release service resources before the participant is destroyed

``BehaviorServiceRegistry`` is a global registry that supports:

* registration via the ``@BehaviorServiceRegistry.register`` decorator
* class lookup by service name
* a ``create_service`` factory method

The registry automatically discovers and loads built-in services from the ``services/``
subpackage.

A ``DummyService`` has been added for testing purposes. It accepts text messages and
returns them with an appended suffix, verifying that registration and message routing
work correctly.

Both ``RSUManager`` and ``VehicleManager`` have been updated to support service
configuration and lifecycle management - including config loading from YAML,
attach/detach handling, and message routing by ``service_id``. This unified the
service architecture across vehicles and road-side infrastructure.

AIM Services
------------

``AIMModelManager`` has been extracted from the OpenCDA core into the service layer
to align with the service-based architecture. Three new services were introduced.

**aim-server**

The server-side AIM service. It receives a batch of requests from vehicles,
runs ML inference, and returns predicted trajectories.

**aim-client**

The client-side service, running on each vehicle. It builds a request to the server
with the vehicle's current position, speed, heading, and route.
Upon receiving a response, it generates a movement command for the ``movement-controller``.

**movement-controller**

Accepts movement commands with a target position and controls vehicle motion.

All inter-service communication is routed through typed ``TransportMessage`` objects,
eliminating direct dependencies between components.

Service Priority
----------------

Priority-aware ordering has been added to the behavior service system. Services are
now initialized and processed in ascending order of their numeric ``priority`` field -
a lower value means the service runs first. Priority is configured in the
scenario YAML file.

Attack Framework *(Draft)*
---------------------------

A framework for simulating adversarial attacks on simulation participants has been
introduced.

Core abstractions:

* ``AttackProtocol`` - interface for a concrete attack, composed of stages (``AttackStageProtocol``)
* ``AttackManager`` - orchestrates attacks, manages registries, and collects results
* ``AttackRegistry`` - registry of registered attacks
* ``StageRegistry`` - registry of attack stages
* ``AttackContext`` - execution context passed to an attack at runtime
* ``AttackResult`` - result produced by a completed attack

**Capability System**

A capability binding mechanism (``CapabilityBindings``) has been introduced, linking
named capabilities (``Capability``) to concrete service methods. This allows attacks
and external components to interact with a service through a stable interface,
without knowledge of its internal implementation.

Supported capabilities:

* ``request.observe`` - observe incoming requests
* ``request.submit`` - submit requests
* ``response.observe`` - observe responses
* ``response.submit`` - submit responses
* ``command.submit`` - submit movement commands
* ``state.observe`` - observe service state

**BehaviorService Extensions**

The ``BehaviorService`` protocol has been extended with a ``get_state()`` method that
returns an immutable snapshot of the current service state. State objects have been
implemented for the existing services:

* ``AIMServerState`` - tracked and processed vehicle IDs and counts
* ``AIMClientState`` - attachment status and next target position

**Example Attack**

``AIMClientResponseSniffer`` has been added as a demonstration attack. It uses a
``Sniffer`` stage to intercept AIM server response messages addressed to clients.
