Available Attacks
=================

AIM Server Response Jamming
---------------------------

``aim_server_response_jamming`` drops the ``AIMServerResponse`` batch emitted
by the RSU ``aim_server`` service. This simulates downlink channel jamming or
complete delivery loss for AIM responses.

The attack starts when an AIM-enabled RSU begins tracking vehicles and stops
when the RSU no longer tracks any vehicles.

AIM Server Response Replay
--------------------------

``aim_server_response_replay`` replays the previous batch of
``AIMServerResponse`` messages produced by the RSU ``aim_server`` service.
This makes connected vehicles consume stale trajectory outputs instead of the
latest predictions.

The attack starts when an AIM-enabled RSU begins tracking vehicles and stops
when the RSU no longer tracks any vehicles. The first intercepted response
batch is stored as-is, and the replay effect begins from the next batch.

AIM Client Request Speed Spoofing
---------------------------------

``aim_client_request_speed_spoofing`` rewrites outgoing
``AIMServerRequest`` messages produced by each targeted ``aim_client``. The
configured spoofer biases the reported speed and yaw before the request is sent
to the RSU.

The attack starts when an AIM-enabled RSU begins tracking vehicles and stops
when the RSU no longer tracks any vehicles.

AIM Client Response Sniffer
---------------------------

``aim_client_response_sniffer`` passively observes
``AIMServerResponse`` messages consumed by targeted ``aim_client`` services.
The sniffer stage does not rewrite traffic; it only installs observers on the
matched response capability handlers.

The attack starts when an AIM-enabled RSU begins tracking vehicles and stops
when the RSU no longer tracks any vehicles.

AIM Client Request Position Spoofing
------------------------------------

``aim_client_request_position_spoofing`` rewrites the outgoing
``AIMServerRequest.position`` reported by one tracked ``aim_client``. The
configured attack starts only after at least two vehicles are inside the AIM
zone, then selects one tracked client and biases its reported longitudinal
position before the request is sent to the RSU.

The attack stops once the RSU no longer tracks any vehicles.

AIM Client Identity Spoofing
----------------------------

``aim_client_identity_spoofing`` forces one tracked ``aim_client`` to emit
outgoing ``AIMServerRequest`` messages under a synthetic identity. The
configured attack starts only after at least two vehicles are inside the AIM
zone. Both the transport envelope ``src_owner_id`` and ``payload.vehicle_id``
are rewritten to ``cav-spoofed``.

The attack stops once the RSU no longer tracks any vehicles.

AIM Client Reservation Stealing
-------------------------------

``aim_client_reservation_stealing`` targets one tracked ``aim_client`` and
combines request position spoofing with speed inflation. The configured attack
starts only after at least two vehicles are inside the AIM zone. The result is
an outgoing ``AIMServerRequest`` that makes the attacker appear closer to the
conflict zone and moving faster than it really is.

The attack stops once the RSU no longer tracks any vehicles.

AIM Server Request Replay
-------------------------

``aim_server_request_replay`` replays the previous batch of
``AIMServerRequest`` messages observed by the RSU ``aim_server`` service.
This makes the AIM model consume stale client state instead of the latest
uplink batch.

The attack starts when an AIM-enabled RSU begins tracking vehicles and stops
when the RSU no longer tracks any vehicles. The first intercepted request
batch is stored as-is, and the replay effect begins from the next batch.

AIM Server Request DDoS
-----------------------

``aim_server_request_ddos`` probabilistically drops incoming
``AIMServerRequest`` messages observed by the RSU ``aim_server`` service.
The builtin config uses a ``drop_rate`` of ``0.3`` to simulate partial uplink
loss or overload on the request path.

The attack starts when an AIM-enabled RSU begins tracking vehicles and stops
when the RSU no longer tracks any vehicles.
