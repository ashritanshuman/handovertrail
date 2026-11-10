from app.services.verify import (
    normalize_text,
    verify_quote_against_evidence,
    determine_claim_verification,
)


def test_verifier_real_quote():
    ev_units = [
        {
            "id": "ev-01",
            "text": "The service utilizes SQLite with WAL mode for local checkout concurrency.",
            "access_level": 1,
        }
    ]
    status, level = determine_claim_verification(
        claim_type="decision",
        claim_text="SQLite WAL mode used for checkout concurrency.",
        quote="SQLite with WAL mode for local checkout concurrency",
        cited_units=ev_units,
    )
    assert status == "verified"
    assert level == 1


def test_verifier_fabricated_quote():
    ev_units = [
        {
            "id": "ev-01",
            "text": "The service utilizes SQLite with WAL mode for local checkout concurrency.",
            "access_level": 1,
        }
    ]
    status, level = determine_claim_verification(
        claim_type="decision",
        claim_text="PostgreSQL RDS multi-AZ cluster deployed in production.",
        quote="PostgreSQL RDS multi-AZ cluster deployed in production",
        cited_units=ev_units,
    )
    assert status == "missing"


def test_verifier_whitespace_and_case_variants():
    ev_units = [
        {
            "id": "ev-01",
            "text": "We   agreed   to rotate external API keys quarterly (90 days)\n\n to avoid breaking webhooks.",
            "access_level": 1,
        }
    ]
    # Test case variation + multiple spaces
    quote_variant = "WE AGREED TO ROTATE EXTERNAL API KEYS QUARTERLY (90 DAYS)"
    status, level = determine_claim_verification(
        claim_type="task",
        claim_text="Rotate API keys quarterly.",
        quote=quote_variant,
        cited_units=ev_units,
    )
    assert status == "verified"
    assert level == 1
