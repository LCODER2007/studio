
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { StatCard } from "@/components/admin/StatCard";
import { ResourceAllocation } from "@/components/admin/ResourceAllocation";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { FileText, Users, Lightbulb, CheckCircle } from "lucide-react";
import type { Suggestion } from "@/lib/types";

export default function SuperAdminDashboardPage() {
    const firestore = useFirestore();

    const suggestionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'suggestions'));
    }, [firestore]);

    const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    const {data: users, isLoading: usersLoading} = useCollection(usersQuery);

    const implementedCount = 0; // Hardcoded as status is removed

    if (suggestionsLoading || usersLoading) {
        return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                 <div key={i} className="h-28 w-full animate-pulse rounded-lg bg-muted" />
            ))}
            <div className="md:col-span-2 lg:col-span-4 h-80 w-full animate-pulse rounded-lg bg-muted" />
            <div className="md:col-span-2 lg:col-span-4 h-80 w-full animate-pulse rounded-lg bg-muted" />
        </div>
    }


    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Suggestions" value={suggestions?.length || 0} icon={Lightbulb} />
            <StatCard title="Active Users" value={users?.length || 0} icon={Users} />
            <StatCard title="Implemented Ideas" value={implementedCount} icon={CheckCircle} />
            <StatCard title="Proposals to Review" value={suggestions?.length || 0} icon={FileText} />

            <div className="md:col-span-2 lg:col-span-4">
                <RecentActivity suggestions={suggestions?.slice(0, 5) || []} />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
                <ResourceAllocation suggestions={suggestions || []} />
            </div>
        </div>
    );
}
