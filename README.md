# RAG-Anything — Complete Technical Reference

> **Version:** 1.2.9 | **Author:** Uday Dolas (uduu) | **License:** MIT
> **Repository:** https://github.com/noisyboy08/RAG-Anything

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Module Map & Dependency Graph](#3-module-map--dependency-graph)
4. [Core Classes — In-Depth Reference](#4-core-classes--in-depth-reference)
   - 4.1 [RAGAnythingConfig (config.py)](#41-raganythingconfig-configpy)
   - 4.2 [RAGAnything (raganything.py)](#42-raganything-raganythingpy)
   - 4.3 [ProcessorMixin (processor.py)](#43-processormixin-processorpy)
   - 4.4 [QueryMixin (query.py)](#44-querymixin-querypy)
   - 4.5 [BatchMixin (batch.py)](#45-batchmixin-batchpy)
5. [Parsing Subsystem](#5-parsing-subsystem)
   - 5.1 [Parser Abstraction (parser.py)](#51-parser-abstraction-parserpy)
   - 5.2 [MinerU Parser](#52-mineru-parser)
   - 5.3 [Docling Parser](#53-docling-parser)
   - 5.4 [PaddleOCR Parser](#54-paddleocr-parser)
   - 5.5 [Office / Non-PDF Conversion Pipeline](#55-office--non-pdf-conversion-pipeline)
   - 5.6 [BatchParser (batch_parser.py)](#56-batchparser-batch_parserpy)
6. [Multimodal Processors (modalprocessors.py)](#6-multimodal-processors-modalprocessorspy)
   - 6.1 [ContextConfig & ContextExtractor](#61-contextconfig--contextextractor)
   - 6.2 [BaseModalProcessor](#62-basemodalprocessor)
   - 6.3 [ImageModalProcessor](#63-imagemodalprocessor)
   - 6.4 [TableModalProcessor](#64-tablemodalprocessor)
   - 6.5 [EquationModalProcessor](#65-equationmodalprocessor)
   - 6.6 [GenericModalProcessor](#66-genericmodalprocessor)
   - 6.7 [JSON Parsing & Robustness Strategies](#67-json-parsing--robustness-strategies)
7. [Prompt Engineering Layer (prompt.py)](#7-prompt-engineering-layer-promptpy)
8. [Utility Layer (utils.py)](#8-utility-layer-utilspy)
9. [LightRAG Storage Integration](#9-lightrag-storage-integration)
10. [Data Flow: Document Ingestion (End-to-End)](#10-data-flow-document-ingestion-end-to-end)
11. [Data Flow: Query Execution (End-to-End)](#11-data-flow-query-execution-end-to-end)
12. [VLM-Enhanced Query Pipeline](#12-vlm-enhanced-query-pipeline)
13. [Batch Processing Architecture](#13-batch-processing-architecture)
14. [Cache Strategy & Deduplication](#14-cache-strategy--deduplication)
15. [Knowledge Graph Integration](#15-knowledge-graph-integration)
16. [DocStatus State Machine](#16-docstatus-state-machine)
17. [Environment Variables — Complete Reference](#17-environment-variables--complete-reference)
18. [Installation Guide](#18-installation-guide)
19. [Configuration Deep Dive](#19-configuration-deep-dive)
20. [Full API Reference](#20-full-api-reference)
21. [End-to-End Example — Annotated](#21-end-to-end-example--annotated)
22. [Extending RAG-Anything](#22-extending-rag-anything)
23. [Troubleshooting & Known Issues](#23-troubleshooting--known-issues)
24. [Project File Reference](#24-project-file-reference)

---

## 1. Project Overview

**RAG-Anything** is a fully multimodal Retrieval-Augmented Generation (RAG) framework built on top of [LightRAG](https://github.com/HKUDS/LightRAG). While traditional RAG systems treat documents as flat strings of text, RAG-Anything natively understands and indexes *every modality* found inside a document:

| Modality | What RAG-Anything Does |
|---|---|
| **Text** | Chunked and inserted into LightRAG's KV + vector + graph stores via standard NLP pipeline |
| **Images** | Vision-Language Model (VLM) generates structured JSON description; result stored as a graph entity and vector chunk |
| **Tables** | LLM extracts structure, statistics, trends; stored as entity with `belongs_to` graph edge to the source image/table |
| **Equations** | LLM interprets LaTeX/MathML, explains variables and significance; stored with math entity type |
| **Generic** | Fallback processor handles audio transcripts, code blocks, diagrams, etc. |

### Design Philosophy

- **Separation of concerns**: Parsing, description generation, and graph storage are fully decoupled through mixin-based inheritance and processor classes.
- **Parser-agnostic ingestion**: A common `BaseParser` interface allows interchangeable use of MinerU, Docling, or PaddleOCR with zero change to downstream code.
- **Context-aware processing**: Every modal element receives a *context window* of surrounding text (configurable by page or chunk), so the VLM/LLM has semantic grounding when generating descriptions.
- **Cache-first**: Both the parse step (avoiding re-parsing the same document) and the multimodal query step (via `llm_response_cache`) use content-addressed hashing to skip redundant LLM calls.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          RAGAnything                                 │
│  (inherits ProcessorMixin + QueryMixin + BatchMixin)                 │
│                                                                      │
│  self.lightrag : LightRAG ──────────────────────────────┐            │
│  self.config   : RAGAnythingConfig                      │            │
│  self.modal_processors : dict[str, BaseModalProcessor]  │            │
│  self.vision_model_func                                 │            │
│  self.llm_model_func                                    │            │
│  self.embedding_func                                    │            │
└───────────────┬─────────────────────────────────────────┼────────────┘
                │                                         │
                │ document                                │ entity/chunk/edge
                ▼                                         ▼
    ┌────────────────────┐              ┌─────────────────────────────────┐
    │  Parser Layer      │              │       LightRAG Storage           │
    │  ─────────────     │              │  ─────────────────────────────   │
    │  MinerU            │              │  text_chunks (KV)               │
    │  Docling           │              │  chunks_vdb (vector)            │
    │  PaddleOCR         │              │  entities_vdb (vector)          │
    └────────┬───────────┘              │  relationships_vdb (vector)     │
             │ content_list             │  chunk_entity_relation_graph    │
             ▼                         │  llm_response_cache (KV)        │
    ┌────────────────────┐              │  parse_cache (KV)               │
    │ separate_content() │              └─────────────────────────────────┘
    └───┬────────────────┘
        │
        ├─ text_content ──► LightRAG.ainsert()
        │
        └─ multimodal_items[] ──► Modal Processors
                                    ├─ ImageModalProcessor
                                    ├─ TableModalProcessor
                                    ├─ EquationModalProcessor
                                    └─ GenericModalProcessor
                                           │
                                           ▼
                                  ContextExtractor
                                  (supplies surrounding text)
                                           │
                                           ▼
                                  VLM / LLM caption call
                                           │
                                           ▼
                                  _create_entity_and_chunk()
                                  ├─ text_chunks_db.upsert()
                                  ├─ chunks_vdb.upsert()
                                  ├─ entities_vdb.upsert()
                                  ├─ knowledge_graph_inst.upsert_node()
                                  └─ merge_nodes_and_edges()
```

---

## 3. Module Map & Dependency Graph

```
raganything/
├── __init__.py          # Public API: RAGAnything, RAGAnythingConfig
├── base.py              # DocStatus enum (READY → HANDLING → PROCESSED|FAILED)
├── config.py            # RAGAnythingConfig dataclass + env var mapping
├── raganything.py       # RAGAnything class (orchestrator)
│     ├── extends ProcessorMixin  (processor.py)
│     ├── extends QueryMixin      (query.py)
│     └── extends BatchMixin      (batch.py)
├── processor.py         # ProcessorMixin: parse_and_process(), _init_modal_processors()
├── query.py             # QueryMixin: aquery(), aquery_with_multimodal(), aquery_vlm_enhanced()
├── batch.py             # BatchMixin: aprocess_documents_batch()
├── parser.py            # BaseParser, MineruParser, DoclingParser, PaddleOCRParser
├── batch_parser.py      # BatchParser (parallel multi-doc parse with ThreadPoolExecutor)
├── modalprocessors.py   # ContextConfig, ContextExtractor, BaseModalProcessor,
│                        # ImageModalProcessor, TableModalProcessor,
│                        # EquationModalProcessor, GenericModalProcessor
├── prompt.py            # PROMPTS dict: system prompts, analysis prompts, chunk templates
└── utils.py             # separate_content(), encode_image_to_base64(),
                         # validate_image_file(), insert_text_content(),
                         # get_processor_for_type()
```

**External dependencies (key):**

| Package | Role |
|---|---|
| `lightrag` | Graph KV storage, vector DBs, entity extraction, query engine |
| `magic-pdf` (MinerU) | PDF-to-structured-JSON with layout analysis |
| `docling` | Alternative PDF parser from IBM |
| `paddleocr` | OCR-based parser for scanned documents |
| `tiktoken` | Token counting for context truncation (requires offline cache for air-gapped) |
| `tqdm` | Progress bars for batch processing |
| `python-dotenv` | `.env` file loading |

---

## 4. Core Classes — In-Depth Reference

### 4.1 RAGAnythingConfig (config.py)

`RAGAnythingConfig` is a `@dataclass` that centralises every tunable parameter. It is the **single source of truth** for RAGAnything behaviour — both direct construction and `.env` environment variable mapping work through this class.

```python
@dataclass
class RAGAnythingConfig:
    # ── Storage ──────────────────────────────────────────
    working_dir: str = "./rag_storage"       # LightRAG working directory
    
    # ── Parsing ──────────────────────────────────────────
    parser: str = "mineru"                  # "mineru" | "docling" | "paddleocr"
    parse_method: str = "auto"              # "auto" | "txt" | "ocr"
    parser_output_dir: str = "./output"     # Where parsed artefacts (images, etc.) land
    display_content_stats: bool = False     # Log a modality breakdown after parsing
    
    # ── Modal Processing Toggles ─────────────────────────
    enable_image_processing: bool = True
    enable_table_processing: bool = True
    enable_equation_processing: bool = True
    
    # ── Batch Processing ──────────────────────────────────
    max_concurrent_files: int = 1           # Max parallel RAG insertions
    supported_file_extensions: list = ...  # Defaults to all parser-supported types
    recursive_folder_processing: bool = True
    
    # ── Context Extraction ────────────────────────────────
    context_window: int = 1                 # Pages / chunks on each side
    context_mode: str = "page"             # "page" | "chunk"
    max_context_tokens: int = 2000
    include_headers: bool = True
    include_captions: bool = True
    context_filter_content_types: list = ["text"]
    content_format: str = "minerU"         # Hint for ContextExtractor format auto-detect
```

**Environment variable mapping** (via `classmethod from_env()`):

| Config Field | Environment Variable |
|---|---|
| `working_dir` | `WORKING_DIR` |
| `parser` | `PARSER` |
| `parse_method` | `PARSE_METHOD` |
| `parser_output_dir` | `OUTPUT_DIR` |
| `enable_image_processing` | `ENABLE_IMAGE_PROCESSING` |
| `enable_table_processing` | `ENABLE_TABLE_PROCESSING` |
| `enable_equation_processing` | `ENABLE_EQUATION_PROCESSING` |
| `max_concurrent_files` | `MAX_CONCURRENT_FILES` |
| `context_window` | `CONTEXT_WINDOW` |
| `context_mode` | `CONTEXT_MODE` |
| `max_context_tokens` | `MAX_CONTEXT_TOKENS` |
| `include_headers` | `INCLUDE_HEADERS` |
| `include_captions` | `INCLUDE_CAPTIONS` |
| `content_format` | `CONTENT_FORMAT` |

---

### 4.2 RAGAnything (raganything.py)

`RAGAnything` is the top-level orchestration class. It uses **mixin inheritance** rather than monolithic inheritance:

```python
class RAGAnything(ProcessorMixin, QueryMixin, BatchMixin):
    def __init__(
        self,
        config: RAGAnythingConfig = None,
        llm_model_func = None,
        vision_model_func = None,
        embedding_func: EmbeddingFunc = None,
        lightrag: LightRAG = None,    # Optional: pass a pre-initialized LightRAG
    ):
```

**Constructor sequence:**
1. Store `config`, `llm_model_func`, `vision_model_func`, `embedding_func`.
2. If `lightrag` is provided, assign directly (skip LightRAG init).
3. Otherwise, defer LightRAG initialisation to `_ensure_lightrag_initialized()`.
4. Set `self.modal_processors = {}` — populated lazily on first document process.

**Key internal methods:**

| Method | Purpose |
|---|---|
| `_ensure_lightrag_initialized()` | Lazy-init LightRAG; constructs it from config + LLM/embed funcs |
| `_init_modal_processors()` | Creates one processor per modal type; sets content source |
| `_get_parse_cache()` | Returns the shared KV store used as the parse cache |
| `process_document_complete()` | Sync wrapper calling `aprocess_document_complete()` |
| `aprocess_document_complete()` | Main ingestion entry point (async) |

---

### 4.3 ProcessorMixin (processor.py)

Handles the **entire document ingestion pipeline** from file path to LightRAG index entries.

#### `aprocess_document_complete(file_path, output_dir, parse_method, **kwargs)`

```
1. _ensure_lightrag_initialized()
2. compute parse cache key: md5(file_path + parse_method + parser + content_format)
3. Check parse_cache (LightRAG KV store):
   ├─ HIT → skip parsing, load cached content_list
   └─ MISS → call _parse_document(file_path, output_dir, parse_method)
              store result in parse_cache
4. separate_content(content_list)
   ├─ text_content: str
   └─ multimodal_items: list[dict]
5. _init_modal_processors(content_list)   # gives each processor the content source
6. Insert text: LightRAG.ainsert(text_content, file_paths=file_path)
7. Process each multimodal item:
   - Get item info: {page_idx, index, type}
   - Get processor: get_processor_for_type(modal_processors, type)
   - Call processor.process_multimodal_content(
         modal_content, content_type, file_path,
         item_info=item_info, doc_id=doc_id, chunk_order_index=i
     )
8. LightRAG._insert_done()   # flush all storage backends
```

#### Parse Cache Key Construction

```python
cache_key = md5(
    file_path + ":" + parse_method + ":" + parser + ":" + content_format
)
# prefixed as "parse_cache-{cache_key}"
```

#### `_parse_document(file_path, output_dir, parse_method)`

1. Instantiate the configured parser via `get_parser(self.config.parser)`.
2. Call `parser.parse_document(file_path, output_dir, method=parse_method)`.
3. Returns a `content_list` — a `list[dict]` where each dict has a `type` field (`"text"`, `"image"`, `"table"`, `"equation"`, etc.) and type-specific payload fields.

---

### 4.4 QueryMixin (query.py)

All query logic is isolated here. There are **three distinct query surfaces**:

#### 4.4.1 `aquery(query, mode, system_prompt, **kwargs)`

Pure text query pipeline:

```
1. Detect vlm_enhanced flag (default: True if vision_model_func is set)
2. If vlm_enhanced:
   └─ Delegate to aquery_vlm_enhanced()
3. Else:
   └─ Build QueryParam(mode=mode, **kwargs)
      Call LightRAG.aquery(query, param=query_param, system_prompt=system_prompt)
```

**`mode` values (inherited from LightRAG):**

| Mode | Description |
|---|---|
| `local` | Retrieves only entity-level context from KG |
| `global` | Retrieves community-level summaries |
| `hybrid` | Combines local + global |
| `naive` | Simple vector similarity (no graph) |
| `mix` | Combines naive + hybrid (default) |
| `bypass` | Passes query directly to LLM without retrieval |

#### 4.4.2 `aquery_with_multimodal(query, multimodal_content, mode, **kwargs)`

```
1. _ensure_lightrag_initialized()
2. If no multimodal_content → fallback to aquery()
3. Generate cache key:
   md5(json({ query, mode, normalized_multimodal_content, relevant_kwargs }))
   prefix: "multimodal_query:"
4. Check llm_response_cache:
   ├─ HIT → return cached["return"]
   └─ MISS → continue
5. _process_multimodal_query_content(query, multimodal_content):
   For each item:
     - image  → _describe_image_for_query()   (VLM call via base64 encode)
     - table  → _describe_table_for_query()   (LLM call with table prompt)
     - equation → _describe_equation_for_query() (LLM call with equation prompt)
     - other  → _describe_generic_for_query()
   → Produces enhanced_query = "User query: {query}\n\nRelated table content: ..."
   → Appended with QUERY_ENHANCEMENT_SUFFIX
6. aquery(enhanced_query, mode=mode, **kwargs)
7. Save result to llm_response_cache
8. Persist cache: llm_response_cache.index_done_callback()
```

#### 4.4.3 `aquery_vlm_enhanced(query, mode, system_prompt, extra_safe_dirs, **kwargs)`

This is the most sophisticated query path. It transforms the standard RAG retrieved-context into an actual **multimodal VLM prompt** by inlining real images:

```
1. query_param = QueryParam(mode=mode, only_need_prompt=True, **kwargs)
2. raw_prompt = LightRAG.aquery(query, param=query_param)
   # Returns the retrieval context as a text prompt (not yet sent to LLM)
3. _process_image_paths_for_vlm(raw_prompt, extra_safe_dirs):
   - Regex scan for pattern: r"Image Path:\s*([^\r\n]*?\.(?:jpg|jpeg|png|...)"
   - For each match:
     a. validate_image_file(path) — checks extension, size ≤50MB, no symlinks
     b. Security check: path must be under cwd, config.working_dir,
        config.parser_output_dir, or extra_safe_dirs
     c. encode_image_to_base64(path) → store in self._current_images_base64[]
     d. Replace "Image Path: X" with "Image Path: X\n[VLM_IMAGE_N]"
4. If no images found → fallback to normal aquery()
5. _build_vlm_messages_with_images(enhanced_prompt, query, system_prompt):
   - Split enhanced_prompt at "[VLM_IMAGE_N]" markers
   - Interleave text and {"type":"image_url","image_url":{"url":"data:image/jpeg;base64,..."}}
   - Append user question
   - Return OpenAI-compatible messages list
6. _call_vlm_with_multimodal_content(messages):
   - vision_model_func("", messages=messages)
```

**Cache key normalisation** for multimodal queries:
- File paths: only basename used (portable across machines)
- Large table/body fields (>200 chars): MD5 hash used as surrogate key
- Only `stream`, `response_type`, `top_k`, `max_tokens`, `temperature` are included from `**kwargs`

---

### 4.5 BatchMixin (batch.py)

Provides `aprocess_documents_batch()` for indexing **many documents** from a folder or list with controlled parallelism and two-stage multimodal processing.

**Two-stage batch processing:**

```
Stage 1: Description Generation (parallel)
──────────────────────────────────────────
For each document × each multimodal item:
  processor.generate_description_only(modal_content, content_type, item_info)
  → Returns (description_text, entity_info_dict)
  → entity_info_dict: {entity_name, entity_type, summary}
  
  No graph writes yet.

Stage 2: Entity Extraction & Graph Merge (sequential per doc)
──────────────────────────────────────────────────────────────
For each pre-generated description:
  _create_entity_and_chunk(..., batch_mode=True)
  → text_chunks_db.upsert()
  → chunks_vdb.upsert()
  → entities_vdb.upsert()
  → knowledge_graph_inst.upsert_node()
  → extract_entities() (LightRAG's NER pipeline)
  → build "belongs_to" edges for all entities within a modal chunk
  
merge_nodes_and_edges() called once at end of each document.
```

This two-stage design avoids a race condition where parallel LLM calls would try to simultaneously merge graph nodes — merging is deferred to a sequential pass.

---

## 5. Parsing Subsystem

### 5.1 Parser Abstraction (parser.py)

All parsers implement the `BaseParser` abstract class:

```python
class BaseParser(ABC):
    OFFICE_FORMATS = {".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"}
    IMAGE_FORMATS  = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".gif", ".webp"}
    TEXT_FORMATS   = {".txt", ".md"}
    
    @abstractmethod
    def parse_document(self, file_path, output_dir, method="auto", **kwargs) -> list[dict]:
        ...
    
    @abstractmethod
    def check_installation(self) -> bool:
        ...
```

**Parser registry:**

```python
SUPPORTED_PARSERS = {
    "mineru":    MineruParser,
    "docling":   DoclingParser,
    "paddleocr": PaddleOCRParser,
}

def get_parser(parser_type: str) -> BaseParser:
    cls = SUPPORTED_PARSERS.get(parser_type)
    if not cls:
        raise ValueError(f"Unsupported parser: {parser_type}")
    return cls()
```

---

### 5.2 MinerU Parser

**Class:** `MineruParser(BaseParser)`

MinerU (`magic-pdf`) is the **default and recommended** parser. It performs deep layout analysis and returns a structured content list with precise element types.

**Content list format** (each element):
```python
{
    "type": "text" | "image" | "table" | "equation",
    "page_idx": int,              # 0-based page number
    # For text:
    "text": str,
    "text_level": int,            # 0 = body, 1-6 = heading level
    # For image:
    "img_path": str,              # Absolute path to extracted image file
    "image_caption": list[str],
    "image_footnote": list[str],
    # For table:
    "img_path": str,              # Table rendered as image
    "table_caption": list[str],
    "table_body": str,            # HTML or Markdown representation
    "table_footnote": list[str],
    # For equation:
    "text": str,                  # LaTeX string
    "text_format": str,           # "latex" | "mathml"
}
```

**`parse_document()` internals:**
1. Calls `magic_pdf.pipe.UnicodeFormula` or layout pipeline depending on `method`:
   - `auto`: MinerU's hybrid mode (text layer + OCR fallback)
   - `txt`: Text-only extraction (fast, no OCR)
   - `ocr`: Full OCR pipeline (slower, handles scanned PDFs)
2. For non-PDF inputs, the file is first converted to PDF (see §5.5).
3. Returns `content_list`.

---

### 5.3 Docling Parser

**Class:** `DoclingParser(BaseParser)`

IBM's Docling library provides an alternative parsing path with its own layout and structure understanding. Uses the same `content_list` output contract as MinerU but may produce different structure granularity.

```python
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert(file_path)
```

`DoclingParser` translates Docling's internal `DoclingDocument` representation into the shared `content_list` format.

---

### 5.4 PaddleOCR Parser

**Class:** `PaddleOCRParser(BaseParser)`

Uses PaddleOCR's detection and recognition pipelines. Best for:
- Scanned documents (no text layer)
- Chinese-language documents
- Images with embedded text

**Content format**: primarily `"text"` and `"image"` types, as PaddleOCR specialises in OCR, not structural analysis.

---

### 5.5 Office / Non-PDF Conversion Pipeline

All parsers share this preprocessing chain for non-PDF inputs (implemented in `BaseParser._convert_to_pdf()`):

```
Input file
    │
    ├─ .doc / .docx / .ppt / .pptx / .xls / .xlsx
    │       │
    │       └─► LibreOffice (system binary, `soffice --headless --convert-to pdf`)
    │               → temp.pdf
    │
    ├─ .txt / .md
    │       │
    │       ├─► ReportLab (Python, simple text → PDF)
    │       ├─► WeasyPrint (HTML → PDF, if ReportLab unavailable)
    │       └─► Pandoc (system binary, markdown → PDF, last resort)
    │               → temp.pdf
    │
    ├─ .jpg / .jpeg / .png / .bmp / .tiff / .gif / .webp
    │       │
    │       └─► PIL.Image + ReportLab (image embedded in PDF)
    │               → temp.pdf
    │
    └─ .pdf → passed directly to parser
```

The conversion is transparent — callers always receive a `content_list` regardless of input format.

---

### 5.6 BatchParser (batch_parser.py)

**Class:** `BatchParser`

Dedicated to **parsing-only** batch operations (distinct from `BatchMixin` which does full RAG indexing).

```python
class BatchParser:
    def __init__(
        self,
        parser_type: str = "mineru",
        max_workers: int = 4,
        show_progress: bool = True,
        timeout_per_file: int = 300,    # seconds per file
        skip_installation_check: bool = False,
    ):
```

**`process_batch()` execution model:**

```python
with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
    future_to_file = {
        executor.submit(self.process_single_file, fp, output_dir, parse_method): fp
        for fp in supported_files
    }
    for future in as_completed(future_to_file, timeout=self.timeout_per_file):
        success, file_path, error_msg = future.result()
```

**`BatchProcessingResult` data class:**

```python
@dataclass
class BatchProcessingResult:
    successful_files: list[str]
    failed_files: list[str]
    total_files: int
    processing_time: float          # Wall-clock seconds
    errors: dict[str, str]          # file_path → error_message
    output_dir: str
    dry_run: bool
    
    @property
    def success_rate(self) -> float: ...
    def summary(self) -> str: ...
```

**CLI usage:**
```bash
python -m raganything.batch_parser \
    ./docs/ ./reports/ \
    --output ./parsed_output \
    --parser mineru \
    --method auto \
    --workers 8 \
    --timeout 600 \
    --dry-run
```

---

## 6. Multimodal Processors (modalprocessors.py)

### 6.1 ContextConfig & ContextExtractor

`ContextConfig` governs how surrounding context is extracted for each modal element:

```python
@dataclass
class ContextConfig:
    context_window: int = 1               # ±N pages/chunks around current element
    context_mode: str = "page"            # "page" | "chunk"
    max_context_tokens: int = 2000        # Hard cap on extracted context length
    include_headers: bool = True          # Prepend markdown "#" to heading texts
    include_captions: bool = True         # Include image/table captions as context
    filter_content_types: list = ["text"] # Only pull "text" items (not other modals)
```

`ContextExtractor` is a universal extractor supporting multiple content source formats:

```python
class ContextExtractor:
    def extract_context(
        self,
        content_source: Any,            # list | dict | str
        current_item_info: dict,        # {"page_idx": N, "index": N, "type": "..."}
        content_format: str = "auto",  # "minerU" | "text_chunks" | "text" | "auto"
    ) -> str:
```

**Format dispatch logic:**
1. `content_format == "minerU"` AND `list` → `_extract_from_content_list()`
2. `content_format == "text_chunks"` AND `list` → `_extract_from_text_chunks()`
3. `content_format == "text"` AND `str` → `_extract_from_text_source()`
4. Auto-detect: `list` → content_list path; `dict` → dict source; `str` → text source

**Page-mode context extraction:**
```python
start_page = max(0, current_page - window_size)
end_page   = current_page + window_size + 1

for item in content_list:
    if start_page <= item["page_idx"] < end_page:
        if item["type"] in config.filter_content_types:
            text = _extract_text_from_item(item)
            if item["page_idx"] != current_page:
                text = f"[Page {item_page}] {text}"  # Cross-page markers
            context_texts.append(text)
```

**Token truncation:**
- If tokenizer available: `tokenizer.encode()` → truncate to `max_context_tokens` → `tokenizer.decode()`
- Truncation tries to snap to the last `.` or `\n` within the final 20% of the text
- Fallback (no tokenizer): character-based truncation with same boundary logic

---

### 6.2 BaseModalProcessor

The abstract base for all modal processors. Shares state directly with LightRAG:

```python
class BaseModalProcessor:
    def __init__(self, lightrag: LightRAG, modal_caption_func, context_extractor):
        # Direct references to LightRAG storage backends
        self.text_chunks_db          = lightrag.text_chunks
        self.chunks_vdb              = lightrag.chunks_vdb
        self.entities_vdb            = lightrag.entities_vdb
        self.relationships_vdb       = lightrag.relationships_vdb
        self.knowledge_graph_inst    = lightrag.chunk_entity_relation_graph
        
        # LightRAG model references
        self.embedding_func          = lightrag.embedding_func
        self.llm_model_func          = lightrag.llm_model_func
        self.global_config           = asdict(lightrag)
        self.hashing_kv              = lightrag.llm_response_cache
        self.tokenizer               = lightrag.tokenizer
        
        # Context extraction
        self.context_extractor       = context_extractor or ContextExtractor(tokenizer=self.tokenizer)
        self.content_source          = None    # Set by _init_modal_processors()
        self.content_format          = "auto"
```

**Core internal method — `_create_entity_and_chunk()`:**

```python
async def _create_entity_and_chunk(
    self,
    modal_chunk: str,           # Formatted text description of the modal element
    entity_info: dict,          # {entity_name, entity_type, summary}
    file_path: str,
    batch_mode: bool = False,   # True: skip merge_nodes_and_edges until stage 2
    doc_id: str = None,
    chunk_order_index: int = 0,
):
    # 1. Compute chunk ID
    chunk_id = compute_mdhash_id(modal_chunk, prefix="chunk-")
    tokens   = len(self.tokenizer.encode(modal_chunk))
    
    # 2. Insert into text_chunks KV store
    await self.text_chunks_db.upsert({
        chunk_id: {
            "tokens": tokens,
            "content": modal_chunk,
            "chunk_order_index": chunk_order_index,
            "full_doc_id": doc_id or chunk_id,
            "file_path": file_path,
        }
    })
    
    # 3. Insert into chunks vector DB (for semantic retrieval)
    await self.chunks_vdb.upsert({chunk_id: {...}})
    
    # 4. Create entity node in knowledge graph
    await self.knowledge_graph_inst.upsert_node(entity_info["entity_name"], {
        "entity_id": entity_info["entity_name"],
        "entity_type": entity_info["entity_type"],
        "description": entity_info["summary"],
        "source_id": chunk_id,
        "file_path": file_path,
        "created_at": int(time.time()),
    })
    
    # 5. Insert entity into entity vector DB
    await self.entities_vdb.upsert({
        compute_mdhash_id(entity_name, prefix="ent-"): {
            "entity_name": ...,
            "content": f"{entity_name}\n{summary}",
            ...
        }
    })
    
    # 6. Extract sub-entities within the modal chunk text
    chunk_results = await extract_entities(chunks, global_config, ...)
    
    # 7. For every sub-entity found, add "belongs_to" edge to the modal entity
    for entity_name in maybe_nodes.keys():
        if entity_name != modal_entity_name:
            await self.knowledge_graph_inst.upsert_edge(
                entity_name, modal_entity_name,
                {"description": f"{entity_name} belongs to {modal_entity_name}",
                 "keywords": "belongs_to,part_of,contained_in",
                 "weight": 10.0, ...}
            )
            await self.relationships_vdb.upsert({relation_id: {...}})
    
    # 8. If not batch mode: merge immediately
    if not batch_mode:
        await merge_nodes_and_edges(chunk_results, ...)
        await self.lightrag._insert_done()
```

---

### 6.3 ImageModalProcessor

**Specialisation:** Handles MinerU's image content items.

**Input format:**
```python
{
    "type": "image",
    "img_path": "/abs/path/to/image_001.png",
    "image_caption": ["Figure 1. System architecture"],
    "image_footnote": ["Source: author's analysis"],
    "page_idx": 2
}
```

**Processing pipeline:**

```
1. JSON parse modal_content (or wrap string as {"description": ...})
2. Extract img_path, captions, footnotes
3. Extract page context via ContextExtractor
4. Build vision_prompt or vision_prompt_with_context:
   - Requests JSON response with "detailed_description" + "entity_info"
5. _encode_image_to_base64(img_path) → base64 string
6. modal_caption_func(
       vision_prompt,
       image_data=image_base64,
       system_prompt=PROMPTS["IMAGE_ANALYSIS_SYSTEM"]
   )
7. _parse_response(response):
   - _robust_json_parse() (4-strategy fallback)
   - Extract detailed_description + entity_info
   - Append "(image)" to entity_name if not pre-supplied
8. Build modal_chunk using PROMPTS["image_chunk"] template
9. _create_entity_and_chunk()
```

---

### 6.4 TableModalProcessor

**Input format:**
```python
{
    "type": "table",
    "img_path": "/abs/path/to/table_001.png",  # Table as image (optional)
    "table_caption": ["Table 2. Benchmark results"],
    "table_body": "<html><table>...</table></html>",  # or Markdown
    "table_footnote": ["* p < 0.05"],
    "page_idx": 4
}
```

**Processing:** Similar to image, but uses `table_prompt` / `table_prompt_with_context`. No base64 encoding — the LLM reads `table_body` as text.

---

### 6.5 EquationModalProcessor

**Input format:**
```python
{
    "type": "equation",
    "text": r"E = mc^2",
    "text_format": "latex",      # "latex" | "mathml"
    "page_idx": 6
}
```

**Processing:** Uses `equation_prompt` which instructs the LLM to explain variables, application domain, mathematical significance, and related concepts. JSON response parsed the same way.

---

### 6.6 GenericModalProcessor

Fallback for any `type` not matching `"image"`, `"table"`, or `"equation"`. Uses `generic_prompt` with `{content_type}` template substitution.

**`get_processor_for_type()` dispatch (utils.py):**

```python
def get_processor_for_type(modal_processors, content_type):
    if   content_type == "image":    return modal_processors.get("image")
    elif content_type == "table":    return modal_processors.get("table")
    elif content_type == "equation": return modal_processors.get("equation")
    else:                            return modal_processors.get("generic")
```

---

### 6.7 JSON Parsing & Robustness Strategies

All processors use `BaseModalProcessor._robust_json_parse()` with a **4-level fallback chain**:

```
Strategy 1: Direct JSON parse
──────────────────────────────
  json.loads(candidate) for each candidate extracted

Strategy 2: Basic cleanup then parse
──────────────────────────────────────
  - Replace smart quotes ("" → "", '' → '')
  - Remove trailing commas before ] or }
  - re-attempt json.loads()

Strategy 3: Progressive quote fix
───────────────────────────────────
  - Strip <think>...</think> / <thinking>...</thinking> tags
    (for reasoning models like DeepSeek-R1, Qwen2.5-Think)
  - Fix unescaped backslashes before quotes
  - Fix \alpha → \\alpha type escaping
  - re-attempt json.loads()

Strategy 4: Regex field extraction (last resort)
──────────────────────────────────────────────────
  Extract "detailed_description", "entity_name", "entity_type", "summary"
  fields using targeted regex patterns.
  Logs a warning and returns a constructed dict.
```

**JSON candidate extraction** (`_extract_all_json_candidates()`):
1. JSON code blocks: ````json {...}` `` ` ``
2. Balanced brace matching (handles nested JSON)
3. Simple `{.*}` regex fallback

---

## 7. Prompt Engineering Layer (prompt.py)

All prompts are stored in the `PROMPTS` dict. This centralises every LLM/VLM instruction and allows easy customisation without touching processor code.

### System Prompts

| Key | Value |
|---|---|
| `IMAGE_ANALYSIS_SYSTEM` | "You are an expert image analyst. Provide detailed, accurate descriptions." |
| `TABLE_ANALYSIS_SYSTEM` | "You are an expert data analyst. Provide detailed table analysis with specific insights." |
| `EQUATION_ANALYSIS_SYSTEM` | "You are an expert mathematician. Provide detailed mathematical analysis." |
| `GENERIC_ANALYSIS_SYSTEM` | "You are an expert content analyst specializing in {content_type} content." |

### Analysis Prompts (paired: with/without context)

| Key Pair | Purpose |
|---|---|
| `vision_prompt` / `vision_prompt_with_context` | VLM image analysis → JSON with `detailed_description` + `entity_info` |
| `table_prompt` / `table_prompt_with_context` | LLM table analysis → same JSON schema |
| `equation_prompt` / `equation_prompt_with_context` | LLM equation analysis → same JSON schema |
| `generic_prompt` / `generic_prompt_with_context` | LLM generic analysis → same JSON schema |

### Chunk Templates

These are used by `_create_entity_and_chunk()` to produce the stored text chunk:

```python
PROMPTS["image_chunk"] = """
Image Content Analysis:
Image Path: {image_path}
Captions: {captions}
Footnotes: {footnotes}

Visual Analysis: {enhanced_caption}"""

PROMPTS["table_chunk"] = """Table Analysis:
Image Path: {table_img_path}
Caption: {table_caption}
Structure: {table_body}
Footnotes: {table_footnote}

Analysis: {enhanced_caption}"""

PROMPTS["equation_chunk"] = """Mathematical Equation Analysis:
Equation: {equation_text}
Format: {equation_format}

Mathematical Analysis: {enhanced_caption}"""
```

**Important:** The `Image Path:` prefix in `image_chunk` is what the VLM-enhanced query pipeline (`_process_image_paths_for_vlm`) scans for to reinstate real images during retrieval.

### Query Prompts

| Key | Used by |
|---|---|
| `QUERY_IMAGE_DESCRIPTION` | `_describe_image_for_query()` |
| `QUERY_TABLE_ANALYSIS` | `_describe_table_for_query()` |
| `QUERY_EQUATION_ANALYSIS` | `_describe_equation_for_query()` |
| `QUERY_GENERIC_ANALYSIS` | `_describe_generic_for_query()` |
| `QUERY_ENHANCEMENT_SUFFIX` | Appended to all enhanced multimodal query strings |

---

## 8. Utility Layer (utils.py)

| Function | Signature | Notes |
|---|---|---|
| `separate_content` | `(content_list) → (text_str, multimodal_list)` | Splits MinerU content_list; logs modality breakdown |
| `encode_image_to_base64` | `(image_path: str) → str` | Returns empty string on failure |
| `validate_image_file` | `(image_path, max_size_mb=50) → bool` | Checks extension, size, blocks symlinks |
| `insert_text_content` | `async (lightrag, input, ...) → None` | Thin wrapper around `lightrag.ainsert()` |
| `insert_text_content_with_multimodal_content` | `async (lightrag, input, multimodal_content, ...) → None` | Extended insert with `scheme_name` |
| `get_processor_for_type` | `(modal_processors, content_type) → processor` | Dispatch helper |
| `get_processor_supports` | `(proc_type) → list[str]` | Human-readable capability list |

---

## 9. LightRAG Storage Integration

RAG-Anything directly interacts with these LightRAG storage backends (all accessed via `BaseModalProcessor`):

| Storage | `LightRAG` Attribute | Backend Options | Purpose |
|---|---|---|---|
| KV Store (text chunks) | `lightrag.text_chunks` | JsonKVStorage, PGKVStorage, MongoKVStorage, RedisKVStorage | Raw chunk text + metadata |
| KV Store (LLM cache) | `lightrag.llm_response_cache` | Same options | LLM response deduplication |
| KV Store (parse cache) | Namespace `"parse_cache"` in `llm_response_cache` | Same options | Parse result deduplication |
| Vector DB (chunks) | `lightrag.chunks_vdb` | NanoVectorDB, PGVectorStorage, MilvusVectorStorage, QdrantStorage | Chunk semantic search |
| Vector DB (entities) | `lightrag.entities_vdb` | Same options | Entity name semantic search |
| Vector DB (relations) | `lightrag.relationships_vdb` | Same options | Relationship semantic search |
| Graph DB | `lightrag.chunk_entity_relation_graph` | NetworkX, Neo4j, AGE, TigerGraph | Entity-relationship graph |
| Doc Status | `lightrag.doc_status` | Various | Per-document ingestion state |

**Storage backend selection** (via env vars):

```env
LIGHTRAG_KV_STORAGE=PGKVStorage        # or JsonKVStorage (default)
LIGHTRAG_VECTOR_STORAGE=PGVectorStorage # or NanoVectorDB (default)
LIGHTRAG_GRAPH_STORAGE=Neo4JStorage    # or NetworkXStorage (default)
LIGHTRAG_DOC_STATUS_STORAGE=PGDocStatusStorage
```

---

## 10. Data Flow: Document Ingestion (End-to-End)

```
User calls: await rag.aprocess_document_complete("paper.pdf", "./output")
│
├─ 1. _ensure_lightrag_initialized()
│      └─ LightRAG(working_dir, llm_func, embed_func, ...) constructed
│
├─ 2. Parse cache check
│      key = md5("paper.pdf:auto:mineru:minerU")
│      ├─ HIT: load content_list from parse_cache KV store
│      └─ MISS: → Step 3
│
├─ 3. _parse_document("paper.pdf", "./output", "auto")
│      └─ MineruParser.parse_document()
│           ├─ magic-pdf layout analysis
│           └─ returns content_list[{type, page_idx, ...}]
│
├─ 4. Store content_list in parse_cache (keyed by md5 hash)
│
├─ 5. separate_content(content_list)
│      → text_content: "Introduction\n\nThis paper presents..."
│      → multimodal_items: [{type:image, img_path:...}, {type:table,...}, ...]
│
├─ 6. _init_modal_processors(content_list)
│      For each processor:
│        processor.set_content_source(content_list, "minerU")
│
├─ 7. LightRAG.ainsert(text_content, file_paths="paper.pdf")
│      (standard LightRAG NLP pipeline: chunk → embed → extract entities → build graph)
│
├─ 8. For each item in multimodal_items (index i):
│      item_info = {page_idx: item["page_idx"], index: i, type: item["type"]}
│      processor = get_processor_for_type(modal_processors, item["type"])
│      │
│      ├─ processor._get_context_for_item(item_info)
│      │    └─ ContextExtractor.extract_context(content_list, item_info, "minerU")
│      │         └─ Scan ±1 pages of text items → context string
│      │
│      ├─ VLM/LLM call with prompt + context (+ base64 image if image type)
│      │    └─ Returns JSON: {detailed_description, entity_info}
│      │
│      └─ _create_entity_and_chunk(...)
│           ├─ text_chunks_db.upsert({chunk_id: {content, tokens, ...}})
│           ├─ chunks_vdb.upsert({chunk_id: {content, ...}})
│           ├─ entities_vdb.upsert({ent_id: {entity_name, summary, ...}})
│           ├─ knowledge_graph_inst.upsert_node(entity_name, {...})
│           ├─ extract_entities(chunks)  → NER on description text
│           └─ For each sub-entity: upsert_edge(sub_entity → modal_entity, "belongs_to")
│
└─ 9. LightRAG._insert_done()  → flush all storage backends to disk/DB
```

---

## 11. Data Flow: Query Execution (End-to-End)

### Text Query (standard)

```
await rag.aquery("What is the main contribution?", mode="mix")
│
├─ Detect vlm_enhanced: True (if vision_model_func set)
│
├─ If vlm_enhanced → aquery_vlm_enhanced()
│    ├─ QueryParam(mode="mix", only_need_prompt=True)
│    ├─ LightRAG.aquery() → raw_prompt (retrieval context as text)
│    ├─ Scan raw_prompt for "Image Path: *.jpg" patterns
│    │    For each: validate → base64 encode → replace with [VLM_IMAGE_N]
│    ├─ _build_vlm_messages_with_images() → OpenAI messages list
│    └─ vision_model_func("", messages=messages) → final answer
│
└─ Else → LightRAG.aquery(query, QueryParam(mode="mix"))
```

### Multimodal Query

```
await rag.aquery_with_multimodal(
    "Compare this table with the benchmark in the paper",
    multimodal_content=[{"type":"table", "table_data":"...", "table_caption":"..."}]
)
│
├─ Cache key = md5(json({query, mode, normalized_multimodal}))
├─ Check llm_response_cache → HIT: return cached["return"]
│
├─ _process_multimodal_query_content():
│    For {"type":"table", ...}:
│      _describe_table_for_query(processor, content)
│        → LLM call with QUERY_TABLE_ANALYSIS prompt
│        → Returns table description string
│    enhanced_query = "User query: ...\n\nRelated table content: <description>"
│    enhanced_query += QUERY_ENHANCEMENT_SUFFIX
│
├─ aquery(enhanced_query, mode="mix")
│    → Standard LightRAG text query with the enriched query string
│
├─ Save result to llm_response_cache
└─ Return result
```

---

## 12. VLM-Enhanced Query Pipeline

This is the core innovation for retrieval over multimodal documents. Standard RAG systems retrieve text context including paths like `Image Path: ./output/images/fig1.png`. The VLM-enhanced query **actually reads those images** at query time:

```
Retrieval Context (from LightRAG):
───────────────────────────────────
"...Figure 3 shows the system architecture.
Image Content Analysis:
Image Path: ./output/paper/images/img_002.png
Captions: Figure 3. System overview diagram
Visual Analysis: A detailed architectural diagram showing..."

After _process_image_paths_for_vlm():
──────────────────────────────────────
"...Figure 3 shows the system architecture.
Image Content Analysis:
Image Path: ./output/paper/images/img_002.png
[VLM_IMAGE_1]
Captions: Figure 3. System overview diagram
Visual Analysis: A detailed architectural diagram showing..."

self._current_images_base64 = ["<base64 of img_002.png>"]

VLM Messages:
─────────────
[
  {"role": "system", "content": "You are a helpful assistant that can analyze both text and image content..."},
  {"role": "user",   "content": [
      {"type": "text",      "text": "...Figure 3 shows the system architecture.\nImage Content Analysis:\nImage Path: ..."},
      {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,<base64>"}},
      {"type": "text",      "text": "Captions: Figure 3...\n\nUser Question: What does the architecture show?"}
  ]}
]
```

**Security model:** Images are only served if they pass:
1. Extension whitelist (jpg, jpeg, png, gif, bmp, webp, tiff, tif)
2. Size check (≤ 50 MB)
3. No symlinks
4. Path must be under CWD, `config.working_dir`, `config.parser_output_dir`, or `extra_safe_dirs`

---

## 13. Batch Processing Architecture

```
await rag.aprocess_documents_batch(
    input_path="./research_papers/",
    output_dir="./output",
    batch_size=4,
)
│
├─ Discover files: filter by supported extensions, recursive scan
│
├─ For each batch of `batch_size` files (asyncio.gather):
│    For each file in batch:
│      ├─ Check doc_status → skip PROCESSED files
│      ├─ Set status → PROCESSING
│      ├─ Parse document (same pipeline as §10 steps 2-5)
│      │
│      ├─ STAGE 1: Parallel description generation
│      │    asyncio.gather(
│      │      processor.generate_description_only(item) for item in multimodal_items
│      │    )
│      │    → (description, entity_info) per item, no graph writes
│      │
│      ├─ STAGE 2: Sequential entity extraction + graph merge
│      │    for (description, entity_info) in stage1_results:
│      │      _create_entity_and_chunk(..., batch_mode=True)
│      │    merge_nodes_and_edges(all_chunk_results)
│      │
│      └─ Set status → PROCESSED (or FAILED on exception)
│
└─ _insert_done() after all batches
```

**`generate_description_only()` return type:**

All four processor classes implement this abstract method returning:
```python
Tuple[str, Dict[str, Any]]
# (enhanced_caption_text, {entity_name, entity_type, summary})
```

---

## 14. Cache Strategy & Deduplication

RAG-Anything operates two independent cache layers:

### Layer 1: Parse Cache

- **Store:** LightRAG's `llm_response_cache` KV store, namespace `"parse_cache"`.
- **Key:** MD5 of `file_path + ":" + parse_method + ":" + parser + ":" + content_format`
- **Value:** Serialized `content_list` (full MinerU output)
- **Purpose:** Prevent re-parsing the same document with the same settings.
- **Invalidation:** Currently no TTL; changing parser, parse_method, or content_format produces a different key automatically.

### Layer 2: Multimodal Query Cache

- **Store:** Same `llm_response_cache` KV store, different key prefix.
- **Key:** `"multimodal_query:" + MD5(json({query, mode, normalized_content, relevant_kwargs}))`
- **Value:** `{return: result_string, cache_type: "multimodal_query", ...}`
- **Purpose:** Avoid repeating expensive VLM+LLM calls for identical query+content combinations.
- **Normalisation:** File paths reduced to basenames; large text fields hashed.

### Layer 3: LightRAG's Native LLM Cache

LightRAG has its own prompt-level caching for entity extraction LLM calls. This is controlled by:
```env
ENABLE_LLM_CACHE=true
ENABLE_LLM_CACHE_FOR_EXTRACT=true
```

---

## 15. Knowledge Graph Integration

Every multimodal element becomes a **graph entity** with edges back to entities extracted from its description:

```
Knowledge Graph Structure (per modal element):
──────────────────────────────────────────────

[IMAGE ENTITY]
  entity_name: "Figure 3 System Architecture Diagram (image)"
  entity_type: "image"
  description: "A detailed architectural diagram showing three layers..."
  source_id: "chunk-abc123"
  file_path: "paper.pdf"

[SUB-ENTITIES extracted from description]
  "Three-layer Architecture"     (extracted by LightRAG NER)
  "Input Processing Module"      (extracted)
  "Knowledge Graph Store"        (extracted)

[EDGES]
  "Three-layer Architecture" ──[belongs_to, weight=10.0]──► "Figure 3 System Architecture Diagram (image)"
  "Input Processing Module"  ──[belongs_to, weight=10.0]──► "Figure 3 System Architecture Diagram (image)"
  "Knowledge Graph Store"    ──[belongs_to, weight=10.0]──► "Figure 3 System Architecture Diagram (image)"
```

**`belongs_to` edge fields:**
```python
{
    "description": f"Entity {sub_entity} belongs to {modal_entity}",
    "keywords": "belongs_to,part_of,contained_in",
    "weight": 10.0,              # High weight → prioritised in graph traversal
    "source_id": chunk_id,
    "file_path": file_path,
}
```

The `weight=10.0` ensures modal containment edges are strongly prioritised over weaker co-occurrence edges during LightRAG's graph-based retrieval.

---

## 16. DocStatus State Machine

```
           ┌──────────┐
           │  READY   │  Initial state (document discovered but not started)
           └────┬─────┘
                │ aprocess_document_complete() called
                ▼
           ┌──────────┐
           │ HANDLING │  Parse cache check in progress
           └────┬─────┘
                │
                ▼
           ┌──────────┐
           │ PENDING  │  Queued for processing (batch mode)
           └────┬─────┘
                │
                ▼
           ┌────────────┐
           │ PROCESSING │  Active: parsing + embedding + graph writes
           └──────┬─────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
    ┌──────────┐    ┌─────────┐
    │PROCESSED │    │ FAILED  │
    └──────────┘    └─────────┘
```

These states are stored in `lightrag.doc_status` and allow the batch processor to:
- Skip already-processed documents on restart
- Track which documents failed and why
- Resume interrupted batch operations

---

## 17. Environment Variables — Complete Reference

### LLM Configuration

| Variable | Default | Description |
|---|---|---|
| `LLM_BINDING` | `openai` | `openai` \| `ollama` \| `lollms` \| `azure_openai` \| `lmstudio` \| `vllm` |
| `LLM_MODEL` | `gpt-4o` | Model identifier |
| `LLM_BINDING_HOST` | `https://api.openai.com/v1` | API base URL |
| `LLM_BINDING_API_KEY` | — | API authentication key |
| `MAX_ASYNC` | `4` | Max concurrent LLM requests |
| `MAX_TOKENS` | `32768` | Max tokens per LLM call |
| `TIMEOUT` | `240` | LLM request timeout (seconds) |
| `TEMPERATURE` | `0` | Sampling temperature |
| `ENABLE_LLM_CACHE` | `true` | Enable prompt-level LLM response caching |
| `ENABLE_LLM_CACHE_FOR_EXTRACT` | `true` | Cache entity extraction LLM calls |

### Embedding Configuration

| Variable | Default | Description |
|---|---|---|
| `EMBEDDING_BINDING` | `ollama` | `openai` \| `ollama` \| `lollms` \| `azure_openai` \| `lmstudio` \| `vllm` |
| `EMBEDDING_MODEL` | `bge-m3:latest` | Embedding model |
| `EMBEDDING_DIM` | `1024` | Embedding vector dimensions |
| `EMBEDDING_BINDING_HOST` | `http://localhost:11434` | Embedding API host |
| `EMBEDDING_BINDING_API_KEY` | — | Embedding API key |
| `EMBEDDING_BATCH_NUM` | `32` | Chunks per embedding batch |
| `EMBEDDING_FUNC_MAX_ASYNC` | `16` | Max concurrent embedding requests |

### RAGAnything Configuration

| Variable | Default | Description |
|---|---|---|
| `PARSER` | `mineru` | Parser: `mineru` \| `docling` \| `paddleocr` |
| `PARSE_METHOD` | `auto` | Parse method: `auto` \| `txt` \| `ocr` |
| `OUTPUT_DIR` | `./output` | Parser output directory |
| `ENABLE_IMAGE_PROCESSING` | `true` | Process image elements |
| `ENABLE_TABLE_PROCESSING` | `true` | Process table elements |
| `ENABLE_EQUATION_PROCESSING` | `true` | Process equation elements |
| `MAX_CONCURRENT_FILES` | `1` | Parallel RAG insertions |
| `CONTEXT_WINDOW` | `1` | Pages/chunks of surrounding context |
| `CONTEXT_MODE` | `page` | `page` \| `chunk` |
| `MAX_CONTEXT_TOKENS` | `2000` | Max tokens in context window |
| `INCLUDE_HEADERS` | `true` | Include heading text in context |
| `INCLUDE_CAPTIONS` | `true` | Include figure/table captions in context |
| `CONTEXT_FILTER_CONTENT_TYPES` | `text` | Comma-separated types to include as context |
| `CONTENT_FORMAT` | `minerU` | Context format hint for ContextExtractor |

### Chunking & Retrieval

| Variable | Default | Description |
|---|---|---|
| `CHUNK_SIZE` | `1200` | Token size for text chunks |
| `CHUNK_OVERLAP_SIZE` | `100` | Overlap between consecutive chunks |
| `TOP_K` | `60` | Retrieved chunks per query |
| `COSINE_THRESHOLD` | `0.2` | Minimum similarity score |
| `MAX_TOKEN_TEXT_CHUNK` | `4000` | Max tokens per text chunk in prompt |
| `MAX_TOKEN_ENTITY_DESC` | `4000` | Max tokens for entity descriptions |
| `MAX_TOKEN_RELATION_DESC` | `4000` | Max tokens for relation descriptions |
| `HISTORY_TURNS` | `3` | Conversation history turns |

### Storage Backends

| Variable | Options | Description |
|---|---|---|
| `LIGHTRAG_KV_STORAGE` | `JsonKVStorage`, `PGKVStorage`, `MongoKVStorage`, `RedisKVStorage` | KV store backend |
| `LIGHTRAG_VECTOR_STORAGE` | `NanoVectorDB`, `PGVectorStorage`, `MilvusVectorStorage`, `QdrantStorage` | Vector DB backend |
| `LIGHTRAG_GRAPH_STORAGE` | `NetworkXStorage`, `Neo4JStorage`, `AGEStorage` | Graph DB backend |
| `LIGHTRAG_DOC_STATUS_STORAGE` | `JsonDocStatusStorage`, `PGDocStatusStorage` | Document status storage |

### Offline / Air-Gapped

| Variable | Description |
|---|---|
| `TIKTOKEN_CACHE_DIR` | Path to local tiktoken model cache (prevents internet download) |

---

## 18. Installation Guide

### Prerequisites

- Python ≥ 3.10
- CUDA-capable GPU (recommended for MinerU and PaddleOCR)
- LibreOffice (for Office document conversion)

### Step 1: Create Environment

```bash
conda create -n raganything python=3.10
conda activate raganything
```

### Step 2: Install Core

```bash
pip install raganything
```

### Step 3: Install Parser

**MinerU (recommended):**
```bash
pip install "magic-pdf[full]" --extra-index-url https://wheels.myhloli.com
# Download model weights
python -c "from huggingface_hub import snapshot_download; snapshot_download('opendatalab/MinerU-PDF')"
```

**Docling:**
```bash
pip install docling
```

**PaddleOCR:**
```bash
pip install paddlepaddle-gpu  # or paddlepaddle (CPU)
pip install "raganything[paddleocr]"
```

### Step 4: Configure Environment

```bash
cp env.example .env
# Edit .env with your API keys, model names, etc.
```

### Step 5: (Optional) Tiktoken Offline Cache

For air-gapped deployment, pre-cache tiktoken models on a machine with internet access:

```bash
python scripts/create_tiktoken_cache.py --output ./tiktoken_cache
# Transfer tiktoken_cache/ to deployment machine
# Add to .env:
# TIKTOKEN_CACHE_DIR=./tiktoken_cache
```

### Step 6: (Optional) LibreOffice for Office Formats

**Ubuntu/Debian:**
```bash
sudo apt-get install libreoffice
```
**macOS:**
```bash
brew install --cask libreoffice
```
**Windows:** Download from libreoffice.org; ensure `soffice` is on PATH.

---

## 19. Configuration Deep Dive

### Choosing a Parser

| Criterion | MinerU | Docling | PaddleOCR |
|---|---|---|---|
| PDF with text layer | ✅ Best | ✅ Good | ⚠️ Slower |
| Scanned PDFs | ✅ Good (OCR mode) | ✅ | ✅ Best |
| Academic papers | ✅ Best (equation support) | ✅ | ⚠️ Limited |
| Chinese documents | ✅ | ⚠️ | ✅ Best |
| Office files | ✅ (via LibreOffice) | ✅ | ✅ |
| Installation complexity | Medium | Low | Medium |
| Speed | Medium | Fast | Slow (GPU helps) |

### Choosing a Context Mode

| Mode | When to use |
|---|---|
| `page` (default) | Documents with clear page-based structure (PDFs, reports) |
| `chunk` | Plain text inputs without page boundaries |

### Choosing a Query Mode

| Mode | Best for |
|---|---|
| `naive` | Fast, simple vector search; large flat document collections |
| `local` | Fine-grained entity lookups |
| `global` | High-level thematic questions |
| `hybrid` | Balanced precision and recall |
| `mix` (default) | General-purpose; recommended for most use cases |
| `bypass` | When you want to use just the LLM with no retrieval |

---

## 20. Full API Reference

### `RAGAnything.__init__`

```python
RAGAnything(
    config: RAGAnythingConfig = None,
    llm_model_func: Callable = None,    # (prompt, system_prompt, history_messages, **kwargs) -> str
    vision_model_func: Callable = None, # Same signature + image_data / messages kwarg
    embedding_func: EmbeddingFunc = None,
    lightrag: LightRAG = None,          # Pre-initialized instance (optional)
)
```

### `aprocess_document_complete`

```python
async def aprocess_document_complete(
    file_path: str,          # Path to document (any supported format)
    output_dir: str,         # Where parser stores extracted images/assets
    parse_method: str = "auto",  # "auto" | "txt" | "ocr"
    **kwargs                 # Passed to parser.parse_document()
) -> None
```

### `aquery`

```python
async def aquery(
    query: str,
    mode: str = "mix",            # "local"|"global"|"hybrid"|"naive"|"mix"|"bypass"
    system_prompt: str = None,
    vlm_enhanced: bool = None,    # None = auto-detect based on vision_model_func
    **kwargs                      # Passed to QueryParam (top_k, max_tokens, etc.)
) -> str
```

### `aquery_with_multimodal`

```python
async def aquery_with_multimodal(
    query: str,
    multimodal_content: list[dict] = None,
    # dict schema varies by type:
    # Image: {"type": "image", "img_path": str, "image_caption": list, "image_footnote": list}
    # Table: {"type": "table", "table_data": str, "table_caption": str}
    # Equation: {"type": "equation", "latex": str, "equation_caption": str}
    mode: str = "mix",
    **kwargs
) -> str
```

### `aquery_vlm_enhanced`

```python
async def aquery_vlm_enhanced(
    query: str,
    mode: str = "mix",
    system_prompt: str = None,
    extra_safe_dirs: list[str] = None,  # Additional directories to allow images from
    **kwargs
) -> str
```

### Synchronous Wrappers

```python
rag.query(query, mode="mix", **kwargs) -> str
rag.query_with_multimodal(query, multimodal_content, mode="mix", **kwargs) -> str
rag.process_document_complete(file_path, output_dir, parse_method="auto", **kwargs) -> None
```

### `BatchParser` API

```python
from raganything.batch_parser import BatchParser

bp = BatchParser(parser_type="mineru", max_workers=4, timeout_per_file=300)

result = bp.process_batch(
    file_paths=["./docs/", "report.pdf"],
    output_dir="./parsed",
    parse_method="auto",
    recursive=True,
    dry_run=False,
)

print(f"Success rate: {result.success_rate:.1f}%")
print(result.summary())
```

---

## 21. End-to-End Example — Annotated

```python
import asyncio
import os
from raganything import RAGAnything, RAGAnythingConfig
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc

# ── 1. Configuration ──────────────────────────────────────────────────────
config = RAGAnythingConfig(
    working_dir="./rag_storage",    # LightRAG graph + vector stores live here
    parser="mineru",                # MinerU for rich structural analysis
    parse_method="auto",            # Hybrid text/OCR parsing
    enable_image_processing=True,   # Use VLM on images
    enable_table_processing=True,   # Use LLM on tables
    enable_equation_processing=True,# Use LLM on equations
    context_window=1,               # Include ±1 page of surrounding text
    context_mode="page",
    max_context_tokens=2000,
)

# ── 2. LLM function (text + entity extraction) ───────────────────────────
def llm_func(prompt, system_prompt=None, history_messages=[], **kwargs):
    return openai_complete_if_cache(
        "gpt-4o-mini",              # Cheaper model for text + entity extraction
        prompt,
        system_prompt=system_prompt,
        api_key=os.getenv("OPENAI_API_KEY"),
        **kwargs,
    )

# ── 3. Vision model function (images + VLM-enhanced queries) ─────────────
def vision_func(prompt, system_prompt=None, history_messages=[], image_data=None, messages=None, **kwargs):
    if messages:                    # Multimodal message format (VLM-enhanced query)
        return openai_complete_if_cache("gpt-4o", "", messages=messages,
                                        api_key=os.getenv("OPENAI_API_KEY"), **kwargs)
    elif image_data:                # Single image + prompt (indexing)
        return openai_complete_if_cache(
            "gpt-4o", "",
            messages=[
                {"role": "system", "content": system_prompt} if system_prompt else None,
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}},
                ]},
            ],
            api_key=os.getenv("OPENAI_API_KEY"), **kwargs,
        )
    else:                           # Text-only fallback
        return llm_func(prompt, system_prompt, history_messages, **kwargs)

# ── 4. Embedding function ─────────────────────────────────────────────────
embed_func = EmbeddingFunc(
    embedding_dim=3072,
    max_token_size=8192,
    func=lambda texts: openai_embed(
        texts, model="text-embedding-3-large",
        api_key=os.getenv("OPENAI_API_KEY"),
    ),
)

# ── 5. Initialize RAGAnything ─────────────────────────────────────────────
rag = RAGAnything(
    config=config,
    llm_model_func=llm_func,
    vision_model_func=vision_func,
    embedding_func=embed_func,
)

async def main():
    # ── 6. Index a document ───────────────────────────────────────────────
    # Images extracted to ./output/paper_images/
    # Parse cache stored in ./rag_storage/
    await rag.aprocess_document_complete(
        file_path="./research_paper.pdf",
        output_dir="./output",
        parse_method="auto",
    )

    # ── 7. Standard text query (auto VLM-enhanced if images present) ──────
    answer = await rag.aquery(
        "What architecture does the paper propose?",
        mode="mix",           # Uses LightRAG's mix mode (naive + hybrid)
    )
    print(answer)

    # ── 8. Multimodal query with external content ─────────────────────────
    answer = await rag.aquery_with_multimodal(
        "How does this performance table compare to the paper's results?",
        multimodal_content=[{
            "type": "table",
            "table_data": "Method,Accuracy,Latency\nOurs,95.2%,42ms\nBaseline,87.1%,65ms",
            "table_caption": "My experiment results",
        }],
        mode="hybrid",
    )
    print(answer)

    # ── 9. Explicit VLM-enhanced query ───────────────────────────────────
    answer = await rag.aquery_vlm_enhanced(
        "Describe what Figure 3 shows and relate it to the paper's claims.",
        mode="mix",
        extra_safe_dirs=["./output"],  # Allow images from output directory
    )
    print(answer)

asyncio.run(main())
```

---

## 22. Extending RAG-Anything

### Adding a Custom Parser

```python
from raganything.parser import BaseParser, SUPPORTED_PARSERS

class MyCustomParser(BaseParser):
    def check_installation(self) -> bool:
        try:
            import my_custom_lib
            return True
        except ImportError:
            return False

    def parse_document(self, file_path, output_dir, method="auto", **kwargs) -> list[dict]:
        # Must return content_list in MinerU format:
        # [{"type": "text"|"image"|"table"|"equation", "page_idx": int, ...}, ...]
        import my_custom_lib
        result = my_custom_lib.parse(file_path)
        return self._convert_to_content_list(result)

# Register
SUPPORTED_PARSERS["custom"] = MyCustomParser

# Use
config = RAGAnythingConfig(parser="custom")
```

### Adding a Custom Modal Processor

```python
from raganything.modalprocessors import BaseModalProcessor
from raganything.prompt import PROMPTS

class AudioModalProcessor(BaseModalProcessor):
    async def generate_description_only(self, modal_content, content_type, item_info=None, entity_name=None):
        # modal_content: {"type": "audio", "transcript": str, "speaker": str}
        prompt = f"Analyze this audio transcript:\n{modal_content.get('transcript','')}"
        response = await self.modal_caption_func(prompt, system_prompt="You are an audio analyst.")
        entity_info = {
            "entity_name": entity_name or f"audio_segment_{hash(str(modal_content))}",
            "entity_type": "audio",
            "summary": response[:200],
        }
        return response, entity_info

    async def process_multimodal_content(self, modal_content, content_type, file_path, **kwargs):
        desc, entity_info = await self.generate_description_only(modal_content, content_type)
        modal_chunk = f"Audio Analysis:\nTranscript: {modal_content.get('transcript','')}\nAnalysis: {desc}"
        return await self._create_entity_and_chunk(modal_chunk, entity_info, file_path, **kwargs)

# Inject into RAGAnything after initialization
rag.modal_processors["audio"] = AudioModalProcessor(rag.lightrag, rag.vision_model_func)
```

### Customising Prompts

```python
from raganything.prompt import PROMPTS

# Override the vision prompt for domain-specific analysis
PROMPTS["vision_prompt"] = """You are a medical imaging specialist. Analyze this image...
{
    "detailed_description": "...",
    "entity_info": {"entity_name": "{entity_name}", "entity_type": "medical_image", "summary": "..."}
}
..."""
```

---

## 23. Troubleshooting & Known Issues

### MinerU fails with "CUDA out of memory"
```bash
# Force CPU inference
export MINERU_DEVICE=cpu
```

### LibreOffice not found (Office conversion fails)
```
FileNotFoundError: [Errno 2] No such file or directory: 'soffice'
```
→ Install LibreOffice and ensure `soffice` is on PATH. On Windows, add LibreOffice's `program/` directory to PATH.

### `tiktoken` fails in air-gapped environment
```
requests.exceptions.ConnectionError: HTTPSConnectionPool...
```
→ Pre-cache tiktoken models: `python scripts/create_tiktoken_cache.py`
→ Set `TIKTOKEN_CACHE_DIR=./tiktoken_cache` in `.env`

### JSON parse error from LLM response
```
Error parsing image analysis response: Expecting ',' delimiter
```
→ Normal — the 4-strategy robust parser handles this. Only a problem if all 4 strategies fail.
→ Try a better-instruction-following model (GPT-4o vs GPT-4o-mini).
→ Reasoning models (DeepSeek-R1): `<think>...</think>` tags are automatically stripped.

### Parse cache stale after changing parser
→ Delete `./rag_storage/kv_store_llm_response_cache.json` (or the relevant DB table) to force re-parsing.
→ Or change `parse_method` / `parser` to bust the cache automatically.

### VLM-enhanced query returns "No valid images found"
1. Check that image files exist at the paths stored in the vector DB chunks.
2. Ensure the `output_dir` passed to `aprocess_document_complete` matches `config.parser_output_dir` or is included in `extra_safe_dirs`.
3. Verify image file size is under 50 MB.
4. Confirm image file extension is in: jpg, jpeg, png, gif, bmp, webp, tiff, tif.

### Batch processing: "Only 1 file processed at a time"
→ `max_concurrent_files` defaults to 1. Set `MAX_CONCURRENT_FILES=4` in `.env` or pass directly to config.

### Graph storage (Neo4j) connection failure
```
ServiceUnavailable: Unable to connect to database
```
→ Verify `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` in `.env`.
→ Ensure Neo4j 5.x+ is running (older versions not supported).

---

## 24. Project File Reference

```
RAG-Anything-main/
│
├── raganything/                # Main package
│   ├── __init__.py             # Public exports: RAGAnything, RAGAnythingConfig
│   ├── base.py                 # DocStatus enum
│   ├── config.py               # RAGAnythingConfig dataclass
│   ├── raganything.py          # Orchestration class (inherits all mixins)
│   ├── processor.py            # ProcessorMixin (document ingestion)
│   ├── query.py                # QueryMixin (all 3 query surfaces)
│   ├── batch.py                # BatchMixin (batch document processing)
│   ├── parser.py               # BaseParser + 3 parser implementations
│   ├── batch_parser.py         # BatchParser (parallel parsing with ThreadPoolExecutor)
│   ├── modalprocessors.py      # ContextConfig, ContextExtractor, all 4 processors
│   ├── prompt.py               # PROMPTS dict (all LLM/VLM prompts)
│   └── utils.py                # Utility functions
│
├── examples/
│   ├── raganything_example.py  # Full end-to-end example with CLI args
│   └── ...                     # Additional domain-specific examples
│
├── docs/
│   ├── vllm_integration.md     # vLLM setup for high-throughput inference
│   ├── offline_setup.md        # Air-gapped deployment guide
│   └── ...
│
├── scripts/
│   └── create_tiktoken_cache.py  # Pre-cache tiktoken for offline deployment
│
├── env.example                 # Template .env with all variables documented
├── pyproject.toml              # Package metadata + dependencies
└── README.md                   # This file
```

---

*RAG-Anything v1.2.9 — © 2024 Uday Dolas (noisyboy08). MIT License.*
