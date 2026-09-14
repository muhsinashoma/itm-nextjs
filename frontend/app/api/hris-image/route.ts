import {
    NextRequest,
    NextResponse,
} from "next/server";

const HRIS_IMAGE_BASE_URL =
    (
        process.env
            .HRIS_IMAGE_BASE_URL ??
        ""
    )
        .trim()
        .replace(
            /\/+$/,
            ""
        );

const HRIS_IMAGE_AUTH_TOKEN =
    (
        process.env
            .HRIS_IMAGE_AUTH_TOKEN ??
        ""
    ).trim();

const configuredAllowedHosts =
    (
        process.env
            .HRIS_IMAGE_ALLOWED_HOSTS ??
        ""
    )
        .split(",")
        .map(
            (
                item
            ) =>
                item
                    .trim()
                    .toLowerCase()
        )
        .filter(Boolean);

function getBaseHost(): string {
    if (!HRIS_IMAGE_BASE_URL) {
        return "";
    }

    try {
        return new URL(
            HRIS_IMAGE_BASE_URL
        ).hostname.toLowerCase();
    } catch {
        return "";
    }
}

const allowedHosts =
    new Set(
        [
            ...configuredAllowedHosts,
            getBaseHost(),
        ].filter(Boolean)
    );

function resolveSource(
    source: string
): URL | null {
    const value =
        source.trim();

    if (!value) {
        return null;
    }

    if (
        /^https?:\/\//i.test(
            value
        )
    ) {
        try {
            return new URL(
                value
            );
        } catch {
            return null;
        }
    }

    if (!HRIS_IMAGE_BASE_URL) {
        return null;
    }

    try {
        const base =
            HRIS_IMAGE_BASE_URL.endsWith(
                "/"
            )
                ? HRIS_IMAGE_BASE_URL
                : `${HRIS_IMAGE_BASE_URL}/`;

        const clean =
            value.replace(
                /^\/+/,
                ""
            );

        return new URL(
            clean,
            base
        );
    } catch {
        return null;
    }
}

function isAllowed(
    url: URL
): boolean {
    if (
        url.protocol !==
            "http:" &&
        url.protocol !==
            "https:"
    ) {
        return false;
    }

    if (
        allowedHosts.size ===
        0
    ) {
        return false;
    }

    return allowedHosts.has(
        url.hostname.toLowerCase()
    );
}

export async function GET(
    request: NextRequest
) {
    const source =
        request.nextUrl
            .searchParams
            .get(
                "src"
            )
            ?.trim() ??
        "";

    if (!source) {
        return NextResponse.json(
            {
                error:
                    "src is required",
            },
            {
                status: 400,
            }
        );
    }

    const url =
        resolveSource(
            source
        );

    if (!url) {
        return NextResponse.json(
            {
                error:
                    "Unable to resolve HRIS image URL. Check HRIS_IMAGE_BASE_URL.",
            },
            {
                status: 400,
            }
        );
    }

    if (!isAllowed(url)) {
        return NextResponse.json(
            {
                error:
                    "HRIS image host is not allowed.",
            },
            {
                status: 403,
            }
        );
    }

    const headers =
        new Headers();

    headers.set(
        "Accept",
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    );

    if (
        HRIS_IMAGE_AUTH_TOKEN
    ) {
        headers.set(
            "Authorization",
            `Bearer ${HRIS_IMAGE_AUTH_TOKEN}`
        );
    }

    let upstream: Response;

    try {
        upstream =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    headers,

                    cache:
                        "no-store",

                    redirect:
                        "follow",
                }
            );
    } catch (
        reason
    ) {
        console.error(
            "HRIS image fetch failed:",
            reason
        );

        return NextResponse.json(
            {
                error:
                    "Unable to connect to HRIS image server.",
            },
            {
                status: 502,
            }
        );
    }

    if (!upstream.ok) {
        return NextResponse.json(
            {
                error:
                    "HRIS image server returned an error.",

                upstream_status:
                    upstream.status,
            },
            {
                status:
                    upstream.status ===
                    404
                        ? 404
                        : 502,
            }
        );
    }

    const contentType =
        (
            upstream.headers.get(
                "content-type"
            ) ??
            ""
        )
            .split(
                ";"
            )[0]
            .trim()
            .toLowerCase();

    if (
        !contentType.startsWith(
            "image/"
        )
    ) {
        return NextResponse.json(
            {
                error:
                    "HRIS response is not an image.",

                content_type:
                    contentType ||
                    "unknown",
            },
            {
                status: 502,
            }
        );
    }

    const bytes =
        await upstream.arrayBuffer();

    const response =
        new NextResponse(
            bytes,
            {
                status: 200,
            }
        );

    response.headers.set(
        "Content-Type",
        contentType
    );

    response.headers.set(
        "Cache-Control",
        "private, max-age=300"
    );

    response.headers.set(
        "X-Content-Type-Options",
        "nosniff"
    );

    return response;
}
