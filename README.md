# carefree-drawboard 🎨

![Carefree Drawboard][socialify-image]

<div align="center">

<br>

**✨ Build performant, business ready web apps in pure Python.**

<br>

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/carefree0910/carefree-drawboard/blob/dev/examples/server.ipynb)
[![PyPI version](https://badge.fury.io/py/carefree-drawboard.svg)](https://badge.fury.io/py/carefree-drawboard.svg)
![Checks](https://github.com/carefree0910/carefree-drawboard/actions/workflows/checks.yml/badge.svg)
[![License](https://img.shields.io/badge/License-Apache_2.0-yellowgreen.svg)](https://opensource.org/licenses/Apache-2.0)

### [Documentation](https://carefree0910.me/carefree-drawboard-doc/docs/getting-started) | [Examples](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples)

<div align="left">

<br>

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

[Demo Video](https://user-images.githubusercontent.com/15677328/234529497-8d7f5b61-9154-4211-8d99-ec09fca0dc2d.mp4)

## Examples

* [**Getting Started**](https://carefree0910.me/carefree-drawboard-doc/docs/getting-started), which is a more detailed tutorial to guide you step by step.
* [Image Processing](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/image_processing), which implements three common image processing plugins. It also shows how to use the `IPluginGroup` in `carefree-drawboard` 🎨 to group the plugins together and make the UI cleaner.
* [Stable Diffusion](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion), which utilizes the famous `diffusers` library and implements two common SD plugins.
* [**Caption & Diffusion**](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/caption_and_diffusion), which shows how can we combine two different kinds of models (`Image Captioning` & `Stable Diffusion`) and make them work together.
* [Stable Diffusion Inpainting](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion_inpainting), which shows how can we implement complicated plugins like `StableDiffusionInpainting` very easily.
* [Stable Diffusion ControlNet](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion_controlnet), which shows how can we decouple complicated workflows like `ControlNet` into separate, lightweight, and reusable plugins very easily.
* [**Carefree Creator**](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/carefree_creator), which contains a free, public-available [demo](https://drawboard-demo.nolibox.com/) of the real world business ready product we are selling. It is a web app with tons of AI magics, but still remains easy for `carefree-drawboard` 🎨 to implement them.

## Status

`carefree-drawboard` 🎨 is at a VERY early stage (it is launched in April 2023), so although it could be production ready (see [here](https://carefree0910.me/carefree-drawboard-doc/docs/user-guides/production) for more details), it does not have many real world use cases (yet).

But we will rapidly update this project and launch new features every week (or, even everyday), so ⭐ star and 👀 watch this repository to stay up to date!

## Contributing

* It might be the best to start from the [Contributing](https://carefree0910.me/carefree-drawboard-doc/docs/contributing-guides/contributing) page.
* If you are truly an enthusiast, you may check out our [Roadmap](https://carefree0910.me/carefree-drawboard-doc/docs/about/roadmap), pick up what you are interested, and create the corresponding PR!

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

Many thanks to [JSDu](https://github.com/JamesBonddu), who created a [Discord channel](https://discord.gg/UkfpFFmNd2) for my projects!!

如果有热心观众对这个项目感兴趣并愿意帮忙建立一个中文社区，欢迎联系我，我会非常感激的！！

**更新：** 热心观众（[JSDu](https://github.com/JamesBonddu)）出现啦！非常感谢！！！（猛戳[这里](https://discord.gg/UkfpFFmNd2)加入我们！）

### Why do you build this project?

> Also check [Design Philosophy](https://carefree0910.me/carefree-drawboard-doc/docs/reference/design-philosophy).

In short, I believe that:
* Infinite Drawboard can unleash Infinite possibilities.
* If we can use `Python` to interact with it and even craft new plugins for it, it will be even better.

So here comes the `carefree-drawboard` 🎨, which is a `Python` interactible/customizable Infinite Drawboard. 🎉

My another motivation is that I love HuggingFace 🤗 models, and would love to use most if not all of them in one, single, integrated space. This actually inspires me the following idea: to build an 'AI Operation System' which can drive all the 'Softwares' (the AI models) and make them work together seamlessly.

> See [Brainstorm](https://carefree0910.me/carefree-drawboard-doc/docs/reference/brainstorm) for more details!

My final goal is to make `carefree-drawboard` 🎨 a platform which can be used to build all kinds of AI applications. I know it will be a long journey but it is definitely worth trying.

> And the middle-term goal is to make 🤗 & 🎨 appear together more often. We may think 🤗🎨 as HuggingFace models using a powerful palette to create the world (with AI)!

## Credits

- [llunalabs](https://www.llunalabs.com/), for the kindeness & community support.
- [pynecone](https://github.com/pynecone-io/pynecone), which inspires me a lot.
- [Stable Diffusion](https://github.com/CompVis/stable-diffusion), the foundation of various image generation methods.
- [Diffusers](https://github.com/huggingface/diffusers), the adopted library for the [Stable Diffusion](https://github.com/carefree0910/carefree-drawboard/tree/dev/examples/stable_diffusion) example.
- [@liujs1](https://github.com/liujs1), who provides me the nice looking icons.
- And You! Thank you for watching!

[socialify-image]: https://socialify.git.ci/carefree0910/carefree-drawboard/image?description=1&descriptionEditable=Infinite%20Drawboard%20in%20Python%20🐍&forks=1&issues=1&logo=https%3A%2F%2Fem-content.zobj.net%2Fthumbs%2F240%2Fmicrosoft%2F319%2Fartist-palette_1f3a8.png&name=1&pattern=Floating%20Cogs&stargazers=1&theme=Auto
