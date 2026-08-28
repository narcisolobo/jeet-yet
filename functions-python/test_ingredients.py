from ingredients import build_ingredient_row, normalize_unit


class TestNormalizeUnit:
    def test_maps_known_mass_unit(self):
        assert normalize_unit("gram") == "gram"

    def test_maps_known_volume_unit(self):
        assert normalize_unit("teaspoon") == "teaspoon"

    def test_maps_pint_fluid_ounce_underscore_form(self):
        assert normalize_unit("fluid_ounce") == "fluid-ounce"

    def test_maps_count_unit_passthrough(self):
        assert normalize_unit("clove") == "clove"

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
