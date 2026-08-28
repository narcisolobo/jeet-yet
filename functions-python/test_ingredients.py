from fractions import Fraction

from ingredients import (
    build_ingredient_row,
    normalize_unit,
    strip_bullet_prefix,
    to_amount_quantity,
)


class TestStripBulletPrefix:
    def test_strips_rounded_square_checkbox(self):
        # The exact glyph (U+25A2) a real recipe blog's pasted checklist
        # produced — glued directly onto the leading digit with no space,
        # which broke quantity detection ("▢3 large carrots").
        assert strip_bullet_prefix("▢3 large carrots") == "3 large carrots"

    def test_strips_ballot_box_checkbox(self):
        # A different glyph (U+2610) from another site's checklist styling.
        assert strip_bullet_prefix("☐2 cups flour") == "2 cups flour"

    def test_strips_bullet_with_following_space(self):
        assert strip_bullet_prefix("• 2 cups flour") == "2 cups flour"

    def test_strips_markdown_dash_bullet(self):
        assert strip_bullet_prefix("- 2 cups flour") == "2 cups flour"

    def test_strips_leading_whitespace_before_bullet(self):
        assert strip_bullet_prefix("  ▢2 cups flour") == "2 cups flour"

    def test_leaves_line_without_a_bullet_unchanged(self):
        assert strip_bullet_prefix("2 cups flour") == "2 cups flour"

    def test_does_not_strip_a_hyphen_inside_the_line(self):
        assert strip_bullet_prefix("all-purpose flour") == "all-purpose flour"


class TestToAmountQuantity:
    def test_converts_a_fraction(self):
        assert to_amount_quantity(Fraction(1, 2)) == 0.5

    def test_converts_a_float(self):
        assert to_amount_quantity(3.5) == 3.5

    def test_returns_none_for_none(self):
        assert to_amount_quantity(None) is None

    def test_converts_a_numeric_string(self):
        assert to_amount_quantity("2.5") == 2.5

    def test_returns_none_for_an_empty_string_without_raising(self):
        # Regression: the library types quantity as `Fraction | str` and a
        # real ingredient line produced "" here, which crashed the whole
        # Cloud Function invocation via float("").
        assert to_amount_quantity("") is None

    def test_returns_none_for_a_non_numeric_string_without_raising(self):
        assert to_amount_quantity("a few") is None


class TestNormalizeUnit:
    def test_maps_known_mass_unit(self):
        assert normalize_unit("gram") == "gram"

    def test_maps_known_volume_unit(self):
        assert normalize_unit("teaspoon") == "teaspoon"

    def test_maps_pint_fluid_ounce_underscore_form(self):
        assert normalize_unit("fluid_ounce") == "fluid-ounce"

    def test_maps_count_unit_passthrough(self):
        assert normalize_unit("clove") == "clove"

    def test_maps_stalk(self):
        # Regression: "2 stalks celery" produced unit="stalk", missing from
        # STANDARD_UNITS entirely — Zod rejected the whole recipe submission
        # on save with an unreadable raw enum-mismatch error.
        assert normalize_unit("stalk") == "stalk"
        assert normalize_unit("stalks") == "stalk"

    def test_is_case_insensitive(self):
        assert normalize_unit("GRAM") == "gram"

    def test_singularizes_plural_unit(self):
        assert normalize_unit("cups") == "cup"

    def test_returns_none_for_unmappable_unit(self):
        assert normalize_unit("furlong") is None

    def test_returns_none_for_none_input(self):
        assert normalize_unit(None) is None


class TestBuildIngredientRow:
    def test_clean_line_with_amount_and_unit(self):
        row = build_ingredient_row(
            name_text="all-purpose flour",
            name_confidence=0.99,
            amount_quantity=250.0,
            amount_unit="gram",
            amount_confidence=0.99,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            source_text="250g all-purpose flour",
        )
        assert row == {
            "flagged": False,
            "ingredient": {
                "name": "all-purpose flour",
                "amount": 250.0,
                "unit": "gram",
            },
        }

    def test_includes_preparation_and_notes_when_present(self):
        row = build_ingredient_row(
            name_text="eggs",
            name_confidence=0.98,
            amount_quantity=2.0,
            amount_unit=None,
            amount_confidence=0.98,
            is_compound=False,
            preparation_text="beaten",
            preparation_confidence=0.95,
            size_text="large",
            source_text="2 large eggs, beaten",
        )
        assert row == {
            "flagged": False,
            "ingredient": {
                "name": "eggs",
                "amount": 2.0,
                "preparation": "beaten",
                "notes": "large",
            },
        }

    def test_combines_size_and_comment_into_notes(self):
        row = build_ingredient_row(
            name_text="salt",
            name_confidence=0.97,
            amount_quantity=None,
            amount_unit=None,
            amount_confidence=None,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text="fine",
            comment_text="to taste",
            source_text="fine salt, to taste",
        )
        assert row["ingredient"]["notes"] == "fine, to taste"

    def test_line_with_no_amount_is_not_flagged_for_that_alone(self):
        row = build_ingredient_row(
            name_text="salt",
            name_confidence=0.95,
            amount_quantity=None,
            amount_unit=None,
            amount_confidence=None,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            comment_text="to taste",
            source_text="salt to taste",
        )
        assert row["flagged"] is False
        assert row["ingredient"]["name"] == "salt"

    def test_flags_low_confidence_name(self):
        row = build_ingredient_row(
            name_text="???",
            name_confidence=0.3,
            amount_quantity=None,
            amount_unit=None,
            amount_confidence=None,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            source_text="a splash of something",
        )
        assert row == {
            "flagged": True,
            "ingredient": {
                "name": "a splash of something",
                "rawOverride": "a splash of something",
            },
        }

    def test_flags_unmappable_unit(self):
        row = build_ingredient_row(
            name_text="wire",
            name_confidence=0.99,
            amount_quantity=2.0,
            amount_unit="furlong",
            amount_confidence=0.99,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            source_text="2 furlongs of wire",
        )
        assert row["flagged"] is True
        assert row["ingredient"]["rawOverride"] == "2 furlongs of wire"

    def test_flags_compound_amounts(self):
        row = build_ingredient_row(
            name_text="pork shoulder",
            name_confidence=0.99,
            amount_quantity=None,
            amount_unit=None,
            amount_confidence=None,
            is_compound=True,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            source_text="1 lb 2 oz pork shoulder",
        )
        assert row["flagged"] is True

    def test_flags_low_confidence_amount(self):
        row = build_ingredient_row(
            name_text="flour",
            name_confidence=0.99,
            amount_quantity=250.0,
            amount_unit="gram",
            amount_confidence=0.4,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            source_text="250g flour",
        )
        assert row["flagged"] is True

    def test_flags_low_confidence_preparation(self):
        row = build_ingredient_row(
            name_text="butter",
            name_confidence=0.99,
            amount_quantity=1.0,
            amount_unit="cup",
            amount_confidence=0.99,
            is_compound=False,
            preparation_text="maybe melted?",
            preparation_confidence=0.2,
            size_text=None,
            source_text="1 cup butter, maybe melted?",
        )
        assert row["flagged"] is True

    def test_custom_confidence_threshold(self):
        row = build_ingredient_row(
            name_text="flour",
            name_confidence=0.65,
            amount_quantity=250.0,
            amount_unit="gram",
            amount_confidence=0.99,
            is_compound=False,
            preparation_text=None,
            preparation_confidence=None,
            size_text=None,
            source_text="250g flour",
            confidence_threshold=0.5,
        )
        assert row["flagged"] is False
