# Image Captioning + Stable Diffusion

[Demo Video](https://user-images.githubusercontent.com/15677328/232086732-11edc95e-60fe-4216-85fa-5569fe8b6b19.mp4)

---

This example implements an Image Captioning plugin and a Stable Diffusion plugin with `carefree-drawboard` 🎨. It mainly shows the potential of `carefree-drawboard` 🎨 to integrate various multimodal models together.

> * For example, we can first generate a caption of a given image, then use this caption to generate a new image using the Stable Diffusion model. In this way, we can generate variation images for any given image!
> * See [Details](#Details) for more details.

## Install

This example requires the famous `diffusers` (and `transformers`) library, which can be installed by:

```bash
pip install --upgrade diffusers[torch]
```

## Run

```bash
cfdraw run
```

> We use `app` as the default entry name. If your script is named other than `app.py` (e.g. `{name}.py`), then run:

```bash
cfdraw run --module {name}
```

## Details

1. We utilized `cache_resource` to avoid re-initializing models every hot-rerun.
   * This is useful when we are focusing on the plugin styles/logic.
   * At production stage, we can call the initialization function at the very beginning to pre-load the models.
2. We used:
   * `follow=True` and `nodeConstraint=NodeConstraints.IMAGE` for `captioning` plugin, so it will and only will be displayed when the selected `Node` is an image.
   * `follow=True` and `nodeConstraint=NodeConstraints.TEXT` for `txt2img` plugin, so it will and only will be displayed when the selected `Node` is a text.
       * And we'll use the content in this `TextNode` as the input `prompt` of the Stable Diffusion model.

> See [Plugin Positioning](https://github.com/carefree0910/carefree-drawboard/wiki/Plugin-Positioning) for more details.

3. We utilized `register_all_available_plugins` to register all internal plugins.

> Currently there is only one internal plugin: `MetaPlugin`, which can show you the `meta` information of a `Node`.

4. If you run image processing consecutively (e.g. first `captioning` then `txt2img`), you will find a `from` field in the `meta` data. This can be used to track the process history of every `Node`.

4. We specified `useModal=True` for the `txt2img` plugin, so it will always popup as a modal.

5. We specified lots of `definitions`, in order to align with the parameters exposed by the `diffusers` library.

> See [`IFieldDefinition`](https://github.com/carefree0910/carefree-drawboard/wiki/PythonHttpFieldsPlugin#ifielddefinition) for more details.

6. We specified `upload_root` to `./`, so the images/projects will be saved to the cwd (current working directory).

> Default `upload_root` is `~/.cache/carefree-draw`.
