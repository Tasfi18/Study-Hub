'use client';

interface CategoryData {
    category: string;
    count: number;
    percentage: number;
}

interface CategoryChartProps {
    data: CategoryData[];
    loading?: boolean;
}

const categoryLabels: Record<string, string> = {
    'lecture_note': 'Lecture Notes',
    'previous_question': 'Previous Questions',
    'ct_question': 'CT Questions',
    'final_question': 'Final Questions',
    'assignment': 'Assignments',
    'lab_manual': 'Lab Manuals',
    'syllabus': 'Syllabus',
    'book': 'Books',
    'other': 'Other',
};

const categoryColors: Record<string, string> = {
    'lecture_note': 'bg-blue-500',
    'previous_question': 'bg-purple-500',
    'ct_question': 'bg-indigo-500',
    'final_question': 'bg-pink-500',
    'assignment': 'bg-cyan-500',
    'lab_manual': 'bg-teal-500',
    'syllabus': 'bg-orange-400',
    'book': 'bg-emerald-500',
    'other': 'bg-gray-400',
};

export default function CategoryChart({ data, loading = false }: CategoryChartProps) {
    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex justify-between mb-2">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="h-4 bg-gray-200 rounded w-10"></div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Take top 5 categories
    const topCategories = data.slice(0, 5);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Popular Categories</h3>
            <p className="text-sm text-gray-500 mb-6">Distribution of study material types</p>

            {topCategories.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8 text-gray-500">
                    <p>No category data available</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center gap-5">
                    {topCategories.map((cat, index) => (
                        <div key={cat.category} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {categoryLabels[cat.category] || cat.category}
                                </span>
                                <span className={`text-xs font-bold ${index === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {cat.percentage}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${categoryColors[cat.category] || 'bg-gray-400'}`}
                                    style={{ width: `${cat.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
