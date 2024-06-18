from setuptools import setup, find_packages

VERSION = "0.0.3-alpha.0"
PACKAGE_NAME = "carefree-drawboard"

DESCRIPTION = "🎨 Infinite Drawboard in Python"
with open("README.md", encoding="utf-8") as f:
    LONG_DESCRIPTION = f.read()

setup(
    name=PACKAGE_NAME,
    version=VERSION,
    packages=find_packages(exclude=("tests",)),
    include_package_data=True,
    entry_points={"console_scripts": ["cfdraw = cfdraw.cli:cli"]},
    install_requires=[
        "rich",
        "tqdm",
        "regex",
        "typer",
        "future",
        "pathos",
        "pillow",
        "psutil",
        "aiohttp",
        "uvicorn",
        "filelock",
        "networkx",
        "aiofiles",
        "gunicorn",
        "requests",
        "watchdog",
        "matplotlib",
        "websockets",
        "safetensors",
        "python-multipart",
        "numpy>=1.22.3",
        "fastapi>=0.95.1",
        "pydantic>=2.0.0",
        "websockets>=12.0",
        "charset-normalizer==2.1.0",
    ],
    author="carefree0910",
    author_email="syameimaru.saki@gmail.com",
    description=DESCRIPTION,
    long_description=LONG_DESCRIPTION,
    long_description_content_type="text/markdown",
    keywords="python carefree-learn drawboard",
)
