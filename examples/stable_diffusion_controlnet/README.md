# Stable Diffusion ControlNet

[Demo Video](https://user-images.githubusercontent.com/15677328/234506769-4211f62b-3152-47c3-b3d6-8f0010ceb36d.mp4)

> The demo video has a nice progress bar when generating the new image, which requires to launch the `advanced.py`. See [Run](#Run) for more details.

---

This example implements the `StableDiffusionControlNet` plugin (along with a `Canny` plugin to generate the annotations) with `carefree-drawboard` 🎨, here's how you can use it (you can also see the demo video above):
1. Drag/Upload an image to the drawboard 🎨.
2. Click the `Canny` plugin at the `rt` corner of the selecting `ImageNode` (it is the bottom-most one), the annotation should be generated in no time.
3. Click the `StableDiffusionControlNet` plugin at the `rt` corner of the selected annotation `ImageNode`.
4. Fill in some parameters, submit, wait, and see the result.

> * You may notice that the `ControlNet` plugin poped up no matter what `ImageNode` you are selecting. This is as expected because `ControlNet` can indeed accept any image as input. 😉
> * See [Details](#Details) for more details!

## Install

This example has quite a few prerequisites, see [the original blog](https://huggingface.co/blog/controlnet#the-stablediffusioncontrolnetpipeline) for more details.

## Run

```bash
cfdraw run
```

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
2. We used `follow=True` and `nodeConstraint=NodeConstraints.MULTI_NODE`, so the plugin will and only will be displayed when the multiple `Node`s are selected.

> See [Plugin Positioning](https://carefree0910.me/carefree-drawboard-doc/docs/plugins/#plugin-positioning) for more details.

3. We specified `useModal=True` for the plugin, so it will always popup as a modal.

4. We specified lots of `definitions`, in order to align with the parameters exposed by the `diffusers` library.

> See [`IFieldDefinition`](https://carefree0910.me/carefree-drawboard-doc/docs/api-reference/Types#ifielddefinition) for more details.

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
