# Image Captioning + Stable Diffusion

[Demo Video](https://user-images.githubusercontent.com/15677328/234509709-9ad90735-4da3-4962-b2ed-b1449f8bd7cc.mp4)

> The demo video has a nice progress bar when generating the new image, which requires to launch the `advanced.py`. See [Run](#Run) for more details.

---

This example implements an `ImageCaptioning` plugin and a `StableDiffusion` plugin with `carefree-drawboard` 🎨. It mainly shows the potential of `carefree-drawboard` 🎨 to integrate various multimodal models together.

> * For example, we can first generate a caption of a given image, then use this caption to generate a new image using the Stable Diffusion model. In this way, we can generate variation images for any given image!
> * See [Details](#Details) for more details.

## Run

```bash
cfdraw run
```

> We will install the required dependencies for you with the `run` command, so the first time may take a while.

We use `app` as the default entry name. If your script is named other than `app.py` (e.g. `{name}.py`), then run:

```bash
cfdraw run --module {name}
```

For example, we provide an `advanced.py`, which utilized `send_progress` to show some nice progress bars on `carefree-drawboard` 🎨. To launch it, run:

```bash
cfdraw run --module advanced
```

## Details

1. We utilized `cache_resource` to avoid re-initializing models every hot-rerun.
   * This is useful when we are focusing on the plugin styles/logic.
   * At production stage, we can call the initialization function at the very beginning to pre-load the models.
2. We used:
   * `follow=True` and `nodeConstraint=NodeConstraints.IMAGE` for `captioning` plugin, so it will and only will be displayed when the selected `Node` is an image.
   * `follow=True` and `nodeConstraint=NodeConstraints.TEXT` for `txt2img` plugin, so it will and only will be displayed when the selected `Node` is a text.
       * And we'll use the content in this `TextNode` as the input `prompt` of the Stable Diffusion model.

> See [Plugin Positioning](https://github.com/carefree0910/carefree-drawboard/wiki/Details#plugin-positioning) for more details.

3. If you run image processing consecutively (e.g. first `captioning` then `txt2img`), you will find a `from` field in the `meta` data. This can be used to track the process history of every `Node`.

4. We specified `useModal=True` for the `txt2img` plugin, so it will always popup as a modal.

5. We specified lots of `definitions`, in order to align with the parameters exposed by the `diffusers` library.

> See [`IFieldDefinition`](https://github.com/carefree0910/carefree-drawboard/wiki/PythonFieldsPlugin#ifielddefinition) for more details.

6. We specified `upload_root` to `./` (in `cfconfig.py`), so the images/projects will be saved to the cwd (current working directory).

> Default `upload_root` is `~/.cache/carefree-draw`.
