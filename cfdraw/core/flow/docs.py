import json
import inspect

from typing import List
from typing import Type
from typing import Tuple
from typing import Optional
from pathlib import Path
from dataclasses import dataclass

from .. import flow as cflow
from ..toolkit import console


RAG_SEPARATOR = "__RAG__"
UNDEFINED_PLACEHOLDER = "*Undefined*"


@dataclass
class Document:
    name: str
    source_codes: str
    description: str = UNDEFINED_PLACEHOLDER
    input_docs: str = UNDEFINED_PLACEHOLDER
    output_docs: str = UNDEFINED_PLACEHOLDER
    api_ouput_docs: Optional[str] = None
    rag: bool = False

    @property
    def markdown(self) -> str:
        if not self.rag:
            eof = ""
            title = f"## {self.name}"
        else:
            eof = f"\n{RAG_SEPARATOR}\n"
            title = f"## Supported Node - {self.name}"
        return f"""{title}

### Description

{self.description}

### Inputs

{self.input_docs}

### Functional Outputs

{self.output_docs}

### API Outputs

{self.api_ouput_docs or "*Same as the functional outputs.*"}

### Source Codes

```python
{self.source_codes}```
{eof}
"""


def strip_source(source: str, identifier: str) -> str:
    source = source.strip()
    id_index = source.index(identifier)
    source = source[:id_index]
    return source.strip()


def fetch_doc_sources(t_base: type) -> List[str]:
    sources = []
    for sub in cflow.__dict__.values():
        if not inspect.isclass(sub):
            continue
        if issubclass(sub, t_base) and sub is not t_base:
            sources.append(
                f"""### `{sub.__name__}`

```python
{inspect.getsource(sub).replace("`", "'")}```
"""
            )
    return sources


def genearte_document(t_node: Type[cflow.Node], rag: bool) -> Optional[Document]:
    schema = t_node.get_schema()
    source = inspect.getsource(t_node)
    document = Document(name=t_node.__name__, source_codes=source, rag=rag)
    if schema is None:
        return document
    if schema.input_model is not None:
        document.input_docs = f"""```python
{inspect.getsource(schema.input_model).replace("`", "'")}```"""
    elif schema.input_names is not None:
        input_strings = [f"- {name}\n" for name in schema.input_names]
        document.input_docs = f"""'{document.name}' has following inputs:
{''.join(input_strings)[:-1]}"""
    if schema.output_model is not None:
        document.output_docs = f"""```python
{inspect.getsource(schema.output_model).replace("`", "'")}```"""
    elif schema.output_names is not None:
        output_strings = [f"- {name}\n" for name in schema.output_names]
        document.output_docs = f"""'{document.name}' has following outputs:
{''.join(output_strings)[:-1]}"""
    if schema.api_output_model is not None:
        document.api_ouput_docs = f"""```python
{inspect.getsource(schema.api_output_model).replace("`", "'")}```"""
    if schema.description is not None:
        document.description = schema.description
    return document


def generate_documents(output: str, *, rag: bool = False) -> None:
    def get_example_title_and_eof(path: Path, title_prefix: str) -> Tuple[str, str]:
        relative = str(path.relative_to(root))
        if not rag:
            eof = "\n"
            title = f"### `{relative}`"
        else:
            eof = f"\n{RAG_SEPARATOR}\n"
            title = f"### {title_prefix}`{relative}`"
        return title, eof

    def get_code_example(code: Path) -> str:
        title, eof = get_example_title_and_eof(code, "Coding Example - ")
        return f"{title}\n\n```python\n{code.read_text()}```{eof}"

    def get_json_example(workflow: Path) -> str:
        title, eof = get_example_title_and_eof(workflow, "Workflow JSON Example - ")
        with open(workflow, "r") as f:
            w_json = json.load(f)
            w_description = w_json.pop("$description", "*Description is not provided.*")
        return f"""{title}

{w_description}

```json
{json.dumps(w_json, indent=2, ensure_ascii=False)}
```{eof}"""

    if not output.endswith(".md"):
        raise ValueError(f"`dst` should be a markdown file, '{output}' found")
    console.rule("Generating Documents")
    t_nodes = cflow.use_all_t_nodes()
    gen_doc = lambda t_node: genearte_document(t_node, rag)
    documents: List[Document] = list(filter(bool, map(gen_doc, t_nodes)))  # type: ignore
    root = Path(__file__).parent.parent
    examples_dir = root / "examples"
    workflows_dir = examples_dir / "workflows"
    code_snippets = examples_dir.glob("*.py")
    workflow_jsons = workflows_dir.rglob("*.json")
    code_example_docs = "\n".join(map(get_code_example, code_snippets))[:-1]
    workflow_example_docs = "\n".join(map(get_json_example, workflow_jsons))[:-1]
    workflow_model_source = inspect.getsource(cflow.WorkflowModel).replace("`", "'")
    workflow_model_source = strip_source(workflow_model_source, "def")
    workflow_execute_source = inspect.getsource(cflow.Flow.execute).replace("`", "'")
    workflow_execute_source = strip_source(workflow_execute_source, "api_results: ")
    workflow_execute_split = workflow_execute_source.split("\n")
    workflow_execute_split[1:] = [line[4:] for line in workflow_execute_split[1:]]
    workflow_execute_source = "\n".join(workflow_execute_split)
    enum_docs = "\n".join(fetch_doc_sources(cflow.DocEnum))[:-1]
    data_model_docs = "\n".join(fetch_doc_sources(cflow.DocModel))[:-1]
    sep = f"\n{RAG_SEPARATOR}\n" if rag else ""
    generated = f"""# `carefree-workflow` Documentation

Here are some design principles of `carefree-workflow`:
- `workflow` is a `DAG` (directed acyclic graph) of `nodes`.
- `workflow` is actually constructed by a set of `nodes` with `injections` defined.
  - `injections` indicate the dependencies between `nodes`.
- Every `node`, as well as the `workflow` itself, can be used in both `functional` and `API` ways.
- Every `node` should take `dict` as inputs and return `dict` as outputs.

And below will be the detailed documents of:
- Installation.
- The general introduction of `node` and `workflow`.
- All the nodes supported in `carefree-workflow`.

We'll also include some examples at the end to help you understand how to use `carefree-workflow` in your projects.

# Installation

`carefree-workflow` requires Python 3.8 or higher.

```bash
pip install carefree-workflow
```

or

```bash
git clone https://github.com/carefree0910/carefree-workflow.git
cd carefree-workflow
pip install -e .
```
{sep}
# Node

Every `node` in `carefree-workflow` should inherit from `cflow.Node`:

```python
{strip_source(inspect.getsource(cflow.Node).replace("`", "'"), "# optional")}
```

It looks complicated, but `node` can actually be simply understood as a `function`, except:
- It can be used in an `API` way **automatically**, as long as it implements the `get_schema` method.
- It can be used in a `workflow`, which means:
  - Its input(s) can be the output(s) from other `node`.
  - Its output(s) can be the input(s) of other `node`.

The second feature is achieved by `injections`, which is represented by:
- `Injection`, if used in a `functional` way.
- `InjectionModel`, if used in an `API` way.

`InjectionModel` will be introduced later ([API usage](#api-usage)), and here is the definition of `Injection`:

```python
{inspect.getsource(cflow.Injection).replace("`", "'")}```

> Example of how to use `Injection` will also be introduced later ([Functional usage](#functional-usage)).

## Example

Here's an example of how to define a custom `node`:

```python
@Node.register("hello")
class HelloNode(Node):
    async def execute(self):
        name = self.data["name"]
        return {'''{"name": name, "greeting": f"Hello, {name}!"}'''}
```

In the above example, we defined a `node` named `hello`, which takes a `name` as input and returns the `name` itself and a `greeting` as outputs.

To make it 'collectable' by the automated system, we can implement the `get_schema` method:

```python
class HelloInput(BaseModel):
    name: str


class HelloOutput(BaseModel):
    name: str
    greeting: str


@Node.register("hello")
class HelloNode(Node):
    @classmethod
    def get_schema(cls):
        return Schema(HelloInput, HelloOutput)

    async def execute(self):
        name = self.data["name"]
        return {'''{"name": name, "greeting": f"Hello, {name}!"}'''}
```

This will help us automatically generate the API endpoint as well as the documentation.
{sep}
# Workflow

```python
{strip_source(inspect.getsource(cflow.Flow).replace("`", "'"), "def __init__")}
```

The key method used by users will be the `execute` method, which is defined as:

```python
{workflow_execute_source}
```

## Functional usage

A typical procedure of using `workflow` in a `functional` way is as follows:
- Define your custom `nodes` by inheriting from `cflow.Node` (if needed).
- Define your `workflow` by using `cflow.Flow` in a chainable way (`cflow.Flow().push(...).push(...)`).
  - Use `flow.gather(...)` if you have multiple targets.
- Call `await workflow.execute(...)` to execute the `workflow` with the given inputs.

Here is a simple example:

```python
import asyncio

from cflow import *

@Node.register("hello")
class HelloNode(Node):
    async def execute(self):
        name = self.data["name"]
        return {'''{"name": name, "greeting": f"Hello, {name}!"}'''}

async def main():
    flow = (
        Flow()
        .push(HelloNode("A", dict(name="foo")))
        .push(HelloNode("B", dict(name="bar")))
        .push(
            EchoNode(
                "Echo",
                dict(messages=[None, None, "Hello, World!"]),
                injections=[
                    Injection("A", "name", "messages.0"),
                    Injection("B", "greeting", "messages.1"),
                ],
            )
        )
    )
    await flow.execute("Echo")

if __name__ == "__main__":
    asyncio.run(main())
```

Running the above codes will yield something like:

```text
[17:30:27] foo
           Hello, bar!
           Hello, World!
```

> More examples can be found at the end of this document ([Coding Examples](#coding-examples)).

## API usage

Here are some important input data models when you want to use `workflow` in an `API` way.

> Examples can be found at the end of this document ([Workflow JSON Examples](#workflow-json-examples)).

### `InjectionModel`

```python
{inspect.getsource(cflow.SrcKey).replace("`", "'")}```

```python
{inspect.getsource(cflow.LoopBackInjectionModel).replace("`", "'")}```

```python
{inspect.getsource(cflow.InjectionModel).replace("`", "'")}```

### `NodeModel`

```python
{inspect.getsource(cflow.NodeModel).replace("`", "'")}```

### `WorkflowModel`

```python
{workflow_model_source}
```
{sep}
# Schema

## Common Enums

{enum_docs}

## Common Data Models

{data_model_docs}
{sep}
# Supported Nodes

{''.join([document.markdown for document in documents])[:-1]}

# Examples

## Coding Examples

{code_example_docs}

## Workflow JSON Examples

{workflow_example_docs}
"""
    with open(output, "w") as f:
        f.write(generated)
    console.log(f"generated documents saved to '{output}'!")


__all__ = [
    "generate_documents",
]
