"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
}

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={value}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-bold"
                    >
                        {value}
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
