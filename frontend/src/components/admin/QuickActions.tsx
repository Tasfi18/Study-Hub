'use client';

import { CheckCircle, FileDown, Flag, Zap } from 'lucide-react';

interface QuickActionsProps {
    onApproveAllPending?: () => void;
    onExportCSV?: () => void;
    onViewReports?: () => void;
    pendingCount?: number;
    isApproving?: boolean;
}

export default function QuickActions({
    onApproveAllPending,
    onExportCSV,
    onViewReports,
    pendingCount = 0,
    isApproving = false,
}: QuickActionsProps) {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {/* Approve All */}
                <button
                    onClick={onApproveAllPending}
                    disabled={pendingCount === 0 || isApproving}
                    className="bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md"
                >
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-700">
                        {isApproving ? 'Approving...' : `Approve All (${pendingCount})`}
                    </span>
                </button>

                {/* View Reports */}
                <button
                    onClick={onViewReports}
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md"
                >
                    <Flag className="h-5 w-5 text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700">View Reports</span>
                </button>

                {/* Export CSV */}
                <button
                    onClick={onExportCSV}
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md col-span-2"
                >
                    <FileDown className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs font-semibold text-gray-700">Export Statistics as CSV</span>
                </button>
            </div>
        </div>
    );
}
