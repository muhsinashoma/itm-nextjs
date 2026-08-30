// //frontend/app/dashboard/operations/create_tt/page.tsx

// "use client";

// import {
//     ChangeEvent,
//     FormEvent,
//     useEffect,
//     useState,
// } from "react";

// import { useRouter } from "next/navigation";

// import {
//     api,
//     ownDashboardApi,
//     ticketApi,
//     OwnEmployeeProfile,
// } from "@/lib/api";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";

// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";

// import {
//     User,
//     Building2,
//     BriefcaseBusiness,
//     Phone,
//     Mail,
//     Ticket,
//     FileText,
//     Paperclip,
//     Loader2,
//     ArrowLeft,
//     Send,
//     CheckCircle2,
// } from "lucide-react";

// /* ============================================================
//    TYPES
// ============================================================ */

// interface FaultType {
//     id: number;
//     fault_name: string;
//     fault_register?: string | null;
//     fault_desc?: string | null;
//     status?: number | null;
// }

// interface FaultTypesResponse {
//     success: boolean;
//     data: FaultType[];
// }

// interface CreateTicketResponse {
//     success: boolean;
//     data: {
//         id: number;
//         tt_no: number;
//     };
// }

// /* ============================================================
//    PAGE
// ============================================================ */

// export default function CreateTTPage() {
//     const router = useRouter();

//     const [faultTypes, setFaultTypes] = useState<FaultType[]>([]);
//     const [selectedFaultType, setSelectedFaultType] =
//         useState<FaultType | null>(null);

//     const [faultSearch, setFaultSearch] = useState("");
//     const [faultDropdownOpen, setFaultDropdownOpen] = useState(false);
//     const [loadingFaultTypes, setLoadingFaultTypes] = useState(true);

//     /* ========================================================
//        EMPLOYEE
//     ======================================================== */

//     const [
//         employee,
//         setEmployee,
//     ] = useState<OwnEmployeeProfile | null>(
//         null
//     );

//     const [
//         loadingEmployee,
//         setLoadingEmployee,
//     ] = useState(true);

//     /* ========================================================
//        FAULT TYPES
//     ======================================================== */

//     const [
//         faults,
//         setFaults,
//     ] = useState<FaultType[]>([]);

//     const [
//         loadingFaults,
//         setLoadingFaults,
//     ] = useState(true);

//     /* ========================================================
//        FORM
//     ======================================================== */

//     const [
//         selectedFault,
//         setSelectedFault,
//     ] = useState("");

//     const [
//         description,
//         setDescription,
//     ] = useState("");

//     const [
//         attachment,
//         setAttachment,
//     ] = useState<File | null>(null);

//     /* ========================================================
//        UI STATE
//     ======================================================== */

//     const [
//         submitting,
//         setSubmitting,
//     ] = useState(false);

//     const [
//         error,
//         setError,
//     ] = useState("");

//     const [
//         success,
//         setSuccess,
//     ] = useState("");

//     /* ========================================================
//        LOAD AUTHENTICATED EMPLOYEE

//        GET /api/v1/user/dashboard

//        employee_id is resolved by backend from JWT.
//        We do NOT send employee_id from the browser.
//     ======================================================== */

//     useEffect(() => {
//         let mounted = true;

//         async function loadEmployee() {
//             try {
//                 setLoadingEmployee(true);
//                 setError("");

//                 const response =
//                     await ownDashboardApi.dashboard();

//                 if (!mounted) {
//                     return;
//                 }

//                 if (
//                     !response ||
//                     !response.data ||
//                     !response.data.employee
//                 ) {
//                     throw new Error(
//                         "Employee information was not found."
//                     );
//                 }

//                 setEmployee(
//                     response.data.employee
//                 );
//             } catch (
//             reason: unknown
//             ) {
//                 console.error(
//                     "Unable to load employee information:",
//                     reason
//                 );

//                 if (!mounted) {
//                     return;
//                 }

//                 setEmployee(null);

//                 setError(
//                     reason instanceof Error
//                         ? reason.message
//                         : "Unable to load your employee information."
//                 );
//             } finally {
//                 if (mounted) {
//                     setLoadingEmployee(false);
//                 }
//             }
//         }

//         void loadEmployee();

//         return () => {
//             mounted = false;
//         };
//     }, []);

//     /* ========================================================
//        LOAD FAULT TYPES

//        IMPORTANT:
//        This expects:

//        GET /api/v1/tickets/fault-types

//        Backend response:

//        {
//            "success": true,
//            "data": [...]
//        }
//     ======================================================== */

//     useEffect(() => {
//         let mounted = true;

//         async function loadFaultTypes() {
//             try {
//                 setLoadingFaults(true);

//                 /*
//                  * Do not overwrite the employee error here.
//                  */
//                 const response =
//                     await ticketApi.faultTypes();

//                 if (!mounted) {
//                     return;
//                 }

//                 const list =
//                     response?.data ?? [];

//                 /*
//                  * Only active fault types.
//                  *
//                  * If backend does not send status,
//                  * the item remains selectable.
//                  */
//                 const activeFaults =
//                     list.filter(
//                         (fault) =>
//                             fault.status ===
//                             undefined ||
//                             fault.status ===
//                             null ||
//                             fault.status ===
//                             1
//                     );

//                 /*
//                  * Remove duplicate IDs.
//                  */
//                 const uniqueFaults =
//                     Array.from(
//                         new Map(
//                             activeFaults.map(
//                                 (fault) => [
//                                     fault.id,
//                                     fault,
//                                 ]
//                             )
//                         ).values()
//                     );

//                 setFaults(
//                     uniqueFaults
//                 );
//             } catch (
//             reason: unknown
//             ) {
//                 console.error(
//                     "Unable to load fault types:",
//                     reason
//                 );

//                 if (!mounted) {
//                     return;
//                 }

//                 setFaults([]);

//                 setError(
//                     reason instanceof Error
//                         ? reason.message
//                         : "Unable to load fault types."
//                 );
//             } finally {
//                 if (mounted) {
//                     setLoadingFaults(false);
//                 }
//             }
//         }

//         void loadFaultTypes();

//         return () => {
//             mounted = false;
//         };
//     }, []);

//     /* ========================================================
//        ATTACHMENT

//        Current backend TicketHandler.Create() accepts JSON,
//        not multipart/form-data.

//        Therefore we validate/select the file here, but do not
//        send it to the current Create API yet.
//     ======================================================== */

//     function handleAttachment(
//         event: ChangeEvent<HTMLInputElement>
//     ) {
//         const file =
//             event.target.files?.[0] ??
//             null;

//         if (!file) {
//             setAttachment(null);
//             return;
//         }

//         const maxFileSize =
//             5 * 1024 * 1024;

//         if (
//             file.size >
//             maxFileSize
//         ) {
//             setAttachment(null);

//             event.target.value = "";

//             setError(
//                 "Attachment size must not exceed 5 MB."
//             );

//             return;
//         }

//         setError("");

//         setAttachment(file);
//     }

//     /* ========================================================
//        SUBMIT

//        Current backend expects:

//        {
//            reason_of_problem,
//            client_name,
//            department,
//            phone,
//            email,
//            fault_type
//        }

//        employee_id is NOT sent.

//        Backend gets it from JWT.
//     ======================================================== */

//     async function handleSubmit(
//         event: FormEvent<HTMLFormElement>
//     ) {
//         event.preventDefault();

//         setError("");
//         setSuccess("");

//         /* -----------------------------------------------
//            Employee validation
//         ------------------------------------------------ */

//         if (!employee) {
//             setError(
//                 "Unable to identify the authenticated employee."
//             );

//             return;
//         }

//         /* -----------------------------------------------
//            Fault validation
//         ------------------------------------------------ */

//         if (!selectedFault) {
//             setError(
//                 "Please select a fault type."
//             );

//             return;
//         }

//         /* -----------------------------------------------
//            Description validation
//         ------------------------------------------------ */

//         const cleanDescription =
//             description.trim();

//         if (!cleanDescription) {
//             setError(
//                 "Please enter a description."
//             );

//             return;
//         }

//         if (
//             cleanDescription.length <
//             3
//         ) {
//             setError(
//                 "Description must contain at least 3 characters."
//             );

//             return;
//         }

//         /* -----------------------------------------------
//            Submit
//         ------------------------------------------------ */

//         try {
//             setSubmitting(true);

//             const faultType =
//                 Number(
//                     selectedFault
//                 );

//             if (
//                 !Number.isInteger(
//                     faultType
//                 ) ||
//                 faultType <= 0
//             ) {
//                 throw new Error(
//                     "Invalid fault type."
//                 );
//             }

//             /*
//              * IMPORTANT:
//              *
//              * employee_id is intentionally NOT included.
//              *
//              * The Go backend does:
//              *
//              * empID := c.GetString("employee_id")
//              *
//              * and therefore uses the authenticated JWT.
//              */
//             const payload = {
//                 reason_of_problem:
//                     cleanDescription,

//                 client_name:
//                     employee.employee_name,

//                 department:
//                     employee.department ||
//                     null,

//                 phone:
//                     employee.official_cell ||
//                     employee.personal_cell ||
//                     null,

//                 email:
//                     employee.official_email ||
//                     employee.email ||
//                     null,

//                 fault_type:
//                     faultType,
//             };

//             const response =
//                 await ticketApi.create(
//                     payload
//                 );

//             const ticket =
//                 response?.data;

//             setSuccess(
//                 ticket?.tt_no
//                     ? `Trouble ticket ${ticket.tt_no} created successfully.`
//                     : "Trouble ticket created successfully."
//             );

//             /* -------------------------------------------
//                Reset form
//             -------------------------------------------- */

//             setSelectedFault("");

//             setDescription("");

//             setAttachment(null);

//             const fileInput =
//                 document.getElementById(
//                     "attachment"
//                 ) as HTMLInputElement | null;

//             if (fileInput) {
//                 fileInput.value = "";
//             }

//             /* -------------------------------------------
//                Redirect
//             -------------------------------------------- */

//             window.setTimeout(() => {
//                 router.push(
//                     "/dashboard/operations/trouble-tickets"
//                 );
//             }, 1200);
//         } catch (
//         reason: unknown
//         ) {
//             console.error(
//                 "Create ticket error:",
//                 reason
//             );

//             setError(
//                 reason instanceof Error
//                     ? reason.message
//                     : "Failed to create trouble ticket."
//             );
//         } finally {
//             setSubmitting(false);
//         }
//     }

//     /* ========================================================
//        LOADING
//     ======================================================== */

//     if (loadingEmployee) {
//         return (
//             <div className="flex min-h-screen items-center justify-center bg-slate-50">
//                 <div className="flex items-center gap-3 text-sm text-slate-600">
//                     <Loader2 className="h-5 w-5 animate-spin" />

//                     <span>
//                         Loading your employee information...
//                     </span>
//                 </div>
//             </div>
//         );
//     }

//     /* ========================================================
//        PAGE
//     ======================================================== */

//     return (
//         <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
//             <div className="mx-auto max-w-7xl space-y-6">

//                 {/* ==================================================
//                     HEADER
//                 ================================================== */}

//                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                     <div>
//                         <div className="flex items-center gap-2 text-sm text-slate-500">
//                             <span>
//                                 Dashboard
//                             </span>

//                             <span>
//                                 /
//                             </span>

//                             <span>
//                                 Operations
//                             </span>

//                             <span>
//                                 /
//                             </span>

//                             <span className="font-medium text-blue-600">
//                                 Create Trouble Ticket
//                             </span>
//                         </div>

//                         <div className="mt-2 flex items-center gap-3">
//                             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
//                                 <Ticket className="h-5 w-5" />
//                             </div>

//                             <div>
//                                 <h1 className="text-2xl font-bold tracking-tight text-slate-900">
//                                     Create Trouble Ticket
//                                 </h1>

//                                 <p className="text-sm text-slate-500">
//                                     Submit a new IT support request
//                                 </p>
//                             </div>
//                         </div>
//                     </div>

//                     <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() =>
//                             router.back()
//                         }
//                         className="gap-2"
//                         disabled={
//                             submitting
//                         }
//                     >
//                         <ArrowLeft className="h-4 w-4" />

//                         Back
//                     </Button>
//                 </div>

//                 {/* ==================================================
//                     ERROR
//                 ================================================== */}

//                 {error && (
//                     <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//                         <span className="font-semibold">
//                             Error:
//                         </span>

//                         <span>
//                             {error}
//                         </span>
//                     </div>
//                 )}

//                 {/* ==================================================
//                     SUCCESS
//                 ================================================== */}

//                 {success && (
//                     <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
//                         <CheckCircle2 className="h-5 w-5" />

//                         <span>
//                             {success}
//                         </span>
//                     </div>
//                 )}

//                 <form
//                     onSubmit={
//                         handleSubmit
//                     }
//                 >
//                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

//                         {/* ==================================================
//                             REQUESTER INFORMATION
//                         ================================================== */}

//                         <Card className="border-slate-200 shadow-sm lg:col-span-1">
//                             <CardHeader className="border-b bg-slate-50/70">
//                                 <CardTitle className="flex items-center gap-2 text-base">
//                                     <User className="h-5 w-5 text-blue-600" />

//                                     Requester Information
//                                 </CardTitle>

//                                 <CardDescription>
//                                     Automatically loaded from your authenticated account
//                                 </CardDescription>
//                             </CardHeader>

//                             <CardContent className="space-y-5 pt-6">

//                                 {/* Name */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Employee Name
//                                     </Label>

//                                     <div className="relative">
//                                         <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.employee_name ??
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Employee ID */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Employee ID
//                                     </Label>

//                                     <div className="relative">
//                                         <Ticket className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.employee_id ??
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Designation */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Designation
//                                     </Label>

//                                     <div className="relative">
//                                         <BriefcaseBusiness className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.designation ??
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Department */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Department
//                                     </Label>

//                                     <div className="relative">
//                                         <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.department ??
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Work Field */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Work Field
//                                     </Label>

//                                     <div className="relative">
//                                         <BriefcaseBusiness className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.work_field ??
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Phone */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Phone
//                                     </Label>

//                                     <div className="relative">
//                                         <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.official_cell ||
//                                                 employee?.personal_cell ||
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Email */}

//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                         Email
//                                     </Label>

//                                     <div className="relative">
//                                         <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

//                                         <Input
//                                             value={
//                                                 employee?.official_email ||
//                                                 employee?.email ||
//                                                 ""
//                                             }
//                                             readOnly
//                                             className="bg-slate-50 pl-9"
//                                         />
//                                     </div>
//                                 </div>

//                             </CardContent>
//                         </Card>

//                         {/* ==================================================
//                             TROUBLE TICKET
//                         ================================================== */}

//                         <Card className="border-slate-200 shadow-sm lg:col-span-2">
//                             <CardHeader className="border-b bg-slate-50/70">
//                                 <CardTitle className="flex items-center gap-2 text-base">
//                                     <FileText className="h-5 w-5 text-blue-600" />

//                                     Trouble Ticket Details
//                                 </CardTitle>

//                                 <CardDescription>
//                                     Provide the details of the issue
//                                 </CardDescription>
//                             </CardHeader>

//                             <CardContent className="space-y-6 pt-6">

//                                 {/* ==================================================
//                                     FAULT TYPE
//                                 ================================================== */}

//                                 <div className="space-y-2">
//                                     <Label className="text-sm font-medium">
//                                         Fault Type

//                                         <span className="ml-1 text-red-500">
//                                             *
//                                         </span>
//                                     </Label>

//                                     <Select
//                                         value={
//                                             selectedFault
//                                         }
//                                         onValueChange={
//                                             setSelectedFault
//                                         }
//                                         disabled={
//                                             loadingFaults ||
//                                             submitting
//                                         }
//                                     >
//                                         <SelectTrigger className="h-11">
//                                             <SelectValue
//                                                 placeholder={
//                                                     loadingFaults
//                                                         ? "Loading fault types..."
//                                                         : faults.length ===
//                                                             0
//                                                             ? "No fault types available"
//                                                             : "Select a fault type"
//                                                 }
//                                             />
//                                         </SelectTrigger>

//                                         <SelectContent>
//                                             {faults.map(
//                                                 (
//                                                     fault
//                                                 ) => (
//                                                     <SelectItem
//                                                         key={
//                                                             fault.id
//                                                         }
//                                                         value={String(
//                                                             fault.id
//                                                         )}
//                                                     >
//                                                         {
//                                                             fault.fault_name
//                                                         }
//                                                     </SelectItem>
//                                                 )
//                                             )}
//                                         </SelectContent>
//                                     </Select>

//                                     {/* Selected fault description */}

//                                     {selectedFault && (
//                                         <p className="text-xs leading-5 text-slate-500">
//                                             {
//                                                 faults.find(
//                                                     (
//                                                         fault
//                                                     ) =>
//                                                         String(
//                                                             fault.id
//                                                         ) ===
//                                                         selectedFault
//                                                 )?.fault_desc
//                                             }
//                                         </p>
//                                     )}
//                                 </div>

//                                 {/* ==================================================
//                                     DESCRIPTION
//                                 ================================================== */}

//                                 <div className="space-y-2">
//                                     <Label className="text-sm font-medium">
//                                         Issue Description

//                                         <span className="ml-1 text-red-500">
//                                             *
//                                         </span>
//                                     </Label>

//                                     <textarea
//                                         value={
//                                             description
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setDescription(
//                                                 event.target.value
//                                             )
//                                         }
//                                         disabled={
//                                             submitting
//                                         }
//                                         placeholder="Please describe the issue in detail..."
//                                         rows={
//                                             8
//                                         }
//                                         className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
//                                     />

//                                     <div className="flex justify-end">
//                                         <span className="text-xs text-slate-400">
//                                             {
//                                                 description.length
//                                             }{" "}
//                                             characters
//                                         </span>
//                                     </div>
//                                 </div>

//                                 {/* ==================================================
//                                     ATTACHMENT
//                                 ================================================== */}

//                                 <div className="space-y-2">
//                                     <Label className="text-sm font-medium">
//                                         Attachment
//                                     </Label>

//                                     <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
//                                         <div className="flex flex-col items-center justify-center gap-2 text-center">

//                                             <Paperclip className="h-7 w-7 text-slate-400" />

//                                             <div>
//                                                 <p className="text-sm font-medium text-slate-700">
//                                                     Attach supporting file
//                                                 </p>

//                                                 <p className="mt-1 text-xs text-slate-500">
//                                                     Maximum file size: 5 MB
//                                                 </p>
//                                             </div>

//                                             <Input
//                                                 id="attachment"
//                                                 type="file"
//                                                 onChange={
//                                                     handleAttachment
//                                                 }
//                                                 disabled={
//                                                     submitting
//                                                 }
//                                                 className="mt-2 max-w-sm cursor-pointer bg-white"
//                                             />

//                                             {attachment && (
//                                                 <p className="text-xs font-medium text-blue-600">
//                                                     Selected:{" "}
//                                                     {
//                                                         attachment.name
//                                                     }
//                                                 </p>
//                                             )}

//                                         </div>
//                                     </div>

//                                     <p className="text-[11px] text-slate-400">
//                                         File upload will be connected when the backend multipart upload endpoint is enabled.
//                                     </p>
//                                 </div>

//                                 {/* ==================================================
//                                     ACTIONS
//                                 ================================================== */}

//                                 <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

//                                     <Button
//                                         type="button"
//                                         variant="outline"
//                                         onClick={() =>
//                                             router.back()
//                                         }
//                                         disabled={
//                                             submitting
//                                         }
//                                     >
//                                         Cancel
//                                     </Button>

//                                     <Button
//                                         type="submit"
//                                         disabled={
//                                             submitting ||
//                                             loadingFaults ||
//                                             !employee ||
//                                             faults.length ===
//                                             0
//                                         }
//                                         className="min-w-[160px] gap-2 bg-blue-600 hover:bg-blue-700"
//                                     >
//                                         {submitting ? (
//                                             <>
//                                                 <Loader2 className="h-4 w-4 animate-spin" />

//                                                 Submitting...
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Send className="h-4 w-4" />

//                                                 Submit Ticket
//                                             </>
//                                         )}
//                                     </Button>

//                                 </div>

//                             </CardContent>
//                         </Card>

//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


"use client";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    FileText,
    Loader2,
    Mail,
    Paperclip,
    Phone,
    Search,
    User,
    X,
} from "lucide-react";

import {
    ownDashboardApi,
    ticketApi,
    type FaultType,
    type OwnEmployeeProfile,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


/* ============================================================
   TYPES
============================================================ */

type FormError = string;


/* ============================================================
   HELPERS
============================================================ */

function displayValue(
    value: string | null | undefined
): string {
    if (!value || !value.trim()) {
        return "-";
    }

    return value;
}


function getInitials(
    name: string
): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "IT";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* ============================================================
   COMPONENT
============================================================ */

export default function CreateTTPage() {
    const router = useRouter();

    /* --------------------------------------------------------
       EMPLOYEE
    -------------------------------------------------------- */

    const [employee, setEmployee] =
        useState<OwnEmployeeProfile | null>(
            null
        );

    const [
        employeeLoading,
        setEmployeeLoading,
    ] = useState(true);

    const [
        employeeError,
        setEmployeeError,
    ] = useState<FormError>("");


    /* --------------------------------------------------------
       FAULT TYPES
    -------------------------------------------------------- */

    const [faultTypes, setFaultTypes] =
        useState<FaultType[]>([]);

    const [
        faultTypesLoading,
        setFaultTypesLoading,
    ] = useState(true);

    const [
        faultTypesError,
        setFaultTypesError,
    ] = useState<FormError>("");

    const [
        selectedFaultType,
        setSelectedFaultType,
    ] = useState<FaultType | null>(null);

    const [
        faultSearch,
        setFaultSearch,
    ] = useState("");

    const [
        faultDropdownOpen,
        setFaultDropdownOpen,
    ] = useState(false);

    const faultDropdownRef =
        useRef<HTMLDivElement | null>(
            null
        );


    /* --------------------------------------------------------
       FORM
    -------------------------------------------------------- */

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        attachment,
        setAttachment,
    ] = useState<File | null>(null);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        submitError,
        setSubmitError,
    ] = useState("");

    const [
        submitSuccess,
        setSubmitSuccess,
    ] = useState("");


    /* ========================================================
       LOAD AUTHENTICATED EMPLOYEE
    ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadEmployee() {
            try {
                setEmployeeLoading(true);
                setEmployeeError("");

                const response =
                    await ownDashboardApi.dashboard();

                if (!mounted) {
                    return;
                }

                setEmployee(
                    response.data.employee
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Unable to load employee information:",
                    error
                );

                setEmployee(null);

                setEmployeeError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load your employee information."
                );
            } finally {
                if (mounted) {
                    setEmployeeLoading(
                        false
                    );
                }
            }
        }

        void loadEmployee();

        return () => {
            mounted = false;
        };
    }, []);


    /* ========================================================
       LOAD FAULT TYPES
    ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadFaultTypes() {
            try {
                setFaultTypesLoading(
                    true
                );

                setFaultTypesError("");

                const response =
                    await ticketApi.faultTypes();

                if (!mounted) {
                    return;
                }

                const activeTypes =
                    (
                        response.data ??
                        []
                    )
                        .filter(
                            (item) =>
                                item.status ===
                                undefined ||
                                item.status ===
                                null ||
                                item.status ===
                                1
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                a.fault_name.localeCompare(
                                    b.fault_name
                                )
                        );

                setFaultTypes(
                    activeTypes
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Unable to load fault types:",
                    error
                );

                setFaultTypes([]);

                setFaultTypesError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load fault types."
                );
            } finally {
                if (mounted) {
                    setFaultTypesLoading(
                        false
                    );
                }
            }
        }

        void loadFaultTypes();

        return () => {
            mounted = false;
        };
    }, []);


    /* ========================================================
       CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    ======================================================== */

    useEffect(() => {
        function handleOutsideClick(
            event: MouseEvent
        ) {
            if (
                !faultDropdownRef.current
            ) {
                return;
            }

            if (
                !faultDropdownRef.current.contains(
                    event.target as Node
                )
            ) {
                setFaultDropdownOpen(
                    false
                );
            }
        }

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);


    /* ========================================================
       FILTER FAULT TYPES
    ======================================================== */

    const filteredFaultTypes =
        useMemo(() => {
            const search =
                faultSearch
                    .trim()
                    .toLowerCase();

            if (!search) {
                return faultTypes;
            }

            return faultTypes.filter(
                (fault) => {
                    return (
                        fault.fault_name
                            .toLowerCase()
                            .includes(
                                search
                            ) ||
                        (
                            fault.fault_desc ??
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            ) ||
                        (
                            fault.fault_register ??
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            )
                    );
                }
            );
        }, [
            faultTypes,
            faultSearch,
        ]);


    /* ========================================================
       FILE CHANGE
    ======================================================== */

    const handleAttachmentChange =
        (
            event: React.ChangeEvent<HTMLInputElement>
        ) => {
            const file =
                event.target.files?.[0] ??
                null;

            if (!file) {
                setAttachment(null);
                return;
            }

            const maxSize =
                5 * 1024 * 1024;

            if (file.size > maxSize) {
                setSubmitError(
                    "Attachment must be 5 MB or smaller."
                );

                event.target.value = "";

                setAttachment(null);

                return;
            }

            setSubmitError("");

            setAttachment(file);
        };


    /* ========================================================
       SUBMIT
    ======================================================== */

    const handleSubmit =
        async (
            event: React.FormEvent
        ) => {
            event.preventDefault();

            setSubmitError("");
            setSubmitSuccess("");

            /* ------------------------------------------------
               Employee validation
            ------------------------------------------------ */

            if (!employee) {
                setSubmitError(
                    "Unable to identify the authenticated employee."
                );

                return;
            }

            /* ------------------------------------------------
               Fault type validation
            ------------------------------------------------ */

            if (!selectedFaultType) {
                setSubmitError(
                    "Please select a fault type."
                );

                setFaultDropdownOpen(
                    true
                );

                return;
            }

            /* ------------------------------------------------
               Description validation
            ------------------------------------------------ */

            const cleanDescription =
                description.trim();

            if (!cleanDescription) {
                setSubmitError(
                    "Please enter the issue description."
                );

                return;
            }

            if (
                cleanDescription.length <
                5
            ) {
                setSubmitError(
                    "Issue description must contain at least 5 characters."
                );

                return;
            }

            /* ------------------------------------------------
               Submit
            ------------------------------------------------ */

            try {
                setSubmitting(true);

                const response =
                    await ticketApi.create(
                        {
                            reason_of_problem:
                                cleanDescription,

                            client_name:
                                "Fiber@Home Global Ltd",

                            department:
                                employee.department ||
                                null,

                            phone:
                                employee.official_cell ||
                                employee.personal_cell ||
                                null,

                            email:
                                employee.official_email ||
                                employee.email ||
                                null,

                            fault_type:
                                selectedFaultType.id,
                        }
                    );

                setSubmitSuccess(
                    `Trouble Ticket #${response.data.tt_no} created successfully.`
                );

                /*
                 * Keep the success message visible
                 * briefly before returning to dashboard.
                 */

                window.setTimeout(() => {
                    router.push(
                        "/dashboard"
                    );
                }, 1200);
            } catch (error) {
                console.error(
                    "Failed to create trouble ticket:",
                    error
                );

                setSubmitError(
                    error instanceof Error
                        ? error.message
                        : "Unable to create trouble ticket."
                );
            } finally {
                setSubmitting(
                    false
                );
            }
        };


    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="mb-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/dashboard"
                                        )
                                    }
                                    className="hover:text-blue-600"
                                >
                                    Dashboard
                                </button>

                                <span>/</span>

                                <span>
                                    Operations
                                </span>

                                <span>/</span>

                                <span className="font-medium text-blue-600">
                                    Create Trouble Ticket
                                </span>
                            </div>

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                    <FileText className="h-5 w-5" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Create Trouble Ticket
                                    </h1>

                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Submit a new IT support request
                                    </p>
                                </div>

                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.back()
                            }
                            className="gap-2 self-start"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                    </div>
                </div>


                {/* ==================================================
                    GLOBAL ERROR
                ================================================== */}

                {submitError && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <div className="flex items-start gap-2">
                            <X className="mt-0.5 h-4 w-4 shrink-0" />

                            <span>
                                {submitError}
                            </span>
                        </div>
                    </div>
                )}


                {/* ==================================================
                    SUCCESS
                ================================================== */}

                {submitSuccess && (
                    <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" />

                            <span>
                                {submitSuccess}
                            </span>
                        </div>
                    </div>
                )}


                {/* ==================================================
                    MAIN FORM
                ================================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">


                        {/* ==================================================
                            EMPLOYEE INFORMATION
                        ================================================== */}

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />

                                    <h2 className="font-semibold text-slate-900">
                                        Requester Information
                                    </h2>
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                    Automatically loaded from your authenticated account
                                </p>
                            </div>


                            <div className="space-y-4 p-5">

                                {employeeLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />

                                        <span className="text-sm text-slate-500">
                                            Loading employee information...
                                        </span>
                                    </div>
                                ) : employeeError ? (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-medium text-red-700">
                                            Unable to load your employee information.
                                        </p>

                                        <p className="mt-1 text-xs text-red-600">
                                            {employeeError}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                window.location.reload()
                                            }
                                            className="mt-3 text-xs font-medium text-blue-600 hover:underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : employee ? (
                                    <>
                                        {/* Avatar */}

                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                                {getInitials(
                                                    employee.employee_name
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {
                                                        employee.employee_name
                                                    }
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    {
                                                        employee.employee_id
                                                    }
                                                </p>
                                            </div>
                                        </div>


                                        {/* Employee Name */}

                                        <EmployeeField
                                            label="Employee Name"
                                            value={
                                                employee.employee_name
                                            }
                                            icon={
                                                <User className="h-4 w-4" />
                                            }
                                        />


                                        {/* Employee ID */}

                                        <EmployeeField
                                            label="Employee ID"
                                            value={
                                                employee.employee_id
                                            }
                                            icon={
                                                <FileText className="h-4 w-4" />
                                            }
                                        />


                                        {/* Designation */}

                                        <EmployeeField
                                            label="Designation"
                                            value={
                                                employee.designation
                                            }
                                            icon={
                                                <User className="h-4 w-4" />
                                            }
                                        />


                                        {/* Department */}

                                        <EmployeeField
                                            label="Department"
                                            value={
                                                employee.department
                                            }
                                            icon={
                                                <Building2 className="h-4 w-4" />
                                            }
                                        />


                                        {/* Work Field */}

                                        <EmployeeField
                                            label="Work Field"
                                            value={
                                                employee.work_field
                                            }
                                            icon={
                                                <Building2 className="h-4 w-4" />
                                            }
                                        />


                                        {/* Phone */}

                                        <EmployeeField
                                            label="Phone"
                                            value={
                                                employee.official_cell ||
                                                employee.personal_cell
                                            }
                                            icon={
                                                <Phone className="h-4 w-4" />
                                            }
                                        />


                                        {/* Email */}

                                        <EmployeeField
                                            label="Email"
                                            value={
                                                employee.official_email ||
                                                employee.email
                                            }
                                            icon={
                                                <Mail className="h-4 w-4" />
                                            }
                                        />
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-sm text-slate-500">
                                        Employee information unavailable.
                                    </div>
                                )}

                            </div>
                        </section>


                        {/* ==================================================
                            TICKET DETAILS
                        ================================================== */}

                        <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />

                                    <h2 className="font-semibold text-slate-900">
                                        Trouble Ticket Details
                                    </h2>
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                    Provide the details of the issue you are experiencing
                                </p>
                            </div>


                            <div className="space-y-6 p-5">


                                {/* ==================================================
                                    FAULT TYPE
                                ================================================== */}

                                <div
                                    ref={
                                        faultDropdownRef
                                    }
                                    className="relative"
                                >
                                    <label className="mb-2 block text-sm font-medium text-slate-900">
                                        Fault Type{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </label>


                                    {/* Selected button */}

                                    <button
                                        type="button"
                                        disabled={
                                            faultTypesLoading
                                        }
                                        onClick={() => {
                                            if (
                                                faultTypesLoading
                                            ) {
                                                return;
                                            }

                                            setFaultDropdownOpen(
                                                (
                                                    current
                                                ) =>
                                                    !current
                                            );
                                        }}
                                        className="
                                            flex
                                            h-11
                                            w-full
                                            items-center
                                            justify-between
                                            rounded-md
                                            border
                                            border-slate-300
                                            bg-white
                                            px-3
                                            text-left
                                            text-sm
                                            shadow-sm
                                            transition
                                            hover:border-blue-400
                                            focus:outline-none
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-50
                                        "
                                    >
                                        <div className="flex min-w-0 items-center gap-2">

                                            {selectedFaultType ? (
                                                <span className="truncate font-medium text-slate-900">
                                                    {selectedFaultType.fault_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">
                                                    {faultTypesLoading
                                                        ? "Loading fault types..."
                                                        : "Select a fault type"}
                                                </span>
                                            )}

                                        </div>

                                        {faultTypesLoading ? (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                                        ) : (
                                            <ChevronDown
                                                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${faultDropdownOpen
                                                    ? "rotate-180"
                                                    : ""
                                                    }`}
                                            />
                                        )}
                                    </button>


                                    {/* Dropdown */}

                                    {faultDropdownOpen && (
                                        <div className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">

                                            {/* Search */}

                                            <div className="border-b border-slate-200 bg-white p-2">
                                                <div className="relative">
                                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                                    <Input
                                                        autoFocus
                                                        value={
                                                            faultSearch
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setFaultSearch(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        onKeyDown={(
                                                            event
                                                        ) => {
                                                            if (
                                                                event.key ===
                                                                "Escape"
                                                            ) {
                                                                setFaultDropdownOpen(
                                                                    false
                                                                );
                                                            }
                                                        }}
                                                        placeholder="Search fault type..."
                                                        className="h-9 pl-9"
                                                    />
                                                </div>
                                            </div>


                                            {/* Result count */}

                                            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                                                <span className="text-[11px] text-slate-500">
                                                    {filteredFaultTypes.length.toLocaleString()}{" "}
                                                    fault types
                                                </span>

                                                {faultSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setFaultSearch(
                                                                ""
                                                            )
                                                        }
                                                        className="text-[11px] font-medium text-blue-600 hover:underline"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>


                                            {/* Results */}

                                            <div className="max-h-72 overflow-y-auto p-1">

                                                {faultTypesError ? (
                                                    <div className="p-5 text-center">
                                                        <p className="text-sm font-medium text-red-600">
                                                            Unable to load fault types
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {
                                                                faultTypesError
                                                            }
                                                        </p>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                window.location.reload()
                                                            }
                                                            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                                                        >
                                                            Retry
                                                        </button>
                                                    </div>
                                                ) : filteredFaultTypes.length ===
                                                    0 ? (
                                                    <div className="px-4 py-8 text-center">
                                                        <Search className="mx-auto h-6 w-6 text-slate-300" />

                                                        <p className="mt-2 text-sm font-medium text-slate-600">
                                                            No fault type found
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            Try another search term.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    filteredFaultTypes.map(
                                                        (
                                                            fault
                                                        ) => {
                                                            const selected =
                                                                selectedFaultType?.id ===
                                                                fault.id;

                                                            return (
                                                                <button
                                                                    key={
                                                                        fault.id
                                                                    }
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedFaultType(
                                                                            fault
                                                                        );

                                                                        setFaultDropdownOpen(
                                                                            false
                                                                        );

                                                                        setFaultSearch(
                                                                            ""
                                                                        );

                                                                        setSubmitError(
                                                                            ""
                                                                        );
                                                                    }}
                                                                    className={`
                                                                        w-full
                                                                        rounded-md
                                                                        px-3
                                                                        py-2.5
                                                                        text-left
                                                                        transition
                                                                        ${selected
                                                                            ? "bg-blue-50"
                                                                            : "hover:bg-slate-50"
                                                                        }
                                                                    `}
                                                                >
                                                                    <div className="flex items-start gap-3">

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center">
                                                                                <span
                                                                                    className={`
                                                                                truncate
                                                                                text-sm
                                                                                ${selected
                                                                                            ? "font-semibold text-blue-700"
                                                                                            : "font-medium text-slate-900"
                                                                                        }
                                                                                    `}
                                                                                >
                                                                                    {fault.fault_name}
                                                                                </span>
                                                                            </div>

                                                                            {fault.fault_desc && (
                                                                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                                                                    {
                                                                                        fault.fault_desc
                                                                                    }
                                                                                </p>
                                                                            )}

                                                                            {/* {fault.fault_register && (
                                                                                <p className="mt-1 text-[10px] text-slate-400">
                                                                                    Registered by{" "}
                                                                                    {
                                                                                        fault.fault_register
                                                                                    }
                                                                                </p>
                                                                            )} */}
                                                                        </div>

                                                                        {selected && (
                                                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                                                        )}

                                                                    </div>
                                                                </button>
                                                            );
                                                        }
                                                    )
                                                )}

                                            </div>
                                        </div>
                                    )}


                                    {/* Selected preview */}

                                    {selectedFaultType && (
                                        <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                                            <div className="flex items-start justify-between gap-3">

                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                                        Selected Fault Type
                                                    </p>

                                                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                                                        {
                                                            selectedFaultType.fault_name
                                                        }
                                                    </p>

                                                    {selectedFaultType.fault_desc && (
                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            {
                                                                selectedFaultType.fault_desc
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedFaultType(
                                                            null
                                                        )
                                                    }
                                                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-500"
                                                    aria-label="Clear selected fault type"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>

                                            </div>
                                        </div>
                                    )}

                                </div>


                                {/* ==================================================
                                    DESCRIPTION
                                ================================================== */}

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-sm font-medium text-slate-900">
                                            Issue Description{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <span className="text-xs text-slate-400">
                                            {
                                                description.length
                                            }{" "}
                                            characters
                                        </span>
                                    </div>

                                    <textarea
                                        value={
                                            description
                                        }
                                        onChange={(
                                            event
                                        ) => {
                                            setDescription(
                                                event
                                                    .target
                                                    .value
                                            );

                                            if (
                                                submitError
                                            ) {
                                                setSubmitError(
                                                    ""
                                                );
                                            }
                                        }}
                                        maxLength={
                                            5000
                                        }
                                        rows={
                                            8
                                        }
                                        placeholder="Please describe the issue in detail..."
                                        className="
                                            w-full
                                            resize-y
                                            rounded-md
                                            border
                                            border-slate-300
                                            bg-white
                                            px-3
                                            py-3
                                            text-sm
                                            text-slate-900
                                            shadow-sm
                                            outline-none
                                            placeholder:text-slate-400
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-100
                                        "
                                    />
                                </div>


                                {/* ==================================================
                                    ATTACHMENT
                                ================================================== */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-900">
                                        Attachment
                                    </label>

                                    <label
                                        htmlFor="tt-attachment"
                                        className="
                                            flex
                                            min-h-[110px]
                                            cursor-pointer
                                            flex-col
                                            items-center
                                            justify-center
                                            rounded-lg
                                            border
                                            border-dashed
                                            border-slate-300
                                            bg-slate-50
                                            px-4
                                            py-5
                                            text-center
                                            transition
                                            hover:border-blue-400
                                            hover:bg-blue-50/30
                                        "
                                    >
                                        <Paperclip className="h-6 w-6 text-slate-400" />

                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                            {attachment
                                                ? attachment.name
                                                : "Attach supporting file"}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Maximum file size: 5 MB
                                        </p>

                                        <input
                                            id="tt-attachment"
                                            type="file"
                                            className="hidden"
                                            onChange={
                                                handleAttachmentChange
                                            }
                                        />
                                    </label>

                                    {attachment && (
                                        <div className="mt-2 flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Paperclip className="h-4 w-4 shrink-0 text-blue-600" />

                                                <span className="truncate text-xs text-slate-600">
                                                    {
                                                        attachment.name
                                                    }
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAttachment(
                                                        null
                                                    )
                                                }
                                                className="ml-2 text-xs font-medium text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>


                                {/* ==================================================
                                    SUBMIT INFORMATION
                                ================================================== */}

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Requester
                                            </p>

                                            <p className="mt-1 truncate text-xs font-medium text-slate-700">
                                                {employee
                                                    ? employee.employee_name
                                                    : "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Employee ID
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-slate-700">
                                                {employee
                                                    ? employee.employee_id
                                                    : "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Fault Type
                                            </p>

                                            <p className="mt-1 truncate text-xs font-medium text-slate-700">
                                                {selectedFaultType
                                                    ? selectedFaultType.fault_name
                                                    : "Not selected"}
                                            </p>
                                        </div>

                                    </div>
                                </div>


                                {/* ==================================================
                                    ACTIONS
                                ================================================== */}

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            submitting
                                        }
                                        onClick={() =>
                                            router.push(
                                                "/dashboard"
                                            )
                                        }
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            employeeLoading ||
                                            !employee ||
                                            faultTypesLoading
                                        }
                                        className="min-w-[150px] bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Submit Ticket
                                            </>
                                        )}
                                    </Button>

                                </div>

                            </div>
                        </section>

                    </div>
                </form>
            </div>
        </div>
    );
}


/* ============================================================
   EMPLOYEE FIELD
============================================================ */

function EmployeeField({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | null | undefined;
    icon: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </label>

            <div className="flex min-h-[42px] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
                <span className="shrink-0 text-slate-400">
                    {icon}
                </span>

                <span className="truncate text-sm text-slate-700">
                    {displayValue(
                        value
                    )}
                </span>
            </div>
        </div>
    );
}