'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PatientFilters as FilterType, PatientStatus } from '@/types/patient';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search } from 'lucide-react';

interface PatientFiltersProps {
    filters: FilterType;
    onFilterChange: (filters: FilterType) => void;
}

export function PatientFilters({ filters, onFilterChange }: PatientFiltersProps) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchValue, 500);

    useEffect(() => {
        onFilterChange({ ...filters, search: debouncedSearch, page: 1 }); // Reset to page 1 on search
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const handleStatusChange = (value: string) => {
        const status = value === 'all' ? undefined : (value as PatientStatus);
        onFilterChange({ ...filters, status, page: 1 });
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Поиск по имени или телефону..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-8"
                />
            </div>
            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="ACTIVE">Активен</SelectItem>
                    <SelectItem value="COMPLETED">Завершен</SelectItem>
                    <SelectItem value="PAUSED">На паузе</SelectItem>
                    <SelectItem value="DROPPED">Выбыл</SelectItem>
                </SelectContent>
            </Select>
            {/* Clinic and Tracker filters can be added here later */}
        </div>
    );
}
