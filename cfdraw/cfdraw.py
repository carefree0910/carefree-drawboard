import pynecone as pc

from .states import *


def index() -> pc.Component:
    return pc.center(
        pc.vstack(
            pc.heading(
                "Welcome to ",
                pc.code("cfdraw", font_size="1em"),
                " !",
                font_size="2em",
            ),
            pc.vstack(
                pc.text("Input your prompt"),
                pc.input(on_change=State.set_prompt),
                pc.cond(
                    State.busy,
                    pc.text(
                        "task: ",
                        pc.cond(State.uid, State.uid, "fetching..."),
                        font_size="0.5em",
                    ),
                    pc.button(
                        "Submit",
                        on_click=[State.init_task, State.submit_txt2img],
                    ),
                ),
            ),
            pc.divider(),
            pc.cond(
                State.busy,
                pc.circular_progress(is_indeterminate=True),
                pc.cond(
                    State.result_url,
                    pc.image(src=State.result_url, height="25em", width="25em")
                    # BaseState.result_urls,
                    # pc.responsive_grid(
                    #     *[
                    #         pc.image(src=url, height="25em", width="25em")
                    #         for url in BaseState.result_urls
                    #     ],
                    #     columns=[6],
                    #     spacing="4",
                    # ),
                ),
            ),
            spacing="1.5em",
            font_size="2em",
        ),
        padding_top="10%",
    )


app = pc.App(state=State)
app.add_page(index)
app.compile()
