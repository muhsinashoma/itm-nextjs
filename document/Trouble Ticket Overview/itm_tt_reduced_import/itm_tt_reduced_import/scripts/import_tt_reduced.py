#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg


DHAKA = ZoneInfo("Asia/Dhaka")


def clean(value: str | None) -> str | None:
    if value is None:
        return None

    value = value.strip()

    if value in {
        "",
        "NULL",
        "0000-00-00",
        "0000-00-00 00:00:00",
    }:
        return None

    return value


def as_int(value: str | None) -> int | None:
    value = clean(value)

    if value is None:
        return None

    try:
        return int(value)
    except ValueError:
        return None


def as_datetime(value: str | None) -> datetime | None:
    value = clean(value)

    if value is None:
        return None

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(
                value,
                fmt,
            ).replace(tzinfo=DHAKA)
        except ValueError:
            continue

    return None


def read_rows(
    path: Path,
) -> tuple[list[dict[str, str]], list[dict]]:
    valid: list[dict[str, str]] = []
    rejected: list[dict] = []

    with path.open(
        "r",
        encoding="utf-8-sig",
        errors="replace",
        newline="",
    ) as file:
        reader = csv.reader(file)
        header = next(reader)

        for line_no, row in enumerate(
            reader,
            start=2,
        ):
            if len(row) != len(header):
                rejected.append(
                    {
                        "line": line_no,
                        "expected_columns": len(header),
                        "actual_columns": len(row),
                        "preview": row[:6],
                    }
                )
                continue

            valid.append(
                dict(zip(header, row))
            )

    return valid, rejected


def normalized_status(
    row: dict[str, str],
    has_updates: bool,
) -> str:
    legacy_status = clean(
        row.get("status")
    )

    if legacy_status == "0":
        return "Closed"

    if legacy_status == "1":
        return (
            "In Progress"
            if has_updates
            else "Open"
        )

    return "Not Started"


def delivered_status(
    reason: dict[str, str] | None,
) -> str | None:
    if reason is None:
        return None

    delivered_value = clean(
        reason.get("delivered_val")
    )

    if delivered_value == "1":
        return "Delivered"

    if delivered_value == "2":
        return "Canceled"

    return "Pending"


def latest_by_tt(
    rows: list[dict[str, str]],
    tt_field: str,
    date_field: str,
) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}

    for row in rows:
        tt_no = clean(
            row.get(tt_field)
        )

        if not tt_no:
            continue

        current = result.get(tt_no)
        row_date = (
            as_datetime(
                row.get(date_field)
            )
            or datetime.min.replace(
                tzinfo=DHAKA
            )
        )

        current_date = (
            as_datetime(
                current.get(date_field)
            )
            if current is not None
            else None
        ) or datetime.min.replace(
            tzinfo=DHAKA
        )

        if (
            current is None
            or row_date >= current_date
        ):
            result[tt_no] = row

    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dir",
        required=True,
        type=Path,
    )
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help=(
            "Import valid rows while writing malformed "
            "rows to a reject report. Use only for development."
        ),
    )
    args = parser.parse_args()

    database_url = os.getenv(
        "DATABASE_URL"
    )

    if not database_url:
        raise SystemExit(
            "DATABASE_URL is required"
        )

    source = args.dir

    trouble_rows, trouble_bad = read_rows(
        source / "tbl_trouble_input.csv"
    )
    update_rows, update_bad = read_rows(
        source / "tbl_tt_update.csv"
    )
    reason_rows, reason_bad = read_rows(
        source / "tbl_tt_reason.csv"
    )
    fault_rows, fault_bad = read_rows(
        source / "tbl_fault_type1.csv"
    )
    other_fault_rows, other_fault_bad = read_rows(
        source / "tbl_fault_type_other.csv"
    )
    track_rows, track_bad = read_rows(
        source / "tbl_track_tt.csv"
    )

    rejected = {
        "tbl_trouble_input.csv": trouble_bad,
        "tbl_tt_update.csv": update_bad,
        "tbl_tt_reason.csv": reason_bad,
        "tbl_fault_type1.csv": fault_bad,
        "tbl_fault_type_other.csv": other_fault_bad,
        "tbl_track_tt.csv": track_bad,
    }

    reject_total = sum(
        len(items)
        for items in rejected.values()
    )

    master_dates = [
        as_datetime(
            row.get("fault_date_time")
        )
        for row in trouble_rows
    ]
    master_dates = [
        value
        for value in master_dates
        if value is not None
    ]

    tracking_dates = [
        as_datetime(
            row.get("date")
        )
        for row in track_rows
    ]
    tracking_dates = [
        value
        for value in tracking_dates
        if value is not None
    ]

    if not master_dates:
        raise SystemExit(
            "No valid master ticket dates found"
        )

    master_max = max(master_dates)
    tracking_max = (
        max(tracking_dates)
        if tracking_dates
        else master_max
    )

    incomplete_master = (
        tracking_max - master_max
    ).days > 30

    reject_report = source / (
        "tt_import_rejects.json"
    )

    if (
        reject_total > 0
        or incomplete_master
    ):
        reject_report.write_text(
            json.dumps(
                {
                    "rejected": rejected,
                    "master_max": master_max.isoformat(),
                    "tracking_max": tracking_max.isoformat(),
                    "incomplete_master": incomplete_master,
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        if not args.allow_partial:
            raise SystemExit(
                "Import stopped: CSV data is malformed or "
                "the master ticket export is incomplete. "
                f"See {reject_report}"
            )

    fault_names = {
        clean(row.get("id")):
            clean(row.get("fault_name"))
        for row in fault_rows
        if clean(row.get("id"))
    }

    other_fault_names = {
        clean(row.get("tt_no")):
            clean(row.get("fault_name"))
        for row in other_fault_rows
        if clean(row.get("tt_no"))
    }

    update_count_by_tt: dict[str, int] = (
        defaultdict(int)
    )

    for row in update_rows:
        tt_no = clean(row.get("tt_no"))

        if tt_no:
            update_count_by_tt[tt_no] += 1

    latest_reason = latest_by_tt(
        reason_rows,
        "tt_no",
        "created_at",
    )

    imported_tickets = 0
    imported_history = 0
    unmatched_updates = 0
    unmatched_reasons = 0

    with psycopg.connect(
        database_url
    ) as connection:
        with connection.cursor() as cursor:
            for row in trouble_rows:
                tt_no = clean(
                    row.get("tt_no")
                )
                created_at = as_datetime(
                    row.get("fault_date_time")
                )

                if (
                    not tt_no
                    or created_at is None
                ):
                    continue

                reason = latest_reason.get(
                    tt_no
                )

                fault_id = clean(
                    row.get("client_fault_type")
                )

                query_type = (
                    other_fault_names.get(tt_no)
                    or fault_names.get(fault_id)
                    or clean(
                        row.get(
                            "reason_of_problem"
                        )
                    )
                    or "Unspecified"
                )

                status = normalized_status(
                    row,
                    has_updates=(
                        update_count_by_tt.get(
                            tt_no,
                            0,
                        ) > 0
                    ),
                )

                requisition_type = (
                    clean(
                        reason.get("category")
                    )
                    if reason is not None
                    else None
                )

                delivery = delivered_status(
                    reason
                )

                cursor.execute(
                    """
                    INSERT INTO public.trouble_tickets (
                        legacy_id,
                        tt_no,
                        employee_id,
                        employee_name,
                        designation,
                        department,
                        function_name,
                        company_name,
                        mobile_no,
                        email,
                        query_type,
                        description,
                        requested_by,
                        assigned_id,
                        assigned_name,
                        status,
                        requisition_type,
                        delivered_status,
                        created_at,
                        closed_at,
                        closed_by,
                        closing_description,
                        source_status,
                        source_progress,
                        source_device_requisition,
                        legacy_data,
                        updated_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s::jsonb, NOW()
                    )
                    ON CONFLICT (tt_no) DO UPDATE
                    SET
                        legacy_id = EXCLUDED.legacy_id,
                        employee_id = EXCLUDED.employee_id,
                        employee_name = EXCLUDED.employee_name,
                        designation = EXCLUDED.designation,
                        department = EXCLUDED.department,
                        function_name = EXCLUDED.function_name,
                        company_name = EXCLUDED.company_name,
                        mobile_no = EXCLUDED.mobile_no,
                        email = EXCLUDED.email,
                        query_type = EXCLUDED.query_type,
                        description = EXCLUDED.description,
                        requested_by = EXCLUDED.requested_by,
                        assigned_id = EXCLUDED.assigned_id,
                        assigned_name = EXCLUDED.assigned_name,
                        status = EXCLUDED.status,
                        requisition_type = EXCLUDED.requisition_type,
                        delivered_status = EXCLUDED.delivered_status,
                        created_at = EXCLUDED.created_at,
                        closed_at = EXCLUDED.closed_at,
                        closed_by = EXCLUDED.closed_by,
                        closing_description = EXCLUDED.closing_description,
                        source_status = EXCLUDED.source_status,
                        source_progress = EXCLUDED.source_progress,
                        source_device_requisition =
                            EXCLUDED.source_device_requisition,
                        legacy_data = EXCLUDED.legacy_data,
                        updated_at = NOW()
                    RETURNING id
                    """,
                    (
                        as_int(row.get("id")),
                        tt_no,
                        clean(row.get("employee_id")),
                        clean(row.get("client_name")),
                        clean(row.get("designation")),
                        clean(row.get("depertment")),
                        clean(
                            row.get(
                                "fault_forward_logical"
                            )
                        ),
                        None,
                        clean(row.get("phone")),
                        clean(row.get("email")),
                        query_type,
                        clean(
                            row.get(
                                "reason_of_problem"
                            )
                        ),
                        clean(
                            row.get(
                                "fault_requested_by"
                            )
                        ),
                        clean(
                            row.get(
                                "fault_forwarded_to"
                            )
                        ),
                        (
                            clean(
                                row.get(
                                    "forward_logical_person"
                                )
                            )
                            or clean(
                                row.get(
                                    "dept_person_name"
                                )
                            )
                        ),
                        status,
                        requisition_type,
                        delivery,
                        created_at,
                        as_datetime(
                            row.get(
                                "ticket_close_date"
                            )
                        ),
                        clean(
                            row.get(
                                "close_ticket_by"
                            )
                        ),
                        clean(
                            row.get(
                                "closing_description"
                            )
                        ),
                        as_int(
                            row.get("status")
                        ),
                        as_int(
                            row.get(
                                "status_progess"
                            )
                        ),
                        as_int(
                            row.get(
                                "device_requis_val"
                            )
                        ),
                        json.dumps(
                            row,
                            ensure_ascii=False,
                        ),
                    ),
                )

                ticket_id = cursor.fetchone()[0]
                imported_tickets += 1

                cursor.execute(
                    """
                    INSERT INTO public.trouble_ticket_history (
                        ticket_id,
                        source_table,
                        source_legacy_id,
                        event_type,
                        previous_status,
                        current_status,
                        note,
                        assigned_to,
                        department,
                        attachment_url,
                        changed_by,
                        legacy_data,
                        created_at
                    )
                    VALUES (
                        %s,
                        'tbl_trouble_input',
                        %s,
                        'created',
                        NULL,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s::jsonb,
                        %s
                    )
                    ON CONFLICT (
                        source_table,
                        source_legacy_id
                    ) DO UPDATE
                    SET
                        current_status =
                            EXCLUDED.current_status,
                        note = EXCLUDED.note,
                        assigned_to =
                            EXCLUDED.assigned_to,
                        department =
                            EXCLUDED.department,
                        attachment_url =
                            EXCLUDED.attachment_url,
                        changed_by =
                            EXCLUDED.changed_by,
                        legacy_data =
                            EXCLUDED.legacy_data,
                        created_at =
                            EXCLUDED.created_at
                    """,
                    (
                        ticket_id,
                        as_int(row.get("id")),
                        status,
                        clean(
                            row.get(
                                "reason_of_problem"
                            )
                        ),
                        clean(
                            row.get(
                                "fault_forwarded_to"
                            )
                        ),
                        clean(
                            row.get(
                                "depertment"
                            )
                        ),
                        clean(
                            row.get(
                                "attach_file"
                            )
                        ),
                        clean(row.get("user")),
                        json.dumps(
                            row,
                            ensure_ascii=False,
                        ),
                        created_at,
                    ),
                )
                imported_history += 1

            cursor.execute(
                """
                SELECT tt_no, id
                FROM public.trouble_tickets
                """
            )
            ticket_ids = {
                tt_no: ticket_id
                for tt_no, ticket_id
                in cursor.fetchall()
            }

            for row in update_rows:
                tt_no = clean(row.get("tt_no"))
                ticket_id = (
                    ticket_ids.get(tt_no)
                    if tt_no
                    else None
                )
                created_at = as_datetime(
                    row.get(
                        "fault_update_date_time"
                    )
                )

                if (
                    ticket_id is None
                    or created_at is None
                ):
                    if tt_no:
                        unmatched_updates += 1
                    continue

                cursor.execute(
                    """
                    INSERT INTO public.trouble_ticket_history (
                        ticket_id,
                        source_table,
                        source_legacy_id,
                        event_type,
                        note,
                        assigned_to,
                        department,
                        attachment_url,
                        changed_by,
                        legacy_data,
                        created_at
                    )
                    VALUES (
                        %s,
                        'tbl_tt_update',
                        %s,
                        'comment',
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s::jsonb,
                        %s
                    )
                    ON CONFLICT (
                        source_table,
                        source_legacy_id
                    ) DO UPDATE
                    SET
                        note = EXCLUDED.note,
                        assigned_to =
                            EXCLUDED.assigned_to,
                        department =
                            EXCLUDED.department,
                        attachment_url =
                            EXCLUDED.attachment_url,
                        changed_by =
                            EXCLUDED.changed_by,
                        legacy_data =
                            EXCLUDED.legacy_data,
                        created_at =
                            EXCLUDED.created_at
                    """,
                    (
                        ticket_id,
                        as_int(row.get("id")),
                        clean(row.get("tt_note")),
                        (
                            clean(
                                row.get(
                                    "client_fault_forward_to"
                                )
                            )
                            or clean(
                                row.get(
                                    "forward_parson"
                                )
                            )
                        ),
                        clean(row.get("department")),
                        clean(row.get("file_link")),
                        clean(row.get("user")),
                        json.dumps(
                            row,
                            ensure_ascii=False,
                        ),
                        created_at,
                    ),
                )
                imported_history += 1

            for row in reason_rows:
                tt_no = clean(row.get("tt_no"))
                ticket_id = (
                    ticket_ids.get(tt_no)
                    if tt_no
                    else None
                )

                if ticket_id is None:
                    if tt_no:
                        unmatched_reasons += 1
                    continue

                cursor.execute(
                    """
                    INSERT INTO public.trouble_ticket_history (
                        ticket_id,
                        source_table,
                        source_legacy_id,
                        event_type,
                        note,
                        changed_by,
                        legacy_data,
                        created_at
                    )
                    VALUES (
                        %s,
                        'tbl_tt_reason',
                        %s,
                        'requisition',
                        %s,
                        %s,
                        %s::jsonb,
                        COALESCE(%s, NOW())
                    )
                    ON CONFLICT (
                        source_table,
                        source_legacy_id
                    ) DO UPDATE
                    SET
                        note = EXCLUDED.note,
                        changed_by =
                            EXCLUDED.changed_by,
                        legacy_data =
                            EXCLUDED.legacy_data,
                        created_at =
                            EXCLUDED.created_at
                    """,
                    (
                        ticket_id,
                        as_int(row.get("id")),
                        (
                            (
                                clean(
                                    row.get("category")
                                )
                                or "Requisition"
                            )
                            + (
                                ": "
                                + clean(
                                    row.get(
                                        "reason_details"
                                    )
                                )
                                if clean(
                                    row.get(
                                        "reason_details"
                                    )
                                )
                                else ""
                            )
                        ),
                        clean(row.get("created_by")),
                        json.dumps(
                            row,
                            ensure_ascii=False,
                        ),
                        as_datetime(
                            row.get("created_at")
                        ),
                    ),
                )
                imported_history += 1

        connection.commit()

    print(
        f"Tickets imported/upserted: "
        f"{imported_tickets}"
    )
    print(
        f"History rows imported/upserted: "
        f"{imported_history}"
    )
    print(
        f"Malformed CSV rows skipped: "
        f"{reject_total}"
    )
    print(
        f"Update rows without a matching master ticket: "
        f"{unmatched_updates}"
    )
    print(
        f"Requisition rows without a matching master ticket: "
        f"{unmatched_reasons}"
    )

    if incomplete_master:
        print(
            "WARNING: the master ticket export is older "
            "than the tracking data. This import is not "
            "suitable for a complete production dashboard."
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
