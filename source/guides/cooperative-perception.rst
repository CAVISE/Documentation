Cooperative Perception
======================

Run an OpenCOOD model over data from CAVs and RSUs. Complete
:doc:`/getting-started/first-simulation` first and keep CARLA running.

Prepare the Image and Model
---------------------------

The following PointPillar example uses ``opencda-coperception``. From the
**CAVISE root on Linux/WSL**:

.. code-block:: bash

   ./run.sh build opencda-coperception
   ./run.sh up opencda-coperception
   docker exec -it opencda bash

Inside OpenCDA, set ``CARLA_HOST`` as described in :ref:`carla-client-shell`.
Run a bounded baseline:

.. code-block:: bash

   python opencda.py -t 2cars_2rsu_coperception \
     --carla-host "$CARLA_HOST" --with-coperception \
     --model-id pointpillar-late-opv2v-30 --ticks 200 --save-vis

OpenCDA resolves the requested checkpoint before starting the simulation.
Missing bundles are fetched into the sibling ``models`` directory. See
:doc:`/models` for model IDs, custom directories, metadata validation, and
offline use. The first run needs network access if the bundle is not cached.

Choose the Right Target
-----------------------

``opencda-coperception`` includes OpenCOOD without its custom CUDA extensions.
Use ``opencda-cuda`` for models needing those extensions, such as FPV-RCNN.
Use the full ``opencda`` target when also enabling Artery. All these
images use a CUDA runtime. A smaller target is not a CPU-only image.
See :doc:`/reference/runtime` for the complete target table.

Inspect the Results
-------------------

``--save-vis`` saves rendered predictions. ``--save-npy`` saves prediction
arrays. ``--show-video-vis`` opens live visualization and needs a display.
Output locations and interpretation are covered in :doc:`results`.

Once the baseline works, continue to :doc:`advcp` to compare a run with and
without a perception attack.
