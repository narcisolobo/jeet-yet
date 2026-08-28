"""Adapter from `ingredient-parser`'s parsed output to the app's
RecipeIngredient shape (see src/lib/firebase/recipe.ts), plus the
confidence-based flagging rule for the "couldn't parse this line" UX
(see docs/flows/create-recipe-from-form.md).

Deliberately decoupled from the `ingredient_parser` package's own classes —
these functions take plain primitives so they're testable without the
library's heavy runtime deps (nltk, pint, the trained model). `main.py` is
the thin glue that extracts these primitives from a real ParsedIngredient.
"""

import re
from fractions import Fraction

DEFAULT_CONFIDENCE_THRESHOLD = 0.7

# Recipe sites commonly style ingredient checklists with a bullet/checkbox
# glyph (via CSS ::before content, not a real <input>) that survives
# copy-paste into a plain textarea as literal Unicode text. Left in place,
# it glues onto the leading digit ("▢3 large carrots") and breaks quantity
# detection — confirmed against real pasted content from two different
# recipe blogs, each using a different glyph (▢ U+25A2, ☐ U+2610).
_BULLET_PREFIX_RE = re.compile(r"^\s*[☐□▢✓✔•◦‣▪▫○●\-\*]\s*")


def strip_bullet_prefix(line: str) -> str:
    """Strip one leading bullet/checkbox glyph (and surrounding whitespace)
    from a pasted ingredient line, if present."""
    return _BULLET_PREFIX_RE.sub("", line, count=1)

# Our own curated, cooking-focused vocabulary — see the comment on
# StandardUnit in src/lib/firebase/recipe.ts for why this isn't matched to
# `pint`'s (the underlying library) open-ended unit registry. Keys are
# pint's canonical unit names (and the informal count words the library
# passes through as plain strings when pint can't parse them), lowercased.
_UNIT_MAP = {
    # mass
    "gram": "gram",
    "kilogram": "kilogram",
    "ounce": "ounce",
    "pound": "pound",
    # volume
    "teaspoon": "teaspoon",
    "tablespoon": "tablespoon",
    "fluid_ounce": "fluid-ounce",
    "cup": "cup",
    "pint": "pint",
    "quart": "quart",
    "gallon": "gallon",
    "milliliter": "milliliter",
    "liter": "liter",
    "pinch": "pinch",
    "dash": "dash",
    # count
    "piece": "piece",
    "clove": "clove",
    "slice": "slice",
    "can": "can",
    "package": "package",
    "bunch": "bunch",
    "head": "head",
    "sprig": "sprig",
    "stalk": "stalk",
    "stick": "stick",
}


def normalize_unit(raw_unit: str | None) -> str | None:
    """Map a raw unit string (a pint canonical name, or an informal count
    word pint couldn't parse) onto our StandardUnit vocabulary. Handles
    case and simple trailing-`s` plurals. Returns None if unmappable."""
    if raw_unit is None:
        return None

    normalized = raw_unit.strip().lower()
    if normalized in _UNIT_MAP:
        return _UNIT_MAP[normalized]

    if normalized.endswith("s") and normalized[:-1] in _UNIT_MAP:
        return _UNIT_MAP[normalized[:-1]]

    return None


def to_amount_quantity(value: Fraction | float | str | None) -> float | None:
    """Coerce `IngredientAmount.quantity` to a float, or None.

    The library's own docstring types this as `Fraction | str` — "a
    Fraction where possible, otherwise a string" — so a plain `float(value)`
    crashes the whole Cloud Function invocation whenever quantity comes
    back as a non-numeric (including empty) string, taking down every
    other line in the same batch with it. Confirmed in production: a real
    ingredient line produced quantity="", raising
    `ValueError: could not convert string to float: ''`.
    """
    if value is None:
        return None
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return float(value)


def build_ingredient_row(
    *,
    name_text: str,
    name_confidence: float,
    amount_quantity: float | None,
    amount_unit: str | None,
    amount_confidence: float | None,
    is_compound: bool,
    preparation_text: str | None,
    preparation_confidence: float | None,
    size_text: str | None,
    comment_text: str | None = None,
    source_text: str,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> dict:
    """Build one wire-format row for the client: `{flagged, ingredient}`.

    `ingredient` matches RecipeIngredient's shape when `flagged` is False;
    when True, it's just `{name, rawOverride}` pointing at the original
    line, so the client can render the flagged state and let the user fix
    or dismiss it (see create-recipe-from-form.md).

    `is_compound` marks a compound amount (e.g. "1 lb 2 oz") — out of scope
    per docs/specs/recipe.md's Open Questions, so it's always flagged
    regardless of amount_quantity/amount_unit (which the caller should leave
    None for a compound amount, since there's no single quantity/unit to
    report).
    """
    unit = normalize_unit(amount_unit)

    flagged = (
        is_compound
        or (amount_unit is not None and unit is None)
        or name_confidence < confidence_threshold
        or (amount_confidence is not None and amount_confidence < confidence_threshold)
        or (
            preparation_confidence is not None
            and preparation_confidence < confidence_threshold
        )
    )

    if flagged:
        return {
            "flagged": True,
            "ingredient": {
                "name": source_text,
                "rawOverride": source_text,
            },
        }

    ingredient: dict = {"name": name_text}
    if amount_quantity is not None:
        ingredient["amount"] = amount_quantity
    if unit is not None:
        ingredient["unit"] = unit
    if preparation_text:
        ingredient["preparation"] = preparation_text

    notes = ", ".join(part for part in (size_text, comment_text) if part)
    if notes:
        ingredient["notes"] = notes

    return {"flagged": False, "ingredient": ingredient}
