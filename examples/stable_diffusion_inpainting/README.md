# Stable Diffusion Inpainting

[Demo Video](https://user-images.githubusercontent.com/15677328/232319706-d3f10faa-7222-4de6-9c41-0c1933a1a8b3.mp4)

---

This example implements the `StableDiffusionInpainting` plugin with `carefree-drawboard` 🎨, here's how you can use it (you can also see the demo video above):
1. Drag/Upload an image to the drawboard 🎨.
2. Click the Brush plugin at the `rt` corner of the drawboard 🎨, and draw some masks on the image.
3. Once you are happy with the mask, click the `Finish Sketch` button to merge those masks into one single `PathNode`.
4. Select both the image and the `PathNode`, and click the `StableDiffusionInpainting` plugin at the `rt` corner of the selected `Node`s.
5. Wait and see the result.

> See [Details](#Details) for more details!

## Install

This example requires the famous `diffusers` library, which can be installed by:

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
2. We used `follow=True` and `nodeConstraint=NodeConstraints.MULTI_NODE`, so the plugin will and only will be displayed when the multiple `Node`s are selected.

> See [Plugin Positioning](https://github.com/carefree0910/carefree-drawboard/wiki/Plugin-Positioning) for more details.

3. We utilized `register_all_available_plugins` to register all internal plugins.

> Currently there is only one internal plugin: `Meta` plugin, which can show you the `meta` information of a `Node`.

4. We specified `useModal=True` for the plugin, so it will always popup as a modal.

5. We specified lots of `definitions`, in order to align with the parameters exposed by the `diffusers` library.

> See [`IFieldDefinition`](https://github.com/carefree0910/carefree-drawboard/wiki/PythonHttpFieldsPlugin#ifielddefinition) for more details.

6. We specified `upload_root` to `./`, so the images/projects will be saved to the cwd (current working directory).

> Default `upload_root` is `~/.cache/carefree-draw`.
