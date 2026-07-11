Analysis of Neural Network Architectures for Multi-Task Trajectory Prediction in Autonomous Driving Systems
==========================================================================================================

Introduction
------------

The presented models GNN_mtl_gnn and GNN_mtl_mlp are implementations of deep neural
networks for the Multi-Task Learning (MTL) problem in the context of trajectory control
for autonomous vehicles at intersections.

Architectural Overview
----------------------

General Concept
~~~~~~~~~~~~~~~

Both models follow a unified multi-task learning paradigm, where a single network
simultaneously solves several related prediction tasks. The key difference between
the architectures lies in how they handle spatial dependencies between traffic participants.

Input and Output Parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Input data:**

* Input vector dimensionality: 5 features per object
* Includes: coordinates (x, y), speed, heading, vehicle class

**Output data:**

* Output dimensionality: 60 values (30 × 2)
* Interpretation: trajectory prediction over 30 time steps, where 2 coordinates (x, y)
  are predicted for each step

GNN_mtl_gnn Model: Graph Neural Network Approach
-------------------------------------------------

Architectural Composition
~~~~~~~~~~~~~~~~~~~~~~~~~~

The model consists of several sequential processing blocks.

**1. Feature Encoding Block**

linear1: 5 → 64 + ReLU

linear2: 64 → hidden_channels + ReLU

This block performs the initial transformation of raw features into a high-dimensional
hidden representation space.

**2. Residual Learning Block**

linear3: hidden_channels → hidden_channels + ReLU + skip connection

linear4: hidden_channels → hidden_channels + ReLU + skip connection

The use of residual connections allows the network to train effectively on deep
architectures by preventing the vanishing gradient problem. Each layer learns to
predict the residual function relative to its input.

**3. Graph Convolution Block**

conv1: GraphConv(hidden_channels → hidden_channels) + ReLU

conv2: GraphConv(hidden_channels → hidden_channels) + ReLU

This is a critically important architectural component. Graph convolutional layers
aggregate information from neighboring nodes in the graph via the ``edge_index``
structure. The model captures interactions between vehicles.

**4. Trajectory Prediction Head**

linear5: hidden_channels → 60

The final fully connected layer projects the hidden representation into the space
of predicted trajectories.

Algorithm
~~~~~~~~~

1. **Initialization:** Each vehicle is represented as a graph node with a 5-dimensional
   feature vector
2. **Feature encoding:** Input data is sequentially transformed through two linear layers,
   increasing representational capacity
3. **Representation enrichment:** Two residual blocks deepen the feature space while
   preserving gradient flow
4. **Graph aggregation:** Convolutional operations propagate information across the graph,
   where each node updates its representation based on the states of its neighbors,
   weighted by graph topology
5. **Trajectory decoding:** The final linear projection generates coordinates of future positions

Advantages of the Approach
~~~~~~~~~~~~~~~~~~~~~~~~~~~

* **Explicit interaction modeling:** The graph structure naturally encodes spatial
  relationships between agents
* **Permutation invariance:** The ordering of vehicles does not affect the result
* **Scalability:** The architecture efficiently handles a variable number of traffic participants

GNN_mtl_mlp Model: Multi-Layer Perceptron Approach
---------------------------------------------------

Architectural Differences
~~~~~~~~~~~~~~~~~~~~~~~~~~

The GNN_mtl_mlp model is identical to GNN_mtl_gnn in all aspects except one critical change:

conv1: Linear(hidden_channels → hidden_channels) + ReLU

conv2: Linear(hidden_channels → hidden_channels) + ReLU

The graph convolutional layers are replaced with standard fully connected (Linear) layers.
This means that the ``edge_index`` parameter is ignored, and each vehicle is processed
independently.

Algorithm
~~~~~~~~~

The algorithm is analogous to the GNN version, with one key difference at step 4:

1. **Independent processing:** Instead of graph aggregation, standard matrix transformations
   are applied without considering the interaction structure

Role in the Experiment
~~~~~~~~~~~~~~~~~~~~~~

This model serves as a baseline for evaluating the importance of graph structure.
Comparing the performance of the two models allows quantifying the contribution of
relational information to prediction accuracy.

Technical Implementation Details
---------------------------------

Reproducibility
~~~~~~~~~~~~~~~

Setting ``torch.manual_seed(21)`` ensures deterministic weight initialization, which
is critical for a valid comparison between models.

Nonlinearities
~~~~~~~~~~~~~~

The use of ReLU activations after each transformation layer introduces the nonlinearity
necessary for modeling complex dependencies in the data.

Residual Connections
~~~~~~~~~~~~~~~~~~~~

The ``+ x`` operations implement skip connections, allowing gradients to pass directly
through blocks, which stabilizes training of deep networks.

Application in AIM Systems
--------------------------

In the context of Autonomous Intersection Management, these models address the problem
of predicting future vehicle trajectories based on their current state and relative positions.

**Typical usage scenario:**

1. The central intersection management system receives data about all approaching vehicles
2. A graph is formed where edges connect potentially interacting agents
3. The model generates trajectory predictions over a horizon of ~3–5 seconds
4. The planning system uses the predictions to optimize intersection traversal and
   prevent collisions

Conclusion
----------

The presented architectures demonstrate two approaches to the trajectory prediction
problem: one with explicit interaction modeling through graph neural networks, and one
without it through classical multi-layer perceptrons. Both models employ modern deep
learning techniques (residual connections, multi-task learning) and are specialized
for real-time operation in safety-critical autonomous vehicle control systems.
