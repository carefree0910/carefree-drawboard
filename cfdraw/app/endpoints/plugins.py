from typing import Type
from asyncio import Event
from cftool.misc import print_info

from cfdraw.app.schema import IApp
from cfdraw.app.schema import IRequestQueueData
from cfdraw.utils.server import get_err_msg
from cfdraw.utils.server import get_responses
from cfdraw.schema.plugins import IPluginRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.plugins.base import IHttpPlugin
from cfdraw.app.endpoints.base import IEndpoint


def add_plugins(app: IApp) -> None:
    for identifier, plugin_type in app.plugins.items():
        if not issubclass(plugin_type, IHttpPlugin):
            continue
        endpoint = f"/{identifier}"
        if not app.config.prod:
            print_info(f"registering endpoint '{endpoint}'")

        def _register(_id: str, _tp: Type[IHttpPlugin]) -> None:
            @app.api.post(
                endpoint,
                name=endpoint[1:].replace("/", "_"),
                responses=get_responses(IPluginResponse),
            )
            async def fn(data: IPluginRequest) -> IPluginResponse:
                _p = _tp()
                if _p.hash_identifier(_id) != data.identifier:
                    response = IPluginResponse(
                        success=False,
                        message=(
                            f"internal error occurred: identifier mismatch, "
                            f"current hash is {_p.hash_identifier(_id)} "
                            f"but incoming identifier is {data.identifier}"
                        ),
                        data={},
                    )
                    del _p
                    return response
                try:
                    uid = app.request_queue.push(IRequestQueueData(data, _p, Event()))
                    await app.request_queue.wait(uid)
                    response = app.request_queue.pop_response(uid)
                    if response is not None:
                        return response
                    return IPluginResponse(
                        success=False,
                        message=(
                            "Internal error occurred: "
                            "cannot find response after request is processed"
                        ),
                        data={},
                    )
                except Exception as err:
                    err_msg = get_err_msg(err)
                    return IPluginResponse(success=False, message=err_msg, data={})
                finally:
                    del _p

        _register(identifier, plugin_type)


class PluginsEndpoint(IEndpoint):
    def register(self) -> None:
        add_plugins(self.app)


__all__ = [
    "PluginsEndpoint",
]
