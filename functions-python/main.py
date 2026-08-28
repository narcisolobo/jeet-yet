"""Callable Cloud Function that parses pasted ingredient lines into
structured rows for the create-recipe-from-form flow (see
docs/flows/create-recipe-from-form.md). Thin glue over `ingredient_parser`
(the ML-based parser — see docs/specs/recipe.md's Open Questions for why
this runs server-side in Python rather than a JS regex parser) and the
`ingredients` module's pure adapter/flagging logic.
"""

from fractions import Fraction

from firebase_functions import https_fn
from ingredient_parser import parse_multiple_ingredients
from ingredient_parser.dataclasses import CompositeIngredientAmount, ParsedIngredient

from ingredients import build_ingredient_row


def _as_float(value: Fraction | float | None) -> float | None:
    return float(value) if value is not None else None


def _to_row(parsed: ParsedIngredient) -> dict:
    name_text = " ".join(segment.text for segment in parsed.name)
    name_confidence = min(
        (segment.confidence for segment in parsed.name), default=0.0
    )

    amount_quantity = None
    amount_unit = None
    amount_confidence = None
    # A CompositeIngredientAmount (e.g. "1 lb 2 oz") has no single
    # quantity/unit of its own — its parts live in a nested .amounts list.
    # Compound units are out of scope (see docs/specs/recipe.md's Open
    # Questions), so is_compound below always flags these rather than
    # reading anything off the composite wrapper.
    is_compound = bool(parsed.amount) and isinstance(
        parsed.amount[0], CompositeIngredientAmount
    )
    if parsed.amount and not is_compound:
        first = parsed.amount[0]
        amount_quantity = _as_float(first.quantity)
        # `first.unit` is a pint.Unit (str()'s to its canonical long name,
        # e.g. "gram") for recognized units, a plain str (e.g. "clove") for
        # informal count units pint doesn't know, or "" for a bare quantity
        # with no unit at all (e.g. "2 eggs") — falsy, so `or None` below
        # normalizes that case to None rather than an empty string.
        amount_unit = str(first.unit) or None
        amount_confidence = first.confidence

    return build_ingredient_row(
        name_text=name_text,
        name_confidence=name_confidence,
        amount_quantity=amount_quantity,
        amount_unit=amount_unit,
        amount_confidence=amount_confidence,
        is_compound=is_compound,
        preparation_text=parsed.preparation.text if parsed.preparation else None,
        preparation_confidence=(
            parsed.preparation.confidence if parsed.preparation else None
        ),
        size_text=parsed.size.text if parsed.size else None,
        comment_text=parsed.comment.text if parsed.comment else None,
        source_text=parsed.sentence,
    )


def _parse_lines(lines: list[str]) -> list[dict]:
    clean_lines = [line for line in lines if isinstance(line, str) and line.strip()]
    # volumetric_units_system must be passed explicitly: the library's own
    # default value ("us") isn't one of the values its validation accepts
    # ("us_customary" et al) and raises ValueError otherwise — confirmed
    # against ingredient-parser-nlp 2.7.0.
    parsed_lines = parse_multiple_ingredients(
        clean_lines, volumetric_units_system="us_customary"
    )

    return [_to_row(parsed) for parsed in parsed_lines]


@https_fn.on_call()
def parse_ingredients(req: https_fn.CallableRequest) -> list[dict]:
    lines = req.data.get("lines") if isinstance(req.data, dict) else None
    if not isinstance(lines, list):
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            "Expected { lines: string[] }.",
        )

    return _parse_lines(lines)
