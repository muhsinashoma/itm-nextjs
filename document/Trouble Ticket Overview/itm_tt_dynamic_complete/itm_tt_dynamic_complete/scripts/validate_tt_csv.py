#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
from collections import Counter
from datetime import datetime
from pathlib import Path


FILES = {
    "tbl_trouble_input.csv": ("fault_date_time", 51),
    "tbl_tt_update.csv": ("fault_update_date_time", 25),
    "tbl_tt_reason.csv": ("created_at", 20),
    "tbl_track_tt.csv": ("date", 6),
    "tbl_fault_type1.csv": ("date", 8),
    "tbl_fault_type_other.csv": ("date", 8),
}


def parse_datetime(value: str) -> datetime | None:
    value = value.strip()

    if value in {
        "",
        "NULL",
        "0000-00-00",
        "0000-00-00 00:00:00",
    }:
        return None

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


def inspect(
    path: Path,
    date_column: str,
    expected_columns: int,
) -> dict:
    rows = 0
    malformed = 0
    lengths: Counter[int] = Counter()
    minimum: datetime | None = None
    maximum: datetime | None = None

    with path.open(
        "r",
        encoding="utf-8-sig",
        errors="replace",
        newline="",
    ) as file:
        reader = csv.reader(file)
        header = next(reader)

        if len(header) != expected_columns:
            raise RuntimeError(
                f"{path.name}: expected "
                f"{expected_columns} header columns, "
                f"found {len(header)}"
            )

        date_index = header.index(date_column)

        for row in reader:
            lengths[len(row)] += 1

            if len(row) != len(header):
                malformed += 1
                continue

            rows += 1
            parsed = parse_datetime(row[date_index])

            if parsed is not None:
                minimum = (
                    parsed
                    if minimum is None
                    else min(minimum, parsed)
                )
                maximum = (
                    parsed
                    if maximum is None
                    else max(maximum, parsed)
                )

    return {
        "rows": rows,
        "malformed": malformed,
        "lengths": dict(lengths),
        "minimum": minimum,
        "maximum": maximum,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dir",
        required=True,
        type=Path,
    )
    args = parser.parse_args()

    reports: dict[str, dict] = {}
    errors: list[str] = []

    for filename, (
        date_column,
        expected_columns,
    ) in FILES.items():
        path = args.dir / filename

        if not path.exists():
            errors.append(
                f"Missing required file: {filename}"
            )
            continue

        report = inspect(
            path,
            date_column,
            expected_columns,
        )
        reports[filename] = report

        print(
            f"{filename}: "
            f"valid={report['rows']} "
            f"malformed={report['malformed']} "
            f"min={report['minimum']} "
            f"max={report['maximum']} "
            f"column_lengths={report['lengths']}"
        )

        if report["malformed"]:
            errors.append(
                f"{filename} has "
                f"{report['malformed']} malformed records"
            )

    master = reports.get(
        "tbl_trouble_input.csv"
    )
    tracking = reports.get(
        "tbl_track_tt.csv"
    )

    if master and tracking:
        master_max = master["maximum"]
        tracking_max = tracking["maximum"]

        if (
            master_max is not None
            and tracking_max is not None
            and (tracking_max - master_max).days > 30
        ):
            errors.append(
                "tbl_trouble_input.csv is incomplete: "
                f"master max date is {master_max}, "
                f"but tracking max date is {tracking_max}"
            )

    if errors:
        print("\nVALIDATION FAILED")

        for error in errors:
            print(f"- {error}")

        print(
            "\nRe-export the legacy MySQL tables "
            "with correct CSV quoting before production import."
        )
        return 1

    print("\nVALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
