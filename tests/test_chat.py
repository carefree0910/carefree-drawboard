import time

from cfdraw import *
from lorem_text import lorem


class ChatPlugin(IChatPlugin):
    notification = "A plugin that generates lorem ipsum chat."

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=600,
            h=400,
            useModal=True,
            tooltip="Pseudo Chat",
            pivot=PivotType.RIGHT,
            pluginInfo=IChatPluginInfo(
                initialText="Bot: Hello, can I help you?",
                closeOnSubmit=False,
                toastOnSubmit=False,
            ),
        )

    async def process(self, data: ISocketRequest) -> str:
        request = data.extraData
        context = request["context"]
        userInput = request["userInput"]
        if context:
            context += "\n"
        new_context = f"{context}\nYou: {userInput}\n\nBot: "
        text = lorem.words(20)
        for char in text:
            new_context += char
            self.send_progress(textList=[new_context])
            time.sleep(0.025)
        return new_context


register_plugin("chat")(ChatPlugin)
app = App()
