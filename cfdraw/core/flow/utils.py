import io

import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

from PIL import Image
from typing import Set
from typing import Dict
from typing import List
from typing import Tuple
from typing import Optional
from typing import NamedTuple
from dataclasses import asdict

from .core import Node
from .core import Flow
from .core import NodeModel
from .core import WorkflowModel
from .core import InjectionModel
from ..toolkit.misc import truncate_string_to_length
from ..toolkit.data_structures import Item


class ToposortResult(NamedTuple):
    in_edges: Dict[str, Set[str]]
    hierarchy: List[List[Item[Node]]]
    edge_labels: Dict[Tuple[str, str], str]
    reachable: Set[str]


def toposort(workflow: Flow) -> ToposortResult:
    in_edges: Dict[str, Set[str]] = {item.key: set() for item in workflow}
    out_degrees = {item.key: 0 for item in workflow}
    edge_labels: Dict[Tuple[str, str], str] = {}
    for item in workflow:
        visited = set()
        dst_key = item.key
        for injection in item.data.injections:
            in_edges[injection.src_key].add(dst_key)
            if injection.src_key not in visited:
                visited.add(injection.src_key)
                out_degrees[dst_key] += 1
            label_key = (dst_key, injection.src_key)
            edge_label = str(injection.dst_hierarchy)
            existing_label = edge_labels.get(label_key)
            if existing_label is None:
                edge_labels[label_key] = edge_label
            else:
                edge_labels[label_key] = f"{existing_label}, {edge_label}"
    for k, v in edge_labels.items():
        edge_labels[k] = truncate_string_to_length(v, 25)

    ready = [k for k, v in out_degrees.items() if v == 0]
    result = []
    while ready:
        layer = ready.copy()
        result.append(layer)
        ready.clear()
        for dep in layer:
            for node in in_edges[dep]:
                out_degrees[node] -= 1
                if out_degrees[node] == 0:
                    ready.append(node)

    if len(workflow) != sum(map(len, result)):
        raise ValueError("cyclic dependency detected")

    hierarchy = [list(map(workflow.get, layer)) for layer in result]
    reachable = {item.key for item in workflow}
    return ToposortResult(in_edges, hierarchy, edge_labels, reachable)  # type: ignore


def get_dependency_path(workflow: Flow, target: str) -> ToposortResult:
    reachable = workflow.get_reachable(target)
    in_edges, raw_hierarchy, edge_labels, _ = toposort(workflow)
    hierarchy = []
    for raw_layer in raw_hierarchy:
        layer = []
        for item in raw_layer:
            if item.key in reachable:
                layer.append(item)
        if layer:
            hierarchy.append(layer)
    return ToposortResult(in_edges, hierarchy, edge_labels, reachable)


def render_workflow(
    workflow: Flow,
    *,
    target: Optional[str] = None,
    figsize: Optional[Tuple[int, int]] = None,
    fig_w_ratio: int = 4,
    fig_h_ratio: int = 3,
    dpi: int = 200,
    node_size: int = 2000,
    node_shape: str = "s",
    node_color: str = "lightblue",
    layout: str = "multipartite_layout",
) -> Image.Image:
    # setup graph
    G = nx.DiGraph()
    if target is None:
        target = workflow.last.key  # type: ignore
    in_edges, hierarchy, edge_labels, _ = get_dependency_path(workflow, target)
    # setup plt
    if figsize is None and layout == "multipartite_layout":
        fig_w = max(fig_w_ratio * len(hierarchy), 8)
        fig_h = fig_h_ratio * max(map(len, hierarchy))
        figsize = (fig_w, fig_h)
    plt.figure(figsize=figsize, dpi=dpi)
    box = plt.gca().get_position()
    plt.gca().set_position([box.x0, box.y0, box.width * 0.8, box.height])
    # map key to indices
    key2idx: Dict[str, int] = {}
    for layer in hierarchy:
        for node in layer:
            key2idx[node.key] = len(key2idx)
    # add nodes
    for i, layer in enumerate(hierarchy):
        for node in layer:
            G.add_node(key2idx[node.key], subset=f"layer_{i}")
    # add edges
    for dep, links in in_edges.items():
        for link in links:
            if dep not in key2idx or link not in key2idx:
                continue
            label = edge_labels[(link, dep)]
            G.add_edge(key2idx[dep], key2idx[link], label=label)
    # calculate positions
    layout_fn = getattr(nx, layout, None)
    if layout_fn is None:
        raise ValueError(f"unknown layout: {layout}")
    pos = layout_fn(G)
    # draw the nodes
    nodes_styles = dict(
        node_size=node_size,
        node_shape=node_shape,
        node_color=node_color,
    )
    nx.draw_networkx_nodes(G, pos, **nodes_styles)
    node_labels_styles = dict(
        font_size=18,
    )
    nx.draw_networkx_labels(G, pos, **node_labels_styles)
    # draw the edges
    nx_edge_labels = nx.get_edge_attributes(G, "label")
    nx.draw_networkx_edges(
        G,
        pos,
        arrows=True,
        arrowstyle="-|>",
        arrowsize=16,
        node_size=nodes_styles["node_size"],
        node_shape=nodes_styles["node_shape"],
    )
    nx.draw_networkx_edge_labels(G, pos, edge_labels=nx_edge_labels)
    # draw captions
    patches = [
        mpatches.Patch(color=node_color, label=f"{idx}: {key}")
        for key, idx in key2idx.items()
    ]
    plt.legend(handles=patches, bbox_to_anchor=(1, 0.5), loc="center left")
    # render
    plt.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    return Image.open(buf)


def to_data_model(
    flow: Flow,
    *,
    target: str,
    intermediate: Optional[List[str]] = None,
    return_if_exception: bool = False,
    verbose: bool = False,
) -> WorkflowModel:
    nodes: List[NodeModel] = []
    for node_item in flow:
        node = node_item.data
        if node.key is None:
            raise ValueError(f"node key cannot be None ({node})")
        nodes.append(
            NodeModel(
                key=node.key,
                type=node.__identifier__,
                data=node.data,
                injections=[InjectionModel(**asdict(d)) for d in node.injections],
                offload=node.offload,
                lock_key=node.lock_key,
            )
        )
    return WorkflowModel(
        target=target,
        intermediate=intermediate,
        nodes=nodes,
        return_if_exception=return_if_exception,
        verbose=verbose,
    )


__all__ = [
    "toposort",
    "get_dependency_path",
    "render_workflow",
    "to_data_model",
]
