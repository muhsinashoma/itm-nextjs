
#!/usr/bin/env python3

# itm/backend/scripts/sync_tt_requisition.py

import os
import sys
import time
from pathlib import Path

import pymysql
import psycopg
from dotenv import load_dotenv


# ============================================================
# LOAD BACKEND .ENV
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

load_dotenv(
    BACKEND_DIR / ".env"
)


# ============================================================
# CONFIGURATION
# ============================================================

MYSQL_HOST = os.getenv(
    "LEGACY_MYSQL_HOST"
)

MYSQL_PORT = int(
    os.getenv(
        "LEGACY_MYSQL_PORT",
        "3306",
    )
)

MYSQL_USER = os.getenv(
    "LEGACY_MYSQL_USER"
)

MYSQL_PASSWORD = os.getenv(
    "LEGACY_MYSQL_PASSWORD"
)

MYSQL_DATABASE = os.getenv(
    "LEGACY_MYSQL_DATABASE",
    "itm",
)

DATABASE_URL = os.getenv(
    "DATABASE_URL"
)

SYNC_INTERVAL_SECONDS = int(
    os.getenv(
        "TT_SYNC_INTERVAL_SECONDS",
        "60",
    )
)


# ============================================================
# VALIDATE CONFIGURATION
# ============================================================

def validate_environment():
    required = {
        "LEGACY_MYSQL_HOST":
            MYSQL_HOST,

        "LEGACY_MYSQL_USER":
            MYSQL_USER,

        "LEGACY_MYSQL_PASSWORD":
            MYSQL_PASSWORD,

        "DATABASE_URL":
            DATABASE_URL,
    }

    missing = [
        key
        for key, value
        in required.items()
        if not value
    ]

    if missing:
        raise RuntimeError(
            "Missing environment variables: "
            + ", ".join(missing)
        )


# ============================================================
# DATABASE CONNECTIONS
# ============================================================

def open_mysql():
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset="utf8mb4",
        cursorclass=
            pymysql.cursors.DictCursor,
        autocommit=True,
    )


def open_postgresql():
    return psycopg.connect(
        DATABASE_URL
    )


# ============================================================
# HELPERS
# ============================================================

def normalize_tt_no(value):
    if value is None:
        return ""

    tt_no = str(
        value
    ).strip()

    if tt_no.endswith(
        ".0"
    ):
        tt_no = (
            tt_no[:-2]
        )

    return tt_no


def normalize_string(value):
    if value is None:
        return None

    value = str(
        value
    ).strip()

    if not value:
        return None

    return value


# ============================================================
# SYNC REQUISITION
#
# Legacy MySQL:
#
# tbl_trouble_input.device_requis_val
# tbl_trouble_input.requis_by
# tbl_trouble_input.requis_date
#
# PostgreSQL:
#
# trouble_tickets.source_device_requisition
# trouble_tickets.source_requisition_by
# trouble_tickets.source_requisition_date
#
# Business Rule:
#
# device_requis_val = 3
# → Requisition = Raised
# ============================================================

def sync_requisition(
    mysql_connection,
    postgres_connection,
):
    with mysql_connection.cursor() as mysql_cursor:
        mysql_cursor.execute(
            """
            SELECT
                TRIM(
                    CAST(
                        tt_no AS CHAR
                    )
                ) AS tt_no,

                COALESCE(
                    device_requis_val,
                    0
                ) AS device_requis_val,

                NULLIF(
                    TRIM(
                        CAST(
                            requis_by AS CHAR
                        )
                    ),
                    ''
                ) AS requis_by,

                NULLIF(
                    CAST(
                        requis_date AS CHAR
                    ),
                    '0000-00-00 00:00:00'
                ) AS requis_date

            FROM itm.tbl_trouble_input

            WHERE tt_no IS NOT NULL
            """
        )

        mysql_rows = (
            mysql_cursor.fetchall()
        )

    updated = 0
    unchanged = 0
    missing = 0

    with postgres_connection.cursor() as pg_cursor:
        for row in mysql_rows:
            tt_no = normalize_tt_no(
                row.get(
                    "tt_no"
                )
            )

            if not tt_no:
                continue

            requisition_value = int(
                row.get(
                    "device_requis_val"
                )
                or 0
            )

            requisition_by = (
                normalize_string(
                    row.get(
                        "requis_by"
                    )
                )
            )

            requisition_date = (
                row.get(
                    "requis_date"
                )
            )

            pg_cursor.execute(
                """
                UPDATE public.trouble_tickets

                SET
                    source_device_requisition = %s,

                    source_requisition_by = %s,

                    source_requisition_date = %s,

                    updated_at = NOW()

                WHERE
                    BTRIM(
                        tt_no
                    ) = %s

                    AND (
                        COALESCE(
                            source_device_requisition,
                            0
                        ) IS DISTINCT FROM %s

                        OR source_requisition_by
                            IS DISTINCT FROM %s

                        OR source_requisition_date
                            IS DISTINCT FROM %s
                    )
                """,
                (
                    requisition_value,
                    requisition_by,
                    requisition_date,
                    tt_no,

                    requisition_value,
                    requisition_by,
                    requisition_date,
                ),
            )

            if (
                pg_cursor.rowcount
                > 0
            ):
                updated += 1
                continue

            pg_cursor.execute(
                """
                SELECT
                    id

                FROM public.trouble_tickets

                WHERE
                    BTRIM(
                        tt_no
                    ) = %s

                LIMIT 1
                """,
                (
                    tt_no,
                ),
            )

            result = (
                pg_cursor.fetchone()
            )

            if result is None:
                missing += 1
            else:
                unchanged += 1

    return {
        "source_rows":
            len(mysql_rows),

        "updated":
            updated,

        "unchanged":
            unchanged,

        "missing":
            missing,
    }


# ============================================================
# FIND POSTGRES TROUBLE TICKET ID
# ============================================================

def find_trouble_ticket_id(
    pg_cursor,
    tt_no,
):
    pg_cursor.execute(
        """
        SELECT
            id

        FROM public.trouble_tickets

        WHERE
            BTRIM(
                tt_no
            ) = %s

        LIMIT 1
        """,
        (
            tt_no,
        ),
    )

    result = (
        pg_cursor.fetchone()
    )

    if result is None:
        return None

    return result[0]


# ============================================================
# SYNC DELIVERY STATUS
#
# Legacy MySQL:
#
# tbl_tt_reason.delivered_val
# tbl_tt_reason.delivered_by
# tbl_tt_reason.delivered_date
#
# PostgreSQL:
#
# tt_reasons.delivered_val
# tt_reasons.delivered_by
# tt_reasons.delivered_date
#
# Business Rule:
#
# delivered_val = 0 → Pending
# delivered_val = 1 → Delivered
# delivered_val = 2 → Rejected
#
# If requisition is Raised and there is no reason row yet:
# → Pending
# ============================================================

def sync_delivery_status(
    mysql_connection,
    postgres_connection,
):
    with mysql_connection.cursor() as mysql_cursor:
        mysql_cursor.execute(
            """
            SELECT
                id,

                TRIM(
                    CAST(
                        tt_no AS CHAR
                    )
                ) AS tt_no,

                delivered_val,

                NULLIF(
                    TRIM(
                        CAST(
                            delivered_by AS CHAR
                        )
                    ),
                    ''
                ) AS delivered_by,

                NULLIF(
                    CAST(
                        delivered_date AS CHAR
                    ),
                    '0000-00-00 00:00:00'
                ) AS delivered_date

            FROM itm.tbl_tt_reason

            WHERE tt_no IS NOT NULL
            """
        )

        mysql_rows = (
            mysql_cursor.fetchall()
        )

    updated = 0
    inserted = 0
    unchanged = 0
    missing_ticket = 0

    with postgres_connection.cursor() as pg_cursor:
        for row in mysql_rows:
            reason_id = (
                row.get(
                    "id"
                )
            )

            tt_no = normalize_tt_no(
                row.get(
                    "tt_no"
                )
            )

            if (
                reason_id is None
                or not tt_no
            ):
                continue

            delivered_val = (
                row.get(
                    "delivered_val"
                )
            )

            delivered_by = (
                normalize_string(
                    row.get(
                        "delivered_by"
                    )
                )
            )

            delivered_date = (
                row.get(
                    "delivered_date"
                )
            )

            trouble_ticket_id = (
                find_trouble_ticket_id(
                    pg_cursor,
                    tt_no,
                )
            )

            if (
                trouble_ticket_id
                is None
            ):
                missing_ticket += 1

            # ------------------------------------------------
            # UPDATE EXISTING REASON ROW
            # ------------------------------------------------

            pg_cursor.execute(
                """
                UPDATE public.tt_reasons

                SET
                    trouble_ticket_id = %s,

                    tt_no = %s,

                    delivered_val = %s,

                    delivered_by = %s,

                    delivered_date = %s

                WHERE
                    id = %s

                    AND (
                        trouble_ticket_id
                            IS DISTINCT FROM %s

                        OR tt_no
                            IS DISTINCT FROM %s

                        OR delivered_val
                            IS DISTINCT FROM %s

                        OR delivered_by
                            IS DISTINCT FROM %s

                        OR delivered_date
                            IS DISTINCT FROM %s
                    )
                """,
                (
                    trouble_ticket_id,
                    tt_no,
                    delivered_val,
                    delivered_by,
                    delivered_date,
                    reason_id,

                    trouble_ticket_id,
                    tt_no,
                    delivered_val,
                    delivered_by,
                    delivered_date,
                ),
            )

            if (
                pg_cursor.rowcount
                > 0
            ):
                updated += 1
                continue

            # ------------------------------------------------
            # CHECK IF REASON ALREADY EXISTS AND IS UNCHANGED
            # ------------------------------------------------

            pg_cursor.execute(
                """
                SELECT
                    id

                FROM public.tt_reasons

                WHERE id = %s

                LIMIT 1
                """,
                (
                    reason_id,
                ),
            )

            existing_reason = (
                pg_cursor.fetchone()
            )

            if (
                existing_reason
                is not None
            ):
                unchanged += 1
                continue

            # ------------------------------------------------
            # INSERT NEW LEGACY REASON ROW
            # ------------------------------------------------

            pg_cursor.execute(
                """
                INSERT INTO public.tt_reasons
                (
                    id,
                    trouble_ticket_id,
                    tt_no,
                    delivered_val,
                    delivered_by,
                    delivered_date
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )

                ON CONFLICT (id)

                DO UPDATE SET
                    trouble_ticket_id =
                        EXCLUDED.trouble_ticket_id,

                    tt_no =
                        EXCLUDED.tt_no,

                    delivered_val =
                        EXCLUDED.delivered_val,

                    delivered_by =
                        EXCLUDED.delivered_by,

                    delivered_date =
                        EXCLUDED.delivered_date
                """,
                (
                    reason_id,
                    trouble_ticket_id,
                    tt_no,
                    delivered_val,
                    delivered_by,
                    delivered_date,
                ),
            )

            inserted += 1

    return {
        "source_rows":
            len(mysql_rows),

        "updated":
            updated,

        "inserted":
            inserted,

        "unchanged":
            unchanged,

        "missing_tickets":
            missing_ticket,
    }


# ============================================================
# RUN ONE COMPLETE SYNC
# ============================================================

def sync_once():
    mysql_connection = None
    postgres_connection = None

    try:
        mysql_connection = (
            open_mysql()
        )

        postgres_connection = (
            open_postgresql()
        )

        # ----------------------------------------------------
        # SYNC REQUISITION
        # ----------------------------------------------------

        requisition_result = (
            sync_requisition(
                mysql_connection,
                postgres_connection,
            )
        )

        # ----------------------------------------------------
        # SYNC DELIVERY
        # ----------------------------------------------------

        delivery_result = (
            sync_delivery_status(
                mysql_connection,
                postgres_connection,
            )
        )

        # ----------------------------------------------------
        # COMMIT BOTH SYNCS
        # ----------------------------------------------------

        postgres_connection.commit()

        # ----------------------------------------------------
        # OUTPUT
        # ----------------------------------------------------

        print()

        print(
            "=========================================="
        )

        print(
            "ITM Trouble Ticket sync completed"
        )

        print(
            "=========================================="
        )

        print()

        print(
            "Requisition Sync:"
        )

        print(
            "  MySQL rows :",
            requisition_result[
                "source_rows"
            ],
        )

        print(
            "  Updated    :",
            requisition_result[
                "updated"
            ],
        )

        print(
            "  Unchanged  :",
            requisition_result[
                "unchanged"
            ],
        )

        print(
            "  Missing TT :",
            requisition_result[
                "missing"
            ],
        )

        print()

        print(
            "Delivery Sync:"
        )

        print(
            "  MySQL rows :",
            delivery_result[
                "source_rows"
            ],
        )

        print(
            "  Updated    :",
            delivery_result[
                "updated"
            ],
        )

        print(
            "  Inserted   :",
            delivery_result[
                "inserted"
            ],
        )

        print(
            "  Unchanged  :",
            delivery_result[
                "unchanged"
            ],
        )

        print(
            "  Missing TT :",
            delivery_result[
                "missing_tickets"
            ],
        )

        print()

        print(
            "=========================================="
        )

        print()

    except Exception:
        if postgres_connection:
            postgres_connection.rollback()

        raise

    finally:
        if postgres_connection:
            postgres_connection.close()

        if mysql_connection:
            mysql_connection.close()


# ============================================================
# MAIN
# ============================================================

def main():
    validate_environment()

    once = (
        "--once"
        in sys.argv
    )

    while True:
        try:
            sync_once()

        except Exception as error:
            print(
                "TT sync failed:",
                str(error),
                file=sys.stderr,
            )

            if once:
                return 1

        if once:
            return 0

        time.sleep(
            SYNC_INTERVAL_SECONDS
        )


if __name__ == "__main__":
    raise SystemExit(
        main()
    )


# #!/usr/bin/env python3

# # itm/backend/scripts/sync_tt_requisition.py

# import os
# import sys
# import time
# from pathlib import Path

# import pymysql
# import psycopg
# from dotenv import load_dotenv


# # ============================================================
# # LOAD BACKEND .ENV
# # ============================================================

# BACKEND_DIR = Path(__file__).resolve().parents[1]

# load_dotenv(
#     BACKEND_DIR / ".env"
# )


# # ============================================================
# # CONFIGURATION
# # ============================================================

# MYSQL_HOST = os.getenv(
#     "LEGACY_MYSQL_HOST"
# )

# MYSQL_PORT = int(
#     os.getenv(
#         "LEGACY_MYSQL_PORT",
#         "3306",
#     )
# )

# MYSQL_USER = os.getenv(
#     "LEGACY_MYSQL_USER"
# )

# MYSQL_PASSWORD = os.getenv(
#     "LEGACY_MYSQL_PASSWORD"
# )

# MYSQL_DATABASE = os.getenv(
#     "LEGACY_MYSQL_DATABASE",
#     "itm",
# )

# DATABASE_URL = os.getenv(
#     "DATABASE_URL"
# )

# SYNC_INTERVAL_SECONDS = int(
#     os.getenv(
#         "TT_SYNC_INTERVAL_SECONDS",
#         "60",
#     )
# )


# # ============================================================
# # VALIDATE CONFIGURATION
# # ============================================================

# def validate_environment():
#     required = {
#         "LEGACY_MYSQL_HOST":
#             MYSQL_HOST,

#         "LEGACY_MYSQL_USER":
#             MYSQL_USER,

#         "LEGACY_MYSQL_PASSWORD":
#             MYSQL_PASSWORD,

#         "DATABASE_URL":
#             DATABASE_URL,
#     }

#     missing = [
#         key
#         for key, value
#         in required.items()
#         if not value
#     ]

#     if missing:
#         raise RuntimeError(
#             "Missing environment variables: "
#             + ", ".join(missing)
#         )


# # ============================================================
# # DATABASE CONNECTIONS
# # ============================================================

# def open_mysql():
#     return pymysql.connect(
#         host=MYSQL_HOST,
#         port=MYSQL_PORT,
#         user=MYSQL_USER,
#         password=MYSQL_PASSWORD,
#         database=MYSQL_DATABASE,
#         charset="utf8mb4",
#         cursorclass=
#             pymysql.cursors.DictCursor,
#         autocommit=True,
#     )


# def open_postgresql():
#     return psycopg.connect(
#         DATABASE_URL
#     )


# # ============================================================
# # TT NUMBER NORMALIZATION
# # ============================================================

# def normalize_tt_no(value):
#     if value is None:
#         return ""

#     tt_no = str(
#         value
#     ).strip()

#     if tt_no.endswith(".0"):
#         tt_no = tt_no[:-2]

#     return tt_no


# # ============================================================
# # SYNC REQUISITION
# #
# # MySQL:
# # tbl_trouble_input.device_requis_val
# #
# # PostgreSQL:
# # trouble_tickets.source_device_requisition
# #
# # 3 = Raised
# # ============================================================

# def sync_requisition(
#     mysql_connection,
#     postgres_connection,
# ):
#     with mysql_connection.cursor() as mysql_cursor:
#         mysql_cursor.execute(
#             """
#             SELECT
#                 TRIM(
#                     CAST(
#                         tt_no AS CHAR
#                     )
#                 ) AS tt_no,

#                 COALESCE(
#                     device_requis_val,
#                     0
#                 ) AS device_requis_val

#             FROM itm.tbl_trouble_input

#             WHERE tt_no IS NOT NULL
#             """
#         )

#         mysql_rows = (
#             mysql_cursor.fetchall()
#         )

#     updated = 0
#     unchanged = 0
#     missing = 0

#     with postgres_connection.cursor() as pg_cursor:
#         for row in mysql_rows:
#             tt_no = normalize_tt_no(
#                 row.get(
#                     "tt_no"
#                 )
#             )

#             if not tt_no:
#                 continue

#             requisition_value = int(
#                 row.get(
#                     "device_requis_val"
#                 )
#                 or 0
#             )

#             pg_cursor.execute(
#                 """
#                 UPDATE public.trouble_tickets

#                 SET
#                     source_device_requisition = %s,
#                     updated_at = NOW()

#                 WHERE
#                     BTRIM(tt_no) = %s

#                     AND COALESCE(
#                         source_device_requisition,
#                         0
#                     ) IS DISTINCT FROM %s
#                 """,
#                 (
#                     requisition_value,
#                     tt_no,
#                     requisition_value,
#                 ),
#             )

#             if pg_cursor.rowcount > 0:
#                 updated += 1
#                 continue

#             pg_cursor.execute(
#                 """
#                 SELECT id

#                 FROM public.trouble_tickets

#                 WHERE BTRIM(tt_no) = %s

#                 LIMIT 1
#                 """,
#                 (
#                     tt_no,
#                 ),
#             )

#             result = (
#                 pg_cursor.fetchone()
#             )

#             if result is None:
#                 missing += 1
#             else:
#                 unchanged += 1

#     return {
#         "source_rows":
#             len(mysql_rows),

#         "updated":
#             updated,

#         "unchanged":
#             unchanged,

#         "missing":
#             missing,
#     }


# # ============================================================
# # FIND POSTGRES TROUBLE TICKET
# # ============================================================

# def find_trouble_ticket_id(
#     pg_cursor,
#     tt_no,
# ):
#     pg_cursor.execute(
#         """
#         SELECT id

#         FROM public.trouble_tickets

#         WHERE BTRIM(tt_no) = %s

#         LIMIT 1
#         """,
#         (
#             tt_no,
#         ),
#     )

#     result = (
#         pg_cursor.fetchone()
#     )

#     if result is None:
#         return None

#     return result[0]


# # ============================================================
# # SYNC DELIVERY STATUS
# #
# # MySQL:
# # tbl_tt_reason.delivered_val
# #
# # PostgreSQL:
# # tt_reasons.delivered_val
# #
# # 0 = Pending
# # 1 = Delivered
# # 2 = Rejected
# # ============================================================

# def sync_delivery_status(
#     mysql_connection,
#     postgres_connection,
# ):
#     with mysql_connection.cursor() as mysql_cursor:
#         mysql_cursor.execute(
#             """
#             SELECT
#                 id,

#                 TRIM(
#                     CAST(
#                         tt_no AS CHAR
#                     )
#                 ) AS tt_no,

#                 delivered_val

#             FROM itm.tbl_tt_reason

#             WHERE tt_no IS NOT NULL
#             """
#         )

#         mysql_rows = (
#             mysql_cursor.fetchall()
#         )

#     updated = 0
#     inserted = 0
#     missing_ticket = 0

#     with postgres_connection.cursor() as pg_cursor:
#         for row in mysql_rows:
#             reason_id = row.get(
#                 "id"
#             )

#             tt_no = normalize_tt_no(
#                 row.get(
#                     "tt_no"
#                 )
#             )

#             delivered_val = row.get(
#                 "delivered_val"
#             )

#             if (
#                 reason_id is None
#                 or not tt_no
#             ):
#                 continue

#             trouble_ticket_id = (
#                 find_trouble_ticket_id(
#                     pg_cursor,
#                     tt_no,
#                 )
#             )

#             if trouble_ticket_id is None:
#                 missing_ticket += 1

#             # First try to update an existing migrated reason row.
#             pg_cursor.execute(
#                 """
#                 UPDATE public.tt_reasons

#                 SET
#                     trouble_ticket_id = %s,
#                     tt_no = %s,
#                     delivered_val = %s

#                 WHERE id = %s
#                 """,
#                 (
#                     trouble_ticket_id,
#                     tt_no,
#                     delivered_val,
#                     reason_id,
#                 ),
#             )

#             if pg_cursor.rowcount > 0:
#                 updated += 1
#                 continue

#             # If MySQL has a new reason row that PostgreSQL
#             # does not have yet, create it.
#             pg_cursor.execute(
#                 """
#                 INSERT INTO public.tt_reasons
#                 (
#                     id,
#                     trouble_ticket_id,
#                     tt_no,
#                     delivered_val
#                 )

#                 VALUES
#                 (
#                     %s,
#                     %s,
#                     %s,
#                     %s
#                 )

#                 ON CONFLICT (id)
#                 DO UPDATE SET
#                     trouble_ticket_id =
#                         EXCLUDED.trouble_ticket_id,

#                     tt_no =
#                         EXCLUDED.tt_no,

#                     delivered_val =
#                         EXCLUDED.delivered_val
#                 """,
#                 (
#                     reason_id,
#                     trouble_ticket_id,
#                     tt_no,
#                     delivered_val,
#                 ),
#             )

#             inserted += 1

#     return {
#         "source_rows":
#             len(mysql_rows),

#         "updated":
#             updated,

#         "inserted":
#             inserted,

#         "missing_tickets":
#             missing_ticket,
#     }


# # ============================================================
# # RUN ONE COMPLETE SYNC
# # ============================================================

# def sync_once():
#     mysql_connection = None
#     postgres_connection = None

#     try:
#         mysql_connection = (
#             open_mysql()
#         )

#         postgres_connection = (
#             open_postgresql()
#         )

#         requisition_result = (
#             sync_requisition(
#                 mysql_connection,
#                 postgres_connection,
#             )
#         )

#         delivery_result = (
#             sync_delivery_status(
#                 mysql_connection,
#                 postgres_connection,
#             )
#         )

#         postgres_connection.commit()

#         print()
#         print(
#             "=========================================="
#         )
#         print(
#             "ITM Trouble Ticket sync completed"
#         )
#         print(
#             "=========================================="
#         )

#         print(
#             "Requisition Sync:"
#         )

#         print(
#             "  MySQL rows :",
#             requisition_result[
#                 "source_rows"
#             ],
#         )

#         print(
#             "  Updated    :",
#             requisition_result[
#                 "updated"
#             ],
#         )

#         print(
#             "  Unchanged  :",
#             requisition_result[
#                 "unchanged"
#             ],
#         )

#         print(
#             "  Missing TT :",
#             requisition_result[
#                 "missing"
#             ],
#         )

#         print()

#         print(
#             "Delivery Sync:"
#         )

#         print(
#             "  MySQL rows :",
#             delivery_result[
#                 "source_rows"
#             ],
#         )

#         print(
#             "  Updated    :",
#             delivery_result[
#                 "updated"
#             ],
#         )

#         print(
#             "  Inserted   :",
#             delivery_result[
#                 "inserted"
#             ],
#         )

#         print(
#             "  Missing TT :",
#             delivery_result[
#                 "missing_tickets"
#             ],
#         )

#         print(
#             "=========================================="
#         )
#         print()

#     except Exception:
#         if postgres_connection:
#             postgres_connection.rollback()

#         raise

#     finally:
#         if postgres_connection:
#             postgres_connection.close()

#         if mysql_connection:
#             mysql_connection.close()


# # ============================================================
# # MAIN
# # ============================================================

# def main():
#     validate_environment()

#     once = (
#         "--once"
#         in sys.argv
#     )

#     while True:
#         try:
#             sync_once()

#         except Exception as error:
#             print(
#                 "TT sync failed:",
#                 str(error),
#                 file=sys.stderr,
#             )

#             if once:
#                 return 1

#         if once:
#             return 0

#         time.sleep(
#             SYNC_INTERVAL_SECONDS
#         )


# if __name__ == "__main__":
#     raise SystemExit(
#         main()
#     )