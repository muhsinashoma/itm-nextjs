

// // frontend/app/auth/page.tsx
// "use client";

// import {
//     useEffect,
//     useState,
// } from "react";

// import {
//     useRouter,
// } from "next/navigation";

// import {
//     ArrowRight,
//     Eye,
//     EyeOff,
//     Loader2,
//     Shield,
// } from "lucide-react";

// import {
//     authApi,
//     getToken,
// } from "@/lib/api";

// import {
//     Input,
// } from "@/components/ui/input";

// import {
//     Button,
// } from "@/components/ui/button";

// import {
//     Label,
// } from "@/components/ui/label";

// export default function AuthPage() {
//     const router = useRouter();

//     const [
//         username,
//         setUsername,
//     ] = useState("");

//     const [
//         password,
//         setPassword,
//     ] = useState("");

//     const [
//         showPassword,
//         setShowPassword,
//     ] = useState(false);

//     const [
//         error,
//         setError,
//     ] = useState("");

//     const [
//         loading,
//         setLoading,
//     ] = useState(false);

//     const [
//         checkingSession,
//         setCheckingSession,
//     ] = useState(true);

//     /* ======================================================
//        CHECK EXISTING SESSION

//        If a token already exists, do not blindly trust it.

//        Validate it using:
//        GET /api/v1/auth/me

//        If valid:
//        - refresh itm_user with current DB permissions
//        - redirect to dashboard

//        If invalid:
//        - api.ts handles HTTP 401 and clears authentication
//     ====================================================== */

//     useEffect(() => {
//         let cancelled =
//             false;

//         async function checkExistingSession() {
//             const token =
//                 getToken();

//             if (!token) {
//                 if (!cancelled) {
//                     setCheckingSession(
//                         false
//                     );
//                 }

//                 return;
//             }

//             try {
//                 const meResponse =
//                     await authApi.me();

//                 if (cancelled) {
//                     return;
//                 }

//                 localStorage.setItem(
//                     "itm_user",
//                     JSON.stringify(
//                         meResponse.data
//                     )
//                 );

//                 router.replace(
//                     "/dashboard"
//                 );
//             } catch {
//                 if (!cancelled) {
//                     setCheckingSession(
//                         false
//                     );
//                 }
//             }
//         }

//         void checkExistingSession();

//         return () => {
//             cancelled =
//                 true;
//         };
//     }, [
//         router,
//     ]);

//     /* ======================================================
//        LOGIN
//     ====================================================== */

//     const handleLogin =
//         async () => {
//             const normalizedUsername =
//                 username.trim();

//             if (
//                 !normalizedUsername ||
//                 !password
//             ) {
//                 setError(
//                     "Please enter username and password."
//                 );

//                 return;
//             }

//             setError("");
//             setLoading(true);

//             try {
//                 /*
//                  * Step 1
//                  *
//                  * Authenticate credentials and receive JWT.
//                  */
//                 const loginResponse =
//                     await authApi.login(
//                         normalizedUsername,
//                         password
//                     );

//                 const token =
//                     loginResponse.data.token;

//                 if (!token) {
//                     throw new Error(
//                         "Authentication token was not returned."
//                     );
//                 }

//                 /*
//                  * Step 2
//                  *
//                  * Save the token first because /auth/me
//                  * is a protected endpoint.
//                  */
//                 localStorage.setItem(
//                     "itm_token",
//                     token
//                 );

//                 /*
//                  * Step 3
//                  *
//                  * Resolve the authoritative current identity,
//                  * role and permissions from PostgreSQL.
//                  */
//                 const meResponse =
//                     await authApi.me();

//                 /*
//                  * Step 4
//                  *
//                  * Store the full authenticated profile.
//                  *
//                  * itm_user now contains:
//                  *
//                  * user_id
//                  * employee_id
//                  * username
//                  * full_name
//                  * email
//                  * user_type
//                  * role_code
//                  * role_name
//                  * account_status
//                  * must_change_password
//                  * permissions[]
//                  */
//                 localStorage.setItem(
//                     "itm_user",
//                     JSON.stringify(
//                         meResponse.data
//                     )
//                 );

//                 /*
//                  * Do not use router.push here.
//                  *
//                  * replace() prevents the browser Back button
//                  * from returning to the login form after login.
//                  */
//                 router.replace(
//                     "/dashboard"
//                 );
//             } catch (e) {
//                 /*
//                  * If login succeeded but /auth/me failed for
//                  * something other than HTTP 401, remove any
//                  * partially stored authentication information.
//                  */
//                 localStorage.removeItem(
//                     "itm_token"
//                 );

//                 localStorage.removeItem(
//                     "itm_user"
//                 );

//                 const message =
//                     e instanceof Error
//                         ? e.message
//                         : "Login failed.";

//                 setError(
//                     message
//                 );
//             } finally {
//                 setLoading(
//                     false
//                 );
//             }
//         };

//     /* ======================================================
//        SESSION CHECK SCREEN
//     ====================================================== */

//     if (checkingSession) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-3 text-slate-600">
//                     <Loader2 className="h-7 w-7 animate-spin" />

//                     <p className="text-sm font-medium">
//                         Checking your session...
//                     </p>
//                 </div>
//             </div>
//         );
//     }

//     /* ======================================================
//        LOGIN UI
//     ====================================================== */

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
//             <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
//                 {/* LEFT INFORMATION PANEL */}
//                 <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white relative overflow-hidden">
//                     <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />

//                     <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-1/3 translate-y-1/3" />

//                     <div className="relative z-10 text-center space-y-6">
//                         <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20">
//                             <Shield className="w-10 h-10 text-white" />
//                         </div>

//                         <div>
//                             <h2 className="text-3xl font-bold tracking-tight">
//                                 ITM Portal
//                             </h2>

//                             <p className="text-slate-400 mt-2 text-sm">
//                                 Information Technology
//                                 <br />
//                                 Management System
//                             </p>
//                         </div>

//                         <div className="grid grid-cols-2 gap-3 text-left">
//                             {[
//                                 {
//                                     n: "12,867",
//                                     l: "Active Assets",
//                                 },
//                                 {
//                                     n: "1,540+",
//                                     l: "Employees",
//                                 },
//                                 {
//                                     n: "99.9%",
//                                     l: "Uptime",
//                                 },
//                                 {
//                                     n: "24/7",
//                                     l: "Support",
//                                 },
//                             ].map(
//                                 (
//                                     item
//                                 ) => (
//                                     <div
//                                         key={
//                                             item.l
//                                         }
//                                         className="bg-white/5 border border-white/10 rounded-xl p-3"
//                                     >
//                                         <p className="text-xl font-bold">
//                                             {
//                                                 item.n
//                                             }
//                                         </p>

//                                         <p className="text-xs text-slate-400 mt-0.5">
//                                             {
//                                                 item.l
//                                             }
//                                         </p>
//                                     </div>
//                                 )
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 {/* LOGIN PANEL */}
//                 <div className="flex flex-col justify-center p-8 sm:p-10">
//                     <div className="md:hidden flex items-center gap-3 mb-8">
//                         <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
//                             <Shield className="w-5 h-5 text-white" />
//                         </div>

//                         <div>
//                             <p className="font-bold text-slate-900">
//                                 ITM Portal
//                             </p>

//                             <p className="text-xs text-slate-500">
//                                 Fiber@Home Ltd.
//                             </p>
//                         </div>
//                     </div>

//                     <div className="space-y-1 mb-8">
//                         <h1 className="text-2xl font-bold text-slate-900">
//                             Welcome back
//                         </h1>

//                         <p className="text-sm text-slate-500">
//                             Sign in to your account
//                         </p>
//                     </div>

//                     <div className="space-y-5">
//                         {/* USERNAME */}
//                         <div className="space-y-1.5">
//                             <Label className="text-sm font-medium text-slate-700">
//                                 Username or Email
//                             </Label>

//                             <Input
//                                 value={
//                                     username
//                                 }
//                                 onChange={(
//                                     e
//                                 ) =>
//                                     setUsername(
//                                         e.target
//                                             .value
//                                     )
//                                 }
//                                 onKeyDown={(
//                                     e
//                                 ) => {
//                                     if (
//                                         e.key ===
//                                         "Enter" &&
//                                         !loading
//                                     ) {
//                                         void handleLogin();
//                                     }
//                                 }}
//                                 type="text"
//                                 placeholder="username or email"
//                                 autoComplete="username"
//                                 disabled={
//                                     loading
//                                 }
//                                 className="h-11 border-slate-200 focus-visible:ring-slate-900"
//                             />
//                         </div>

//                         {/* PASSWORD */}
//                         <div className="space-y-1.5">
//                             <Label className="text-sm font-medium text-slate-700">
//                                 Password
//                             </Label>

//                             <div className="relative">
//                                 <Input
//                                     value={
//                                         password
//                                     }
//                                     onChange={(
//                                         e
//                                     ) =>
//                                         setPassword(
//                                             e
//                                                 .target
//                                                 .value
//                                         )
//                                     }
//                                     onKeyDown={(
//                                         e
//                                     ) => {
//                                         if (
//                                             e.key ===
//                                             "Enter" &&
//                                             !loading
//                                         ) {
//                                             void handleLogin();
//                                         }
//                                     }}
//                                     type={
//                                         showPassword
//                                             ? "text"
//                                             : "password"
//                                     }
//                                     placeholder="Enter password"
//                                     autoComplete="current-password"
//                                     disabled={
//                                         loading
//                                     }
//                                     className="h-11 pr-10 border-slate-200 focus-visible:ring-slate-900"
//                                 />

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setShowPassword(
//                                             (
//                                                 current
//                                             ) =>
//                                                 !current
//                                         )
//                                     }
//                                     disabled={
//                                         loading
//                                     }
//                                     aria-label={
//                                         showPassword
//                                             ? "Hide password"
//                                             : "Show password"
//                                     }
//                                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
//                                 >
//                                     {showPassword ? (
//                                         <EyeOff
//                                             size={
//                                                 16
//                                             }
//                                         />
//                                     ) : (
//                                         <Eye
//                                             size={
//                                                 16
//                                             }
//                                         />
//                                     )}
//                                 </button>
//                             </div>
//                         </div>

//                         {/* ERROR */}
//                         {error && (
//                             <div
//                                 role="alert"
//                                 className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg"
//                             >
//                                 {
//                                     error
//                                 }
//                             </div>
//                         )}

//                         {/* SUBMIT */}
//                         <Button
//                             type="button"
//                             onClick={() =>
//                                 void handleLogin()
//                             }
//                             disabled={
//                                 loading
//                             }
//                             className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl"
//                         >
//                             {loading ? (
//                                 <>
//                                     <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                                     Signing in...
//                                 </>
//                             ) : (
//                                 <span className="flex items-center gap-2">
//                                     Sign in

//                                     <ArrowRight className="h-4 w-4" />
//                                 </span>
//                             )}
//                         </Button>
//                     </div>

//                     <p className="text-center text-xs text-slate-400 mt-8">
//                         © 2026 Fiber@Home Ltd. · All rights reserved
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// }



// frontend/app/auth/page.tsx
"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    Shield,
} from "lucide-react";

import {
    authApi,
    clearAuthStorage,
    getToken,
} from "@/lib/api";

import {
    Input,
} from "@/components/ui/input";

import {
    Button,
} from "@/components/ui/button";

import {
    Label,
} from "@/components/ui/label";

/* ======================================================
   DASHBOARD DESTINATION

   Final access model:

   ROOT
   - panel.staff.access
   - dashboard.self.access
   → Main dashboard

   IT_ADMIN
   - panel.staff.access
   - dashboard.self.access
   → Main dashboard

   IT_PERSONNEL
   - panel.staff.access
   → Main dashboard

   GENERAL_USER
   - dashboard.self.access
   → Own Employee Dashboard

   IMPORTANT:
   panel.staff.access must be checked first because
   ROOT and IT_ADMIN also have dashboard.self.access.
====================================================== */

function getDashboardPath(
    permissions: string[]
): string | null {
    if (
        permissions.includes(
            "panel.staff.access"
        )
    ) {
        return "/dashboard";
    }

    if (
        permissions.includes(
            "dashboard.self.access"
        )
    ) {
        return "/dashboard/user";
    }

    return null;
}

export default function AuthPage() {
    const router =
        useRouter();

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        checkingSession,
        setCheckingSession,
    ] = useState(true);

    /* ======================================================
       CHECK EXISTING SESSION

       If a JWT already exists:

       1. Validate token using /auth/me
       2. Refresh itm_user from PostgreSQL
       3. Resolve destination using permissions
       4. Redirect to correct dashboard

       We do not trust old localStorage user permissions.
       /auth/me is the authority.
    ====================================================== */

    useEffect(() => {
        let cancelled =
            false;

        async function checkExistingSession() {
            const token =
                getToken();

            if (!token) {
                if (!cancelled) {
                    setCheckingSession(
                        false
                    );
                }

                return;
            }

            try {
                const meResponse =
                    await authApi.me();

                if (cancelled) {
                    return;
                }

                /*
                 * Save the latest authoritative
                 * user/role/permission information.
                 */
                localStorage.setItem(
                    "itm_user",
                    JSON.stringify(
                        meResponse.data
                    )
                );

                const destination =
                    getDashboardPath(
                        meResponse.data
                            .permissions
                    );

                /*
                 * A valid account without any
                 * dashboard permission should not
                 * remain authenticated inside the UI.
                 */
                if (!destination) {
                    clearAuthStorage();

                    setError(
                        "Your account does not have dashboard access. Please contact the administrator."
                    );

                    setCheckingSession(
                        false
                    );

                    return;
                }

                router.replace(
                    destination
                );
            } catch {
                /*
                 * api.ts automatically clears auth
                 * when /auth/me returns HTTP 401.
                 *
                 * For any other failure, allow the
                 * login form to appear.
                 */
                if (!cancelled) {
                    setCheckingSession(
                        false
                    );
                }
            }
        }

        void checkExistingSession();

        return () => {
            cancelled =
                true;
        };
    }, [
        router,
    ]);

    /* ======================================================
       LOGIN
    ====================================================== */

    const handleLogin =
        async () => {
            const normalizedUsername =
                username.trim();

            if (
                !normalizedUsername ||
                !password
            ) {
                setError(
                    "Please enter username and password."
                );

                return;
            }

            setError("");
            setLoading(true);

            try {
                /* ==================================================
                   STEP 1
                   Authenticate username/password.
                ================================================== */

                const loginResponse =
                    await authApi.login(
                        normalizedUsername,
                        password
                    );

                const token =
                    loginResponse.data
                        .token;

                if (!token) {
                    throw new Error(
                        "Authentication token was not returned."
                    );
                }

                /* ==================================================
                   STEP 2
                   Store JWT.

                   /auth/me is protected, so the token must
                   exist before calling it.
                ================================================== */

                localStorage.setItem(
                    "itm_token",
                    token
                );

                /* ==================================================
                   STEP 3
                   Get authoritative user identity,
                   role and permissions from PostgreSQL.
                ================================================== */

                const meResponse =
                    await authApi.me();

                /* ==================================================
                   STEP 4
                   Store complete authenticated profile.

                   itm_user contains:

                   user_id
                   employee_id
                   username
                   full_name
                   email
                   user_type
                   role_code
                   role_name
                   account_status
                   must_change_password
                   permissions[]
                ================================================== */

                localStorage.setItem(
                    "itm_user",
                    JSON.stringify(
                        meResponse.data
                    )
                );

                /* ==================================================
                   STEP 5
                   Resolve destination from permissions.

                   ROOT
                   → /dashboard

                   IT_ADMIN
                   → /dashboard

                   IT_PERSONNEL
                   → /dashboard

                   GENERAL_USER
                   → /dashboard/user
                ================================================== */

                const destination =
                    getDashboardPath(
                        meResponse.data
                            .permissions
                    );

                if (!destination) {
                    throw new Error(
                        "Your account does not have dashboard access. Please contact the administrator."
                    );
                }

                /*
                 * replace() prevents Back from returning
                 * to the login page after successful login.
                 */
                router.replace(
                    destination
                );
            } catch (e) {
                /*
                 * Prevent partial authentication state.
                 *
                 * Example:
                 * login succeeds but /auth/me fails.
                 */
                clearAuthStorage();

                const message =
                    e instanceof Error
                        ? e.message
                        : "Login failed.";

                setError(
                    message
                );
            } finally {
                setLoading(
                    false
                );
            }
        };

    /* ======================================================
       SESSION CHECK SCREEN
    ====================================================== */

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-600">
                    <Loader2 className="h-7 w-7 animate-spin" />

                    <p className="text-sm font-medium">
                        Checking your session...
                    </p>
                </div>
            </div>
        );
    }

    /* ======================================================
       LOGIN UI
    ====================================================== */

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                {/* ==================================================
                    LEFT INFORMATION PANEL
                ================================================== */}

                <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />

                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-1/3 translate-y-1/3" />

                    <div className="relative z-10 text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20">
                            <Shield className="w-10 h-10 text-white" />
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                ITM Portal
                            </h2>

                            <p className="text-slate-400 mt-2 text-sm">
                                Information Technology
                                <br />
                                Management System
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left">
                            {[
                                {
                                    n: "12,867",
                                    l: "Active Assets",
                                },
                                {
                                    n: "1,540+",
                                    l: "Employees",
                                },
                                {
                                    n: "99.9%",
                                    l: "Uptime",
                                },
                                {
                                    n: "24/7",
                                    l: "Support",
                                },
                            ].map(
                                (
                                    item
                                ) => (
                                    <div
                                        key={
                                            item.l
                                        }
                                        className="bg-white/5 border border-white/10 rounded-xl p-3"
                                    >
                                        <p className="text-xl font-bold">
                                            {
                                                item.n
                                            }
                                        </p>

                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {
                                                item.l
                                            }
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    LOGIN PANEL
                ================================================== */}

                <div className="flex flex-col justify-center p-8 sm:p-10">
                    {/* MOBILE LOGO */}

                    <div className="md:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>

                        <div>
                            <p className="font-bold text-slate-900">
                                ITM Portal
                            </p>

                            <p className="text-xs text-slate-500">
                                Fiber@Home Ltd.
                            </p>
                        </div>
                    </div>

                    {/* TITLE */}

                    <div className="space-y-1 mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome back
                        </h1>

                        <p className="text-sm text-slate-500">
                            Sign in to your account
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* ==========================================
                            USERNAME
                        ========================================== */}

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">
                                Username or Email
                            </Label>

                            <Input
                                value={
                                    username
                                }
                                onChange={(
                                    e
                                ) =>
                                    setUsername(
                                        e.target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    e
                                ) => {
                                    if (
                                        e.key ===
                                        "Enter" &&
                                        !loading
                                    ) {
                                        void handleLogin();
                                    }
                                }}
                                type="text"
                                placeholder="username or email"
                                autoComplete="username"
                                disabled={
                                    loading
                                }
                                className="h-11 border-slate-200 focus-visible:ring-slate-900"
                            />
                        </div>

                        {/* ==========================================
                            PASSWORD
                        ========================================== */}

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">
                                Password
                            </Label>

                            <div className="relative">
                                <Input
                                    value={
                                        password
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setPassword(
                                            e.target
                                                .value
                                        )
                                    }
                                    onKeyDown={(
                                        e
                                    ) => {
                                        if (
                                            e.key ===
                                            "Enter" &&
                                            !loading
                                        ) {
                                            void handleLogin();
                                        }
                                    }}
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    disabled={
                                        loading
                                    }
                                    className="h-11 pr-10 border-slate-200 focus-visible:ring-slate-900"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (
                                                current
                                            ) =>
                                                !current
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    {showPassword ? (
                                        <EyeOff
                                            size={
                                                16
                                            }
                                        />
                                    ) : (
                                        <Eye
                                            size={
                                                16
                                            }
                                        />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ==========================================
                            ERROR
                        ========================================== */}

                        {error && (
                            <div
                                role="alert"
                                className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg"
                            >
                                {
                                    error
                                }
                            </div>
                        )}

                        {/* ==========================================
                            SUBMIT
                        ========================================== */}

                        <Button
                            type="button"
                            onClick={() =>
                                void handleLogin()
                            }
                            disabled={
                                loading
                            }
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />

                                    Signing in...
                                </>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign in

                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* FOOTER */}

                    <p className="text-center text-xs text-slate-400 mt-8">
                        © 2026 Fiber@Home Ltd. · All rights reserved
                    </p>
                </div>
            </div>
        </div>
    );
}