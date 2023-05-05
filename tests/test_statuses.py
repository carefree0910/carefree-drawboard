import time

from cfdraw import *

settings = IPluginSettings(
    w=200,
    h=110,
    nodeConstraint=NodeConstraints.IMAGE,
    pivot=PivotType.RT,
    follow=True,
    pluginInfo=IFieldsPluginInfo(
        header="Bar",
        definitions={},
        retryInterval=1000,
        noErrorToast=True,
    ),
)

num_plugins = 6
all_settings = {}
for i in range(num_plugins):
    identifier = f"foo_{i}"
    s = settings.copy()
    s.offsetY = 48 + (i + 1) * 56
    all_settings[identifier] = s

    @register_plugin(f"foo_{i}")
    class FooPlugin(IFieldsPlugin):
        @property
        def settings(self) -> IPluginSettings:
            return all_settings[self.identifier]

        async def process(self, data: ISocketRequest) -> None:
            total = 20
            for j in range(total):
                # if `send_progress` does not execute successfully, break the loop
                if not self.send_progress((j + 1) / total):
                    break
                time.sleep(0.25)

            # Returning `None` will trigger an exception at client side, and the
            # client side will retry after one second.
            # That's why we can have an 'infinite loop' of progress bars.
            return None


app = App()
