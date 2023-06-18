from abc import abstractmethod
from abc import ABCMeta
from PIL import Image
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from cftool.misc import shallow_copy_dict
from cftool.data_structures import Workflow

from cfdraw import constants
from cfdraw.utils import server
from cfdraw.utils.misc import offload_run
from cfdraw.schema.plugins import *
from cfdraw.plugins.middlewares import *
from cfdraw.parsers.noli import SingleNodeType
from cfdraw.app.endpoints.upload import ImageUploader
from cfdraw.app.endpoints.upload import FetchImageModel


class ISocketPlugin(IPlugin, metaclass=ABCMeta):
    @abstractmethod
    async def process(self, data: ISocketRequest) -> Any:
        pass

    # internal APIs

    @property
    def middlewares(self) -> List[IMiddleware]:
        return [
            ResponseMiddleware(self),
            TimerMiddleware(self),
            SendSocketMessageMiddleware(self),
        ]

    async def __call__(self, data: ISocketRequest) -> None:
        self.injections = {}
        self.extra_responses = {}
        middlewares = self.middlewares
        for middleware in middlewares:
            await middleware.before(data)
        response = await self.process(data)
        for middleware in middlewares:
            response = await middleware(response)

    def to_react(self) -> Dict[str, Any]:
        return self.settings.to_react(
            self.type,
            self.hash,
            hash_identifier(self.hash, self.identifier),
        )

    # helper methods

    def filter(self, nodes: List[INodeData], target: SingleNodeType) -> List[INodeData]:
        return list(filter(lambda node: node.type == target, nodes))

    async def load_image(self, src: str) -> Image.Image:
        # check whether the incoming url refers to a local image
        # if so, load it from the local file system directly
        if src.startswith("http://") and constants.UPLOAD_IMAGE_FOLDER_NAME in src:
            file = src.split(constants.UPLOAD_IMAGE_FOLDER_NAME)[1][1:]  # remove '/'
            return server.get_image(file)
        data = FetchImageModel(url=src, jpeg=False, return_image=True)
        return await ImageUploader.fetch_image(data)

    def send_progress(
        self,
        progress: Optional[float] = None,
        *,
        textList: Optional[List[str]] = None,
        imageList: Optional[List[str]] = None,
    ) -> bool:
        if textList is None and imageList is None:
            intermediate = None
        else:
            intermediate = ISocketIntermediate(textList=textList, imageList=imageList)
        message = ISocketMessage.make_progress(self.task_hash, progress, intermediate)
        return offload_run(self.send_message(message))

    def send_exception(self, message: str) -> bool:
        message = ISocketMessage.make_exception(self.task_hash, message)
        return offload_run(self.send_message(message))

    def set_extra_response(self, key: str, value: Any) -> None:
        self.extra_responses[key] = value

    def set_workflow(self, workflow: Workflow) -> None:
        self.set_extra_response(constants.WORKFLOW_KEY, workflow.to_json())

    def set_injection(self, key: str, node: INodeData) -> None:
        self.injections[key] = dict(
            node=shallow_copy_dict(node.dict()),
            bboxFields=None if node.transform is None else node.transform.dict(),
        )


class IInternalSocketPlugin(ISocketPlugin, metaclass=ABCMeta):
    @property
    def type(self) -> PluginType:
        return PluginType._INTERNAL

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(w=1, h=1)


__all__ = [
    "ISocketPlugin",
    "IInternalSocketPlugin",
]
