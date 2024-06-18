import json
import time
import asyncio

from abc import abstractmethod
from abc import ABCMeta
from typing import Any
from typing import Set
from typing import Dict
from typing import List
from typing import Type
from typing import Union
from typing import TypeVar
from typing import Callable
from typing import Optional
from pydantic import Field
from pydantic import BaseModel
from dataclasses import field
from dataclasses import asdict
from dataclasses import dataclass

from ..toolkit import console
from ..toolkit.web import get_err_msg
from ..toolkit.misc import offload
from ..toolkit.misc import random_hash
from ..toolkit.misc import register_core
from ..toolkit.misc import shallow_copy_dict
from ..toolkit.misc import JsonPack
from ..toolkit.misc import ISerializableDataClass
from ..toolkit.types import TPath
from ..toolkit.data_structures import Item
from ..toolkit.data_structures import Bundle


TNode = TypeVar("TNode", bound="Node")
TTNode = TypeVar("TTNode", bound=Type["Node"])
nodes: Dict[str, Type["Node"]] = {}
_shared_pool: Dict[str, Any] = {}
warmed_up_records: Dict[str, bool] = {}

UNDEFINED_PLACEHOLDER = "$undefined$"
EXCEPTION_MESSAGE_KEY = "$exception$"
ALL_LATENCIES_KEY = "$all_latencies$"

LOOP_NODE = "common.loop"
GATHER_NODE = "common.gather"
WORKFLOW_NODE = "common.workflow"
WORKFLOW_ENDPOINT_NAME = "workflow"


def to_hierarchies(hierarchy: Union[str, List[str]]) -> List[str]:
    if isinstance(hierarchy, list):
        return hierarchy
    return hierarchy.split(".")


def extract_from(data: Any, hierarchy: Union[str, List[str]]) -> Any:
    hierarchies = to_hierarchies(hierarchy)
    for h in hierarchies:
        if isinstance(data, list):
            try:
                ih = int(h)
            except:
                msg = f"current value is list, but '{h}' is not int"
                raise ValueError(msg)
            data = data[ih]
        elif isinstance(data, dict):
            data = data[h]
        else:
            raise ValueError(
                f"hierarchy '{h}' is required but current value type "
                f"is '{type(data)}' ({data})"
            )
    return data


def inject_leaf_data(d: Any, hierarchies: List[str], v: Any, *, verbose: bool) -> None:
    h = hierarchies.pop(0)
    is_leaf = len(hierarchies) == 0
    if isinstance(d, list):
        try:
            ih = int(h)
        except:
            raise ValueError(f"current value is list, but '{h}' is not int")
        if len(d) <= ih:
            if verbose:
                replace_msg = "target value" if is_leaf else "an empty `dict`"
                console.warn(
                    "current data is a list but its length is not enough, "
                    f"corresponding index ({h}) will be set to {replace_msg}, "
                    "and other elements will be set to `undefined`"
                )
            d.extend([UNDEFINED_PLACEHOLDER] * (ih - len(d) + 1))
        if is_leaf:
            d[ih] = v
        else:
            if d[ih] == UNDEFINED_PLACEHOLDER:
                console.warn("filling `undefined` value with an empty `dict`")
                d[ih] = {}
            inject_leaf_data(d[ih], hierarchies, v, verbose=verbose)
    elif isinstance(d, dict):
        if is_leaf:
            d[h] = v
        else:
            if h not in d:
                if verbose:
                    console.warn(
                        "current data is a dict but it does not have the "
                        f" corresponding key ('{h}'), it will be set to "
                        "an empty `dict`"
                    )
                d[h] = {}
            inject_leaf_data(d[h], hierarchies, v, verbose=verbose)
    else:
        raise ValueError(
            f"hierarchy '{h}' is required but current value type "
            f"is '{type(d)}' ({d})"
        )


async def warmup(t_node: Type["Node"], verbose: bool) -> None:
    warmed_up_key = t_node.__identifier__
    if not warmed_up_records.get(warmed_up_key, False):
        if verbose:
            console.debug(f"warming up node '{warmed_up_key}'")
        await t_node.warmup()
        warmed_up_records[warmed_up_key] = True


@dataclass
class Injection:
    """
    A dataclass that represents an injection to the current node.

    Attributes
    ----------
    src_key : str
        The key of the dependent node.
    src_hierarchy : str | list[str] | None
        The 'src_hierarchy' of the dependent node's results that the current node depends on.
        - `src_hierarchy` can be very complex:
          - use `int` as `list` index, and `str` as `dict` key.
          - use list / `.` to represent nested structure.
          - for example, you can use `["a", "0", "b"]` or `a.0.b` to indicate `results["a"][0]["b"]`.
        - If `None`, all results of the dependent node will be used.
    dst_hierarchy : str | list[str]
        The 'dst_hierarchy' of the current node's `data`.
        - `dst_hierarchy` can be very complex:
          - use `int` as `list` index, and `str` as `dict` key.
          - use list / `.` to represent nested structure.
          - for example, if you want to inject to `data["a"][0]["b"]`, you can use either
          `["a", "0", "b"]` or `a.0.b` as the `dst_hierarchy`.

    """

    src_key: str
    src_hierarchy: Optional[Union[str, List[str]]]
    dst_hierarchy: Union[str, List[str]]

    def to_model(self) -> "InjectionModel":
        return InjectionModel(
            src_key=self.src_key,
            src_hierarchy=self.src_hierarchy,
            dst_hierarchy=self.dst_hierarchy,
        )


@dataclass
class LoopBackInjection:
    """
    A dataclass that represents a loop back injection to the current node.

    > This is the same as `Injection`, except the `src_key` will always be the
    key of the previous node in the loop.
    """

    src_hierarchy: Optional[Union[str, List[str]]]
    dst_hierarchy: Union[str, List[str]]

    def to_model(self) -> "LoopBackInjectionModel":
        return LoopBackInjectionModel(
            src_hierarchy=self.src_hierarchy,
            dst_hierarchy=self.dst_hierarchy,
        )


@dataclass
class Schema:
    """
    A class that represents a Schema of a node.

    Implement `get_schema` method and return a `Schema` instance for your nodes
    can help us auto-generate UIs, APIs and documents.

    Attributes
    ----------
    input_model : Optional[Type[BaseModel]]
        The input data model of the node.
        > If your inputs are not JSON serializable, you can use `input_names` instead.
    output_model : Optional[Type[BaseModel]]
        The output data model of the node.
        > If your outputs are not JSON serializable, you can use either `api_output_model`
        or `output_names` instead.
    api_output_model : Optional[Type[BaseModel]]
        The API response data model of the node.
        > This is helpful when your outputs are not JSON serializable, and you implement
        the `get_api_response` method to convert the outputs to API responses.
        > In this case, `api_output_model` should be the data model of the results returned
        by `get_api_response`.
    input_names : Optional[List[str]]
        The names of the inputs of the node.
        > This is helpful if you want to make things simple.
        > Please make sure that the input `data` of the node has exactly the same keys as `input_names`.
    output_names : Optional[List[str]]
        The names of the outputs of the node.
        > This is helpful if you want to make things simple.
        > Please make sure that the output `results` of the node has exactly the same keys as `output_names`.
    description : Optional[str]
        A description of the node.
        > This will be displayed in the auto-generated UIs / documents.

    """

    input_model: Optional[Type[BaseModel]] = None
    output_model: Optional[Type[BaseModel]] = None
    api_output_model: Optional[Type[BaseModel]] = None
    input_names: Optional[List[str]] = None
    output_names: Optional[List[str]] = None
    description: Optional[str] = None


class Hook:
    @classmethod
    async def initialize(cls, shared_pool: Dict[str, Any]) -> None:
        pass

    @classmethod
    async def cleanup(cls, shared_pool: Dict[str, Any]) -> None:
        pass


@dataclass
class Node(ISerializableDataClass["Node"], metaclass=ABCMeta):
    """
    A Node class that represents a node in a workflow.

    This class is abstract and should be subclassed.

    Attributes
    ----------
    key : str, optional
        The key of the node, should be unique with respect to the workflow.
    data : Any, optional
        The data associated with the node.
    injections : List[Injection], optional
        A list of injections of the node.
    offload : bool, optional
        A flag indicating whether the node should be offloaded.
    lock_key : str, optional
        The lock key of the node.
    executing : bool, optional
        A runtime attribute indicating whether the node is currently executing.

    Methods
    -------
    async execute() -> Any
        Abstract method that should return the results.

    @classmethod
    get_schema() -> Optional[Schema]
        Optional method that returns the schema of the node.
        Implement this method can help us auto-generate UIs, APIs and documents.
    @classmethod
    async warmup() -> None
        Optional method that will be called:
        - only once.
        - before the server starts, if under API mode.
        Implement this method to do heavy initializations (e.g. loading AI models).
    async initialize(flow: Flow) -> None
        Optional method that will be called everytime before the execution.
    async get_api_response(results: Dict[str, Any]) -> Any
        Optional method that returns the API response of the node from its 'raw' results.
        Implement this method to handle complex API responses (e.g. `PIL.Image`).
    async cleanup() -> None
        Optional method that will be called everytime after the execution.

    """

    key: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    injections: List[Injection] = field(default_factory=list)
    offload: bool = False
    lock_key: Optional[str] = None
    # runtime attribute, should not be touched and will not be serialized
    executing: bool = False

    # optional

    @classmethod
    def get_schema(cls) -> Optional[Schema]:
        return None

    @classmethod
    def get_hooks(cls) -> List[Type[Hook]]:
        return []

    @classmethod
    async def warmup(cls) -> None:
        """
        This is used to warmup the node, and will be called:
        - only once.
        - before the server starts, if under API mode.

        > The main difference between `warmup` and `initialize` is that `warmup` will be
        called only once, while `initialize` will be called everytime the node is executed.
        > So you can do some heavy initializations here (e.g. loading AI models).
        """

    async def initialize(self, flow: "Flow") -> None:
        """Will be called everytime before the execution."""

        for hook in self.get_hooks():
            await hook.initialize(_shared_pool)

    async def get_api_response(self, results: Dict[str, Any]) -> Any:
        return results

    async def cleanup(self) -> None:
        """Will be called everytime after the execution."""

        for hook in self.get_hooks():
            await hook.cleanup(_shared_pool)

    # api

    def depend_on(self, src_key: str) -> None:
        """
        This can be used if this Node does not directly depend on `src_key` Node,
        but you want this Node to wait for `src_key` Node to finish before starting.
        """

        tag = f"$depend_{random_hash()[:4]}"
        self.injections.append(Injection(src_key, None, tag))

    def to_model(self) -> "NodeModel":
        if self.key is None:
            raise ValueError("node key cannot be None")
        return NodeModel(
            key=self.key,
            type=self.__identifier__,
            data=shallow_copy_dict(self.data),
            injections=[injection.to_model() for injection in self.injections],
            offload=self.offload,
            lock_key=self.lock_key,
        )

    # abstract

    @abstractmethod
    async def execute(self) -> Any:
        pass

    # internal

    @classmethod
    def register(cls, name: str, **kwargs: Any) -> Callable[[TTNode], TTNode]:  # type: ignore
        def before(cls_: TTNode) -> None:
            if name == WORKFLOW_ENDPOINT_NAME:
                raise RuntimeError(
                    "`workflow` is a reserved name, please use another name "
                    f"when registering node '{cls_.__name__}'"
                )
            cls_.__identifier__ = name
            if custom_before is not None:
                custom_before(cls_)

        custom_before = kwargs.pop("before_register", None)
        kwargs.setdefault("allow_duplicate", False)
        kwargs["before_register"] = before
        return register_core(name, cls.d, **kwargs)  # type: ignore

    @property
    def shared_pool(self) -> Dict[str, Any]:
        return _shared_pool

    def asdict(self) -> Dict[str, Any]:
        return dict(
            key=self.key,
            data=shallow_copy_dict(self.data),
            injections=[asdict(injection) for injection in self.injections],
            offload=self.offload,
            lock_key=self.lock_key,
        )

    def to_item(self: TNode) -> Item[TNode]:
        if self.key is None:
            raise ValueError("node key cannot be None")
        return Item(self.key, self)

    def to_pack(self) -> JsonPack:
        return JsonPack(type=self.__identifier__, info=self.to_info())

    def from_info(self, info: Dict[str, Any]) -> "Node":
        super().from_info(info)
        if self.key is None:
            raise ValueError("node key cannot be None")
        if "." in self.key:
            raise ValueError("node key cannot contain '.'")
        return self

    def check_inputs(self) -> None:
        if not isinstance(self.data, dict):
            raise ValueError(
                f"input `data` ({self.data}) of node "
                f"'{self.key}' ({self.__class__.__name__}) should be a `dict`"
            )
        schema = self.get_schema()
        if schema is None:
            return
        if schema.input_model is not None:
            try:
                narrowed = schema.input_model(**self.data)
                self.data = narrowed.model_dump()
            except Exception as err:
                msg = f"input data ({self.data}) does not match the schema model ({schema.input_model})"
                raise ValueError(msg) from err
        elif schema.input_names is not None:
            data_inputs = set(self.data.keys())
            schema_inputs = set(schema.input_names)
            if data_inputs != schema_inputs:
                msg = f"input data ({self.data}) does not match the schema names ({schema.input_names})"
                raise ValueError(msg)

    def check_injections(self) -> None:
        history: Dict[str, Injection] = {}
        for injection in self.injections:
            dst_hierarchy_key = str(injection.dst_hierarchy)
            existing = history.get(dst_hierarchy_key)
            if existing is not None:
                raise ValueError(
                    f"`dst_hierarchy` of current injection ({injection}) is duplicated "
                    f"with previous injection ({existing})"
                )
            history[dst_hierarchy_key] = injection

    def fetch_injections(self, results: Dict[str, Any], verbose: bool = True) -> None:
        for injection in self.injections:
            src_key = injection.src_key
            src_out = results.get(src_key)
            if src_out is None:
                raise ValueError(f"cannot find cache for '{src_key}'")
            if injection.src_hierarchy is not None:
                src_out = extract_from(src_out, injection.src_hierarchy)
            dst_hierarchies = to_hierarchies(injection.dst_hierarchy)
            inject_leaf_data(self.data, dst_hierarchies, src_out, verbose=verbose)

    def check_undefined(self) -> None:
        def check(data: Any) -> None:
            if isinstance(data, list):
                for item in data:
                    check(item)
            elif isinstance(data, dict):
                for v in data.values():
                    check(v)
            elif data == UNDEFINED_PLACEHOLDER:
                raise ValueError(f"undefined value found in '{self.data}'")

        check(self.data)

    def check_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(results, dict):
            raise ValueError(
                f"output results ({results}) of "
                f"node '{self.key}' ({self.__class__.__name__}) should be a `dict`"
            )
        schema = self.get_schema()
        if schema is None:
            return results
        if schema.output_model is not None:
            try:
                narrowed = schema.output_model(**results)
                return narrowed.model_dump()
            except Exception as err:
                msg = f"output data ({results}) does not match the schema model ({schema.output_model})"
                raise ValueError(msg) from err
        if schema.output_names is not None:
            node_outputs = set(results.keys())
            schema_outputs = set(schema.output_names)
            if node_outputs != schema_outputs:
                msg = f"output data ({results}) does not match the schema names ({schema.output_names})"
                raise ValueError(msg)
        return results

    def check_api_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        schema = self.get_schema()
        if schema is None:
            return results
        if schema.api_output_model is not None:
            try:
                narrowed = schema.api_output_model(**results)
                return narrowed.model_dump()
            except Exception as err:
                msg = f"API response ({results}) does not match the schema model ({schema.api_output_model})"
                raise ValueError(msg) from err
        return results


class Flow(Bundle[Node]):
    """
    A Flow class that represents a workflow.

    Attributes
    ----------
    edges : Dict[str, List[Edge]]
        The dependencies of the workflow.
        - The key is the destination node key.
        - The value is a list of edges that indicates the dependencies
          of the destination node.
    latest_latencies : Dict[str, Dict[str, float]]
        The latest latencies of the workflow.

    Methods
    -------
    push(node: Node) -> Flow:
        Pushes a node into the workflow.
    loop(n: int, node: Node, loop_back_injections: List[LoopBackInjection], ...) -> str:
        Loops the given `node` for `n` times, this is useful when you want to perform:
        > iterative tasks on the same node, in which case `loop_back_injections` should be set.
        > the same task for `n` times, in which case `loop_back_injections` should be `None`.
          In this case, the `node` should have some randomness inside, and what you are doing
          is kind of like 'ensemble' or 'mixture of experts'.
    gather(*targets: str) -> str:
        Gathers targets into a single node, and returns the key of the node.
    to_json() -> Dict[str, Any]:
        Converts the workflow to a JSON object.
    from_json(cls, data: Dict[str, Any]) -> Flow:
        Creates a workflow from a JSON object.
    dump(path: TPath) -> None:
        Dumps the workflow to a (JSON) file.
    load(cls, path: TPath) -> Flow:
        Loads a workflow from a (JSON) file.
    get_reachable(target: str) -> Set[str]:
        Gets the reachable nodes from a target.
    run(...) -> None:
        Runs a single node in the workflow.
    execute(...) -> Dict[str, Any]:
        Executes the entire workflow.

    """

    def __init__(self, *, no_mapping: bool = False) -> None:
        super().__init__(no_mapping=no_mapping)
        self.latest_latencies: Dict[str, Dict[str, float]] = {}

    def __str__(self) -> str:
        body = ",\n  ".join(str(item.data) for item in self)
        return f"""Flow([
  {body}
])"""

    __repr__ = __str__

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Flow):
            return False
        return self.to_json() == other.to_json()

    @property
    def shared_pool(self) -> Dict[str, Any]:
        return _shared_pool

    def push(self, node: Node) -> "Flow":  # type: ignore
        if node.key is None:
            raise ValueError("node key cannot be None")
        return super().push(node.to_item())

    def loop(
        self,
        node: Node,
        loop_values: Optional[Dict[str, List[Any]]] = None,
        loop_back_injections: Optional[List[LoopBackInjection]] = None,
        *,
        loop_injections: Optional[List[Injection]] = None,
        extract_hierarchy: Optional[str] = None,
        verbose: bool = False,
    ) -> str:
        loop_key = f"$loop_{node.key}_{random_hash()[:4]}"
        modified_injections: List[Injection] = []
        for injection in node.injections:
            modified_dst_hierarchy: Union[str, List[str]]
            if isinstance(injection.dst_hierarchy, str):
                modified_dst_hierarchy = f"base_data.{injection.dst_hierarchy}"
            else:
                modified_dst_hierarchy = ["base_data"] + injection.dst_hierarchy
            modified_injections.append(
                Injection(
                    injection.src_key,
                    injection.src_hierarchy,
                    modified_dst_hierarchy,
                )
            )
        if loop_injections is not None:
            modified_injections.extend(loop_injections)
        self.push(
            Node.make(
                LOOP_NODE,
                dict(
                    key=loop_key,
                    data=dict(
                        base_node=node.__identifier__,
                        base_data=shallow_copy_dict(node.data),
                        loop_values=shallow_copy_dict(loop_values or {}),
                        loop_back_injections=(
                            None
                            if loop_back_injections is None
                            else list(map(asdict, loop_back_injections))
                        ),
                        extract_hierarchy=extract_hierarchy,
                        verbose=verbose,
                    ),
                    injections=modified_injections,
                    offload=node.offload,
                    lock_key=node.lock_key,
                ),
            )
        )
        return loop_key

    def gather(self, *targets: str) -> str:
        gather_key = f"$gather_{random_hash()[:4]}"
        injections = [Injection(k, None, k) for k in targets]
        self.push(
            Node.make(
                GATHER_NODE,
                dict(key=gather_key, injections=injections),
            )
        )
        return gather_key

    def to_json(self) -> List[Dict[str, Any]]:
        return [item.data.to_pack().asdict() for item in self]

    @classmethod
    def from_json(cls, data: List[Dict[str, Any]]) -> "Flow":
        workflow = cls()
        for pack in data:
            workflow.push(Node.from_pack(pack))
        return workflow

    def to_model(
        self,
        *,
        target: str,
        intermediate: Optional[List[str]] = None,
        return_if_exception: bool = False,
        verbose: bool = False,
    ) -> "WorkflowModel":
        return WorkflowModel(
            target=target,
            intermediate=intermediate,
            nodes=[item.data.to_model() for item in self],
            return_if_exception=return_if_exception,
            verbose=verbose,
        )

    def copy(self) -> "Flow":
        return Flow.from_json(self.to_json())

    def dump(self, path: TPath) -> None:
        with open(path, "w") as f:
            json.dump(self.to_json(), f, indent=2)

    @classmethod
    def load(cls, path: TPath) -> "Flow":
        with open(path, "r") as f:
            return cls.from_json(json.load(f))

    def get_reachable(self, target: str) -> Set[str]:
        def dfs(key: str, is_target: bool) -> None:
            if not is_target and key == target:
                raise ValueError(f"cyclic dependency detected when dfs from '{target}'")
            if key in reachable:
                return
            reachable.add(key)
            item = self.get(key)
            if item is None:
                raise ValueError(
                    f"cannot find node '{key}', which is declared as a dependency, "
                    f"in the workflow ({self})"
                )
            node = item.data
            for injection in node.injections:
                dfs(injection.src_key, False)

        reachable: Set[str] = set()
        dfs(target, True)
        return reachable

    async def run(
        self,
        item: Item[Node],
        api_results: Dict[str, Any],
        all_results: Dict[str, Any],
        return_api_response: bool,
        verbose: bool,
        all_latencies: Dict[str, Dict[str, float]],
    ) -> None:
        if item.key in all_results:
            return
        start_t = time.time()
        while not all(i.src_key in all_results for i in item.data.injections):
            await asyncio.sleep(0)
        if item.data.lock_key is not None:
            while not all(
                not other.data.executing or other.data.lock_key != item.data.lock_key
                for other in self
            ):
                await asyncio.sleep(0)
        item.data.executing = True
        t0 = time.time()
        node: Node = item.data.copy()
        node.fetch_injections(all_results, verbose)
        node.check_undefined()
        node.check_inputs()
        t1 = time.time()
        if verbose:
            console.debug(f"executing node '{item.key}'")
        if not node.offload:
            results = await node.execute()
        else:
            results = await offload(node.execute())
        results = node.check_results(results)
        all_results[item.key] = results
        if return_api_response:
            results = await node.get_api_response(results)
            results = node.check_api_results(results)
            api_results[item.key] = results
        t2 = time.time()
        item.data.executing = False
        all_latencies[item.key] = dict(
            pending=t0 - start_t,
            inject=t1 - t0,
            execute=t2 - t1,
            latency=t2 - t0,
        )
        if verbose:
            console.debug(f"finished executing node '{item.key}'")

    async def execute(
        self,
        target: str,
        intermediate: Optional[List[str]] = None,
        *,
        return_api_response: bool = False,
        return_if_exception: bool = False,
        verbose: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes the workflow ending at the `target` node.

        Parameters
        ----------
        target : str
            The key of the target node which the execution will end at.
        intermediate : List[str], optional
            A list of intermediate nodes that will be returned. Default is `None`.
            - Only useful when `return_api_response` is `True`.
            - If `None`, no intermediate nodes will be returned.
        return_if_exception : bool, optional
            If `True`, the function will return even if an exception occurs. Default is `False`.
        return_api_response : bool, optional
            If `True`, the function will:
            - Only return the results of the `target` node & the `intermediate` nodes.
            - Call `get_api_response` on the results to get the final API response.
        verbose : bool, optional
            If `True`, the function will print detailed logs. Default is `False`.

        Returns
        -------
        dict
            A dictionary containing the results of the execution.
            - If `return_api_response` is `True`, only outputs of the `target` node can be accessed
            (via `results[target]`).
            - Otherwise, outputs of all nodes can be accessed (via `results[key]`, where `key` is
            the key of the node).
            - If an exception occurs during the execution, the dictionary will contain
            a key 'EXCEPTION_MESSAGE_KEY' with the error message as the value.

        """

        api_results: Dict[str, Any] = {}
        all_results: Dict[str, Any] = {}
        extra_results: Dict[str, Any] = {}
        all_latencies: Dict[str, Dict[str, float]] = {}
        if intermediate is None:
            intermediate = []
        reachable_nodes: List[Node] = []
        try:
            workflow = self.copy()
            if target not in workflow:
                raise ValueError(f"cannot find target '{target}' in the workflow")
            reachable = workflow.get_reachable(target)
            reachable_nodes = [item.data for item in workflow if item.key in reachable]
            for node in reachable_nodes:
                node.check_injections()
                await warmup(node.__class__, verbose)
            for node in reachable_nodes:
                if verbose:
                    console.debug(f"initializing node '{node.key}'")
                await node.initialize(workflow)
            await asyncio.gather(
                *(
                    workflow.run(
                        item,
                        api_results,
                        all_results,
                        return_api_response
                        and (item.key == target or item.key in intermediate),
                        verbose,
                        all_latencies,
                    )
                    for item in workflow
                    if item.key in reachable
                )
            )
            extra_results[EXCEPTION_MESSAGE_KEY] = None
        except Exception as err:
            if not return_if_exception:
                raise
            err_msg = get_err_msg(err)
            extra_results[EXCEPTION_MESSAGE_KEY] = err_msg
            if verbose:
                console.error(err_msg)
        finally:
            for node in reachable_nodes:
                if verbose:
                    console.debug(f"cleaning up node '{node.key}'")
                try:
                    await node.cleanup()
                except Exception as err:
                    msg = f"error occurred when cleaning up node '{node.key}': {get_err_msg(err)}"
                    console.error(msg)
        self.latest_latencies = all_latencies
        extra_results[ALL_LATENCIES_KEY] = all_latencies
        final_results = api_results if return_api_response else all_results
        final_results.update(extra_results)
        return final_results


Node.d = nodes  # type: ignore


class SrcKey(BaseModel):
    src_key: str = Field(..., description="The key of the dependent node.")


class LoopBackInjectionModel(BaseModel):
    """Data model of `LoopBackInjection`"""

    src_hierarchy: Optional[Union[str, List[str]]] = Field(
        ...,
        description="""The 'src_hierarchy' of the dependent node's results that the current node depends on.
- `src_hierarchy` can be very complex:
  - use `int` as `list` index, and `str` as `dict` key.
  - use list / `.` to represent nested structure.
  - for example, you can use `["a", "0", "b"]` or `a.0.b` to indicate `results["a"][0]["b"]`.
- If `None`, all results of the dependent node will be used.""",
    )
    dst_hierarchy: Union[str, List[str]] = Field(
        ...,
        description="""The 'dst_hierarchy' of the current node's `data`.
- `dst_hierarchy` can be very complex:
  - use `int` as `list` index, and `str` as `dict` key.
  - use list / `.` to represent nested structure.
  - for example, if you want to inject to `data["a"][0]["b"]`, you can use either `["a", "0", "b"]` or `a.0.b` as the `dst_hierarchy`.""",
    )


class InjectionModel(LoopBackInjectionModel, SrcKey):
    pass


class NodeModel(BaseModel):
    key: str = Field(
        ...,
        description="The key of the node, should be unique with respect to the workflow.",
    )
    type: str = Field(
        ...,
        description="The type of the node, should be the one when registered.",
    )
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="The data associated with the node.",
    )
    injections: List[InjectionModel] = Field(
        default_factory=list,
        description="A list of injections of the node.",
    )
    offload: bool = Field(
        False,
        description="A flag indicating whether the node should be offloaded.",
    )
    lock_key: Optional[str] = Field(None, description="The lock key of the node.")


class WorkflowModel(BaseModel):
    target: str = Field(..., description="The target output node of the workflow.")
    intermediate: Optional[List[str]] = Field(
        None,
        description="The intermediate nodes that you want to get outputs from.",
    )
    nodes: List[NodeModel] = Field(..., description="A list of nodes in the workflow.")
    return_if_exception: bool = Field(
        False,
        description="Whether to return partial results if exception occurs.",
    )
    verbose: bool = Field(False, description="Whether to print debug logs.")

    def get_workflow(self) -> Flow:
        workflow_json = []
        for node in self.model_dump()["nodes"]:
            node_json = dict(type=node.pop("type"), info=node)
            workflow_json.append(node_json)
        return Flow.from_json(workflow_json)

    async def run(self, *, return_api_response: bool = False) -> Dict[str, Any]:
        return await self.get_workflow().execute(
            self.target,
            self.intermediate,
            return_api_response=return_api_response,
            return_if_exception=self.return_if_exception,
            verbose=self.verbose,
        )


__all__ = [
    "UNDEFINED_PLACEHOLDER",
    "EXCEPTION_MESSAGE_KEY",
    "ALL_LATENCIES_KEY",
    "Injection",
    "LoopBackInjection",
    "Schema",
    "Node",
    "Flow",
    "BaseModel",
    "SrcKey",
    "LoopBackInjectionModel",
    "InjectionModel",
    "NodeModel",
    "WorkflowModel",
]
