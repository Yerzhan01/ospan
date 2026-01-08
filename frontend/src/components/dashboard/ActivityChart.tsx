'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityChartProps {
    data: { date: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Активность пациентов</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis 
                            dataKey="date" 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar 
                            dataKey="count" 
                            fill="currentColor" 
                            radius={[4, 4, 0, 0]} 
                            className="fill-primary" 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
