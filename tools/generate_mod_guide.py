#!/usr/bin/env python3
"""Generate the shared Mod guide content from a YAML document."""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:  # pragma: no cover - dependency message
    raise SystemExit(
        "PyYAML is required. Install it with: python -m pip install pyyaml"
    ) from exc


START_MARKER = "<!-- MOD_GUIDE_GENERATED_START -->"
END_MARKER = "<!-- MOD_GUIDE_GENERATED_END -->"
ID_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_-]*$")


def fail(message: str) -> None:
    raise ValueError(message)


def text_value(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{field} must be a non-empty string")
    return value


def safe_id(value: Any, field: str) -> str:
    result = text_value(value, field)
    if not ID_PATTERN.fullmatch(result):
        fail(f"{field} must contain only letters, numbers, '_' or '-': {result}")
    return result


def normalize_asset_path(value: Any, field: str) -> str:
    raw = text_value(value, field).replace("\\", "/")
    path = Path(raw)
    if path.is_absolute() or raw.startswith("/") or ".." in path.parts:
        fail(f"{field} must be a relative path inside the asset directory: {raw}")
    return "/".join(path.parts)


def validate_document(document: Any, assets_root: Path | None) -> list[dict[str, Any]]:
    if not isinstance(document, dict):
        fail("The YAML root must be a mapping")
    sections = document.get("sections")
    if not isinstance(sections, list) or not sections:
        fail("sections must be a non-empty list")

    assets_root_abs = assets_root.resolve() if assets_root is not None else None
    if assets_root_abs is not None and not assets_root_abs.is_dir():
        fail(f"Assets root does not exist or is not a directory: {assets_root_abs}")

    seen_ids: set[str] = set()
    for section_index, section in enumerate(sections):
        if not isinstance(section, dict):
            fail(f"sections[{section_index}] must be a mapping")
        section_id = safe_id(section.get("id"), f"sections[{section_index}].id")
        if section_id in seen_ids:
            fail(f"Duplicate section id: {section_id}")
        seen_ids.add(section_id)
        cards = section.get("cards", [])
        if not isinstance(cards, list):
            fail(f"sections[{section_index}].cards must be a list")
        for card_index, card in enumerate(cards):
            if not isinstance(card, dict):
                fail(f"sections[{section_index}].cards[{card_index}] must be a mapping")
            text_value(card.get("title"), f"sections[{section_index}].cards[{card_index}].title")
            blocks = card.get("blocks", [])
            if not isinstance(blocks, list):
                fail(f"sections[{section_index}].cards[{card_index}].blocks must be a list")
            for block_index, block in enumerate(blocks):
                if isinstance(block, str):
                    continue
                if not isinstance(block, dict):
                    fail(f"Invalid block at sections[{section_index}].cards[{card_index}].blocks[{block_index}]")
                if "text" in block:
                    text_value(block["text"], "text block")
                elif "image" in block:
                    image_path = normalize_asset_path(block["image"], "image block")
                    if assets_root_abs is not None:
                        candidate = (assets_root_abs / image_path).resolve()
                        root = assets_root_abs
                        if root not in candidate.parents:
                            fail(
                                "Image path escapes assets root:\n"
                                f"  YAML image path: {image_path}\n"
                                f"  Assets root (absolute): {root}\n"
                                f"  Resolved path (absolute): {candidate}"
                            )
                        if not candidate.is_file():
                            fail(
                                "Missing image:\n"
                                f"  YAML image path: {image_path}\n"
                                f"  Assets root (absolute): {root}\n"
                                f"  Checked path (absolute): {candidate}"
                            )
                else:
                    fail(f"Block must contain either 'text' or 'image': {block}")
    return sections


def render_text(value: str) -> str:
    escaped = html.escape(value, quote=False)
    return f"<p>{escaped.replace(chr(10), '<br>')}</p>"


def render_image(path: str, block: dict[str, Any]) -> str:
    alt = html.escape(str(block.get("alt") or Path(path).stem), quote=True)
    caption = html.escape(str(block.get("caption") or Path(path).stem), quote=False)
    source = html.escape(path, quote=True)
    return (
        f'<figure><img src="{source}" alt="{alt}" loading="lazy">'
        f"<figcaption>{caption}</figcaption></figure>"
    )


def render_card(card: dict[str, Any], card_index: int, kind: str) -> str:
    title = html.escape(text_value(card["title"], "card.title"), quote=False)
    card_class = "step-card" if kind == "steps" else "feature-card"
    parts = [f'<article class="{card_class}">']
    if kind == "steps":
        number = str(card.get("number") or card_index + 1).zfill(2)
        parts.append(f'<span class="step-number">{html.escape(number)}</span>')
    parts.append(f"<h3>{title}</h3>")

    gallery: list[str] = []

    def flush_gallery() -> None:
        if gallery:
            parts.append(f'<div class="gallery">{"".join(gallery)}</div>')
            gallery.clear()

    for block in card.get("blocks", []):
        if isinstance(block, str):
            flush_gallery()
            parts.append(render_text(block))
        elif "text" in block:
            flush_gallery()
            parts.append(render_text(text_value(block["text"], "text block")))
        else:
            path = normalize_asset_path(block["image"], "image block")
            gallery.append(render_image(path, block))
    flush_gallery()
    parts.append("</article>")
    return "".join(parts)


def render_section(section: dict[str, Any]) -> str:
    section_id = safe_id(section["id"], "section.id")
    eyebrow = html.escape(str(section.get("eyebrow") or ""), quote=False)
    title = html.escape(text_value(section["title"], "section.title"), quote=False)
    kind = str(section.get("kind") or "features")
    grid_class = str(section.get("grid_class") or ("steps-grid" if kind == "steps" else "feature-grid compact-grid"))
    parts = [f'<section class="guide-section" id="{section_id}">']
    parts.append(f'<div class="section-heading"><p class="eyebrow">{eyebrow}</p><h2>{title}</h2>')
    if section.get("intro"):
        parts.append(render_text(text_value(section["intro"], "section.intro")))
    parts.append("</div>")
    parts.append(f'<div class="{html.escape(grid_class, quote=True)}">')
    for index, card in enumerate(section.get("cards", [])):
        parts.append(render_card(card, index, kind))
    parts.append("</div></section>")
    return "".join(parts)


def render_document(sections: list[dict[str, Any]]) -> str:
    return "\n\n      ".join(render_section(section) for section in sections)


def replace_marked_file(path: Path, fragment: str) -> None:
    content = path.read_text(encoding="utf-8")
    start = content.find(START_MARKER)
    end = content.find(END_MARKER)
    if start < 0 or end < 0 or end < start:
        fail(f"Markers not found or out of order in: {path}")
    end += len(END_MARKER)
    replacement = f"{START_MARKER}\n      {fragment}\n      {END_MARKER}"
    path.write_text(content[:start] + replacement + content[end:], encoding="utf-8", newline="")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("yaml_file", type=Path, help="YAML content source")
    parser.add_argument("--assets-root", type=Path, help="Root used to validate image files")
    parser.add_argument("--output-fragment", type=Path, help="Write the generated middle HTML fragment")
    parser.add_argument("--replace", dest="targets", action="append", type=Path, help="Replace marked content in an HTML file; repeat for online and offline pages")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.output_fragment and not args.targets:
        raise SystemExit("Specify --output-fragment and/or at least one --replace target")
    try:
        document = yaml.safe_load(args.yaml_file.read_text(encoding="utf-8"))
        sections = validate_document(document, args.assets_root)
        fragment = render_document(sections)
        if args.output_fragment:
            args.output_fragment.parent.mkdir(parents=True, exist_ok=True)
            args.output_fragment.write_text(fragment + "\n", encoding="utf-8", newline="")
        for target in args.targets or []:
            replace_marked_file(target, fragment)
    except (OSError, UnicodeError, ValueError, yaml.YAMLError) as exc:
        print(f"Generation failed: {exc}", file=sys.stderr)
        print(f"YAML file (absolute): {args.yaml_file.resolve()}", file=sys.stderr)
        if args.assets_root is not None:
            print(f"Assets root (absolute): {args.assets_root.resolve()}", file=sys.stderr)
        return 1
    print(f"Generated {len(sections)} sections")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
