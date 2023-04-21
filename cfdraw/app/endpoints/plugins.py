from cftool.misc import print_info

from cfdraw.app.schema import IApp
from cfdraw.utils.server import get_err_msg
from cfdraw.utils.server import get_responses
from cfdraw.schema.plugins import IPluginRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.plugins.base import IHttpPlugin
from cfdraw.app.endpoints.base import IEndpoint


def add_plugins(app: IApp) -> None:
    for identifier, plugin in app.plugins.items():
        if not isinstance(plugin, IHttpPlugin):
            continue
        endpoint = f"/{identifier}"
        if not app.config.prod:
            print_info(f"registering endpoint '{endpoint}'")

        def _register(_id: str, _p: IHttpPlugin) -> None:
            @app.api.post(
                endpoint,
                name=endpoint[1:].replace("/", "_"),
                responses=get_responses(IPluginResponse),
            )
            async def fn(data: IPluginRequest) -> IPluginResponse:
                if _p.hash_identifier(_id) != data.identifier:
                    return IPluginResponse(
                        success=False,
                        message=(
                            f"internal error occurred: identifier mismatch, "
                            f"current hash is {_p.hash_identifier(_id)} "
                            f"but incoming identifier is {data.identifier}"
                        ),
                        data={},
                    )
                try:
                    return await _p(data)
                except Exception as err:
                    err_msg = get_err_msg(err)
                    return IPluginResponse(success=False, message=err_msg, data={})

        _register(identifier, plugin)


class PluginsEndpoint(IEndpoint):
    def register(self) -> None:
        add_plugins(self.app)


__all__ = [
    "PluginsEndpoint",
]
