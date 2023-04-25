# Stable Diffusion Inpainting

[Demo Video](https://user-images.githubusercontent.com/15677328/232319706-d3f10faa-7222-4de6-9c41-0c1933a1a8b3.mp4)

---

This example implements the `StableDiffusionInpainting` plugin with `carefree-drawboard` 🎨, here's how you can use it (you can also see the demo video above):
1. Drag/Upload an image to the drawboard 🎨.
2. Click the `Brush` plugin at the `rt` corner of the drawboard 🎨, and draw some masks on the image.
3. Once you are happy with the mask, click the `Finish Sketch` button to merge those masks into one single `PathNode`.
4. Select both the image and the `PathNode`, and click the `StableDiffusionInpainting` plugin at the `rt` corner of the selected `Node`s.
5. Fill in some parameters, submit, wait, and see the result.

> See [Details](#Details) for more details!

## Install

This example requires the famous `diffusers` library, which can be installed by:

```bash
pip install --upgrade transformers diffusers[torch]
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

3. We specified `useModal=True` for the plugin, so it will always popup as a modal.

4. We specified lots of `definitions`, in order to align with the parameters exposed by the `diffusers` library.

> See [`IFieldDefinition`](https://github.com/carefree0910/carefree-drawboard/wiki/PythonFieldsPlugin#ifielddefinition) for more details.

5. We used a special internal method: `filter` in the first two lines of the `process` method:

```python
path_data = self.filter(data.nodeDataList, SingleNodeType.PATH)[0]
image_data = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0]
```

That's because in Stable Diffusion Inpainting, we need to get two images: the original image and the mask image. In this example, we utilize the `Sketch` plugin (which will generate a `PathNode`) in `carefree-drawboard` 🎨 to draw the mask, and use a normal `ImageNode` to represent the original image.

So, the `nodeDataList` should be of length 2, and we can use the `filter` method to extract the `PathNode` and the `ImageNode` respectively.

After the extraction, we can use the common internal method `load_image` to load `PIL.Image` from `src`.

6. We specified `upload_root` to `./` (in `cfconfig.py`), so the images/projects will be saved to the cwd (current working directory).

> Default `upload_root` is `~/.cache/carefree-draw`.
