# carefree-drawboard 🎨

![Stable Diffusion](examples/assets/stable-diffusion.png)

> This is the screenshot I used for the [Stable Diffusion](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion) example and I don't know what should be the proper banner, help!

<div align="center">

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/carefree0910/carefree-drawboard/blob/dev/examples/server.ipynb)
[![PyPI version](https://badge.fury.io/py/carefree-drawboard.svg)](https://badge.fury.io/py/carefree-drawboard.svg)
![Checks](https://github.com/carefree0910/carefree-drawboard/actions/workflows/checks.yml/badge.svg)
[![License](https://img.shields.io/badge/License-Apache_2.0-yellowgreen.svg)](https://opensource.org/licenses/Apache-2.0)

### [Wiki](https://github.com/carefree0910/carefree-drawboard/wiki) | [Examples](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples) | [Stable Diffusion](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion) | [ControlNet](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion_controlnet) | [Inpainting](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion_inpainting)

<div align="left">

## Installation

`carefree-drawboard` 🎨 requires the following to get started:

* Python 3.8+
* [Node.js 18+](https://nodejs.org/en/)

> To be exact, we need `^14.13.1 || ^16 || >=18` because of the `tsconfck@2.1.1` package.

```bash
pip install carefree-drawboard
npm install --global yarn
```

Although we'll always try to help you install the frontend packages, it is recommended to install them beforehands because you can receive much more verbose:

```bash
cfdraw install
```

If you are interested in the latest features, you may use `pip` to install from source as well:

```bash
git clone https://github.com/carefree0910/carefree-drawboard.git
cd carefree-drawboard
pip install -e .
```

## Your first `carefree-drawboard` 🎨 App

Create a folder (e.g., `my_fancy_app`) wherever you like, get into it, and run

```bash
cfdraw init
```

This command will write two files to your folder (`my_fancy_app`). After which you can run the app in development mode:

```bash
cfdraw run
```

> When you run this command for the first time and have not called `cfdraw install` before, we will use `yarn` to install the JavaScript dependencies for you, which may be quite slow!

And you should see your app running at http://localhost:5123. Now you can play with the generated `app.py` file and see warm reload (yeah, not hot enough because we rely on the `reload` provided by `uvicorn` 🤣).

> Notice that the generated template implements a `GaussianBlur` plugin, which requires an image to pop up. You can upload an image either by dragging it directly to the drawboard 🎨, or by clicking the `Plus` button at the top right corner and select `Upload Image`.

[Demo Video](https://user-images.githubusercontent.com/15677328/232184463-627c2cd7-728a-49ce-93c6-7c878edc27b9.mp4)

## Examples

* [Getting Started](https://github.com/carefree0910/carefree-drawboard/wiki/Getting-Started), which is a more detailed tutorial to guide you step by step.
* [Image Processing](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/image_processing), which implements three common image processing plugins with `carefree-drawboard` 🎨.
* [Stable Diffusion](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion), which utilizes the famous `diffusers` library and implements two common Stable Diffusion plugins with `carefree-drawboard` 🎨.
* [**Caption & Diffusion**](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/caption_and_diffusion), which shows how can we combine two different kinds of models (`Image Captioning` & `Stable Diffusion`) and make them work together.
* [Stable Diffusion Inpainting](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion_inpainting), which shows how can we implement complicated plugins like `StableDiffusionInpainting` very easily with `carefree-drawboard` 🎨.
* [Stable Diffusion ControlNet](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion_controlnet), which shows how can we decouple complicated workflows like `ControlNet` into separate, lightweight, and reusable plugins very easily with `carefree-drawboard` 🎨.

## Documentation

Check the [Wiki](https://github.com/carefree0910/carefree-drawboard/wiki) page for documentation!

## Status

`carefree-drawboard` 🎨 is at a VERY early stage. It is launched in April 2023, and is not production ready (yet).

But we will rapidly update this project and launch new features every week (or, even everyday), so ⭐ star and 👀 watch this repository to stay up to date!

## Contributing

Contributions are truly welcomed! Here are some good (common) ways to get started:

* **GitHub Discussions**: Currently the best way to chat around.
* **GitHub Issues**: Bugs! Fixes! PRs!.

Apart from these:
* It might be the best to start from the [Contributing](https://github.com/carefree0910/carefree-drawboard/wiki/Contributing) Wiki page.
* If you are truly an enthusiast, you may check out our [Roadmap](https://github.com/carefree0910/carefree-drawboard/wiki/Roadmap), pick up what you are interested, and create the corresponding PR!

### Style Guide

If you are still interested: `carefree-drawboard` 🎨 adopted [`black`](https://github.com/psf/black) and [`mypy`](https://github.com/python/mypy) to stylize its codes, so you may need to check the format, coding style and type hint with them before your codes could actually be merged.

## Q&A

### Where are my creations stored?

They are stored on your local machine, so you're 100% privacy secured!

> The default dir is `~/.cache/carefree-draw`, but you can change it manually 

### Why Using 🎨 All Around?

Good question, so I asked GPT-4, it said:

> 🎨 (Artist Palette) - This emoji represents creativity, design, and artistic expression, which are all key aspects of the `carefree-drawboard` 🎨 platform.

Cool!

### Will there be a Discord Community?

Unfortunately I'm Chinese and I can hardly access to Discord. 🤣 Even if there are someone kindly enough to build one up for me, I can hardly connect to it so it will be impossible for me to stay tuned.

If you are kind enough please use the **GitHub Discussions**, or maybe there are other Discord replacements? I don't know, help!!!

如果有热心观众对这个项目感兴趣并愿意帮忙建立一个中文社区，欢迎联系我，我会非常感激的！！

### Why do you build this project?

> Also check [Design Philosophy](https://github.com/carefree0910/carefree-drawboard/wiki/Design-Philosophy).

In short, I believe that:
* Infinite Drawboard can unleash Infinite possibilities.
* If we can use `Python` to interact with it and even craft new plugins for it, it will be even better.

So here comes the `carefree-drawboard` 🎨, which is a `Python` interactible/customizable Infinite Drawboard. 🎉

My another motivation is that I love HuggingFace 🤗 models, and would love to use most if not all of them in one, single, integrated space. This actually inspires me the following idea: to build an 'AI Operation System' which can drive all the 'Softwares' (the AI models) and make them work together seamlessly.

> See [Brainstorm 🧠](https://github.com/carefree0910/carefree-drawboard/wiki/Brainstorm-%F0%9F%A7%A0) for more details!

My final goal is to make `carefree-drawboard` 🎨 a platform which can be used to build all kinds of AI applications. I know it will be a long journey but it is definitely worth trying.

> And the middle-term goal is to make 🤗 & 🎨 appear together more often. We may think 🤗🎨 as HuggingFace models using a powerful palette to create the world (with AI)!

## Credits

- [pynecone](https://github.com/pynecone-io/pynecone), which inspires me a lot.
- [Stable Diffusion](https://github.com/CompVis/stable-diffusion), the foundation of various image generation methods.
- [Diffusers](https://github.com/huggingface/diffusers), the adopted library for the [Stable Diffusion](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion) example.
- And You! Thank you for watching!
