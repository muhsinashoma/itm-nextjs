//components/user-avatar.tsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* =========================
   GET INITIALS
========================= */
const getInitials = (name?: string) => {
    if (!name) return "NA";

    const ignored = ["md.", "md", "mohammad"];

    const parts = name
        .toLowerCase()
        .split(" ")
        .filter((w) => w && !ignored.includes(w));

    return parts
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
};

/* =========================
   DYNAMIC COLOR GENERATOR
========================= */
const colors = [
    "bg-red-100 text-red-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
];

const getColor = (name?: string) => {
    if (!name) return colors[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

/* =========================
   USER AVATAR COMPONENT
========================= */
export function UserAvatar({
    name,
    src,
}: {
    name?: string;
    src?: string;
}) {
    const colorClass = getColor(name);

    return (
        <Avatar className="h-8 w-8">
            <AvatarImage src={src} alt={name} />
            <AvatarFallback className={`${colorClass} text-xs font-semibold`}>
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    );
}