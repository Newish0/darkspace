import { IGradeStatistics } from "@/services/BS/scraper/grade-statistics";
import { ChartData, ChartOptions,  } from "chart.js";

import { BarChart } from "~/components/ui/charts";

interface GradeDistributionChartProps {
    data: IGradeStatistics;
}

export function GradeDistributionChart({ data }: GradeDistributionChartProps) {
    const chartData: ChartData = {
        labels: data.distributions.map((d) => `${d.minGrade}-${d.maxGrade}`),
        datasets: [
            {
                label: "Number of Students",
                data: data.distributions.map((d) => d.userCount),
                backgroundColor: "rgba(53, 89, 229, 1)",
                borderRadius: 5,
            },
            // {
            //     label: "Distribution Percentage",
            //     data: data.distributions.map((d) => d.distributionPercentage),
            //     backgroundColor: "rgba(255, 159, 64, 0.6)",
            //     borderColor: "rgba(255, 159, 64, 1)",
            //     borderWidth: 1,
            // },
        ],
    };

    const options: ChartOptions = {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Percentage Range",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Students",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                },
            },
        },
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Grade Distribution",
                font: {
                    size: 18,
                    weight: "bold",
                },
            },
        },
    };

    return <BarChart data={chartData} options={options} />;
}
