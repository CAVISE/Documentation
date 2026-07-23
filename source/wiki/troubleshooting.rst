Problems and Solutions
======================

**CARLA Error: "Town06 is not found"**

Ensure the city has changed in CARLA, then retry the scenario.

**OpenCDA Error: missing OpenCOOD CUDA extension**

For example:

.. code-block:: text

   ImportError: cannot import name 'roiaware_pool3d_cuda' from
   'opencood.pcdet_utils.roiaware_pool3d' (unknown location)

This means that the selected model requires the custom OpenCOOD CUDA
extensions, but the current OpenCDA image does not provide their compiled
``.so`` files. Build and recreate the container with the CUDA target:

.. code-block:: bash

   ./run.sh build opencda-cuda
   ./run.sh up opencda-cuda

Use the full target instead when the same scenario also communicates with
Artery:

.. code-block:: bash

   ./run.sh build opencda
   ./run.sh up opencda

Verify the extension from inside the OpenCDA container:

.. code-block:: bash

   PYTHONPATH=OpenCOOD python -c \
     "from opencood.pcdet_utils.roiaware_pool3d import roiaware_pool3d_cuda; print(roiaware_pool3d_cuda.__file__)"

The CUDA target is not required for cooperative perception models that do not
use these extensions. Such models should use ``opencda-minimal`` or
``opencda-protobuf`` when Artery support is also required.

**Display Errors in Artery**

If you see:

.. code-block:: text

   qt.qpa.xcb: could not connect to display :0

run on the host:

.. code-block:: bash

   xhost +local:docker
