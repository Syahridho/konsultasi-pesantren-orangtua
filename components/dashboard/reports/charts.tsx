"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  data: ChartData[];
  height?: number;
}

export function BarChart({ title, data, height = 300 }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">{item.name}</div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color || "#3B82F6",
                    }}
                  >
                    <span className="text-xs text-white font-medium">
                      {item.value}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 w-12 text-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PieChartProps {
  title: string;
  data: ChartData[];
  size?: number;
}

export function PieChart({ title, data, size = 300 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 42 42" className="w-full h-full">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle =
                  index === 0
                    ? 0
                    : data
                        .slice(0, index)
                        .reduce(
                          (sum, prevItem) =>
                            sum + (prevItem.value / total) * 360,
                          0
                        );

                const endAngle = startAngle + angle;
                const largeArcFlag = angle > 180 ? 1 : 0;
                const x1 = 21 + 19 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 21 + 19 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 21 + 19 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 21 + 19 * Math.sin((endAngle * Math.PI) / 180);

                return (
                  <g key={index}>
                    <path
                      d={`M 21 21 L ${x1} ${y1} A 19 19 0 ${largeArcFlag} 1 L ${x2} ${y2} A 19 19 0 ${largeArcFlag} 0 Z`}
                      fill={item.color || "#3B82F6"}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={
                        21 +
                        10 *
                          Math.cos(((startAngle + angle / 2) * Math.PI) / 180)
                      }
                      y={
                        21 +
                        10 *
                          Math.sin(((startAngle + angle / 2) * Math.PI) / 180)
                      }
                      fill="white"
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {`${Math.round(percentage)}%`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color || "#3B82F6" }}
              ></div>
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.value} ({Math.round((item.value / total) * 100)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface LineChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    date?: string;
  }>;
  height?: number;
}

export function LineChart({ title, data, height = 300 }: LineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                <div className="relative h-2 bg-gray-200 rounded">
                  <div
                    className="absolute top-0 left-0 h-2 bg-blue-500 rounded"
                    style={{
                      width: `${((item.value - minValue) / range) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 w-12 text-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  change,
  changeType,
  icon,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          {icon && <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>}
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold">{value}</p>
              {change !== undefined && (
                <div className="ml-2 flex items-center">
                  <span
                    className={`text-sm font-medium ${
                      changeType === "increase"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {changeType === "increase" ? "+" : "-"}
                    {Math.abs(change)}%
                  </span>
                  <span className="text-sm text-gray-500">dari bulan lalu</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
