import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardHeader() {
    return (
        <header className="flex h-16 items-center justify-between border-b px-6">
            <h2 className="text-lg font-semibold">Dashboard</h2>

            <div className="flex items-center gap-4">
                <Input
                    placeholder="Search..."
                    className="w-[200px] lg:w-[300px]"
                />
                <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
