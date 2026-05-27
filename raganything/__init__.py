from .config import RAGAnythingConfig as RAGAnythingConfig
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .raganything import RAGAnything as RAGAnything

__version__ = "1.2.9"
__author__ = "Uday Dolas"
__url__ = "https://github.com/noisyboy08/RAG-Anything"

__all__ = ["RAGAnything", "RAGAnythingConfig"]


def __getattr__(name: str):
    if name == "RAGAnything":
        from .raganything import RAGAnything

        return RAGAnything
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
