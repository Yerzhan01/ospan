'use client';

import { useState } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { PatientList } from '@/components/patients/PatientList';
import { PatientFilters as FilterType } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function PatientsPage() {
    const [filters, setFilters] = useState<FilterType>({
        page: 1,
        limit: 10,
    });

    const { data, isLoading } = usePatients(filters);

    const handleFilterChange = (newFilters: FilterType) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Пациенты</h1>
                <Link href="/patients/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить пациента
                    </Button>
                </Link>
            </div>

            <PatientFilters filters={filters} onFilterChange={handleFilterChange} />

            <PatientList patients={data?.data || []} isLoading={isLoading} />

            {/* Simple Pagination */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange({ ...filters, page: (filters.page || 1) - 1 })}
                    disabled={(filters.page || 1) <= 1 || isLoading}
                >
                    Назад
                </Button>
                <div className="flex items-center text-sm font-medium">
                    Страница {filters.page || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange({ ...filters, page: (filters.page || 1) + 1 })}
                    disabled={!data || data.data.length < (filters.limit || 10) || isLoading}
                >
                    Вперед
                </Button>
            </div>
        </div>
    );
}
