import { Box } from "@mui/material";
import { Chart as ChartJS, ChartDataset, LegendItem, ChartData, CategoryScale, LinearScale, PointElement, LineElement, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import { formatDuration, formatNumber } from "../../../utils/helpers";

export default function AnalyticsLineChart(props: {data: ChartData<"line", number[], string>, style?: {[x: string]: any}, type: 'number'|'duration'}) {
  ChartJS.register([
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Legend
  ]);

  return (<Box sx={{width: '100%', height: '400px', ...props.style}}>
    <Line
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              generateLabels: (chart) => {
                return chart.data.datasets.map((d, i) => {
                  const dataset = d as ChartDataset<"line">;
                  const pointStyle = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = 15;
                    canvas.height = 15;

                    ctx?.setLineDash((dataset.borderDash ?? [0, 0]) as number[]);
                    ctx?.beginPath();
                    ctx?.moveTo(0, 7)
                    ctx?.lineTo(15, 7);
                    ctx && (ctx.strokeStyle = dataset.borderColor as string);
                    ctx && (ctx.lineWidth = 2);
                    ctx?.stroke();

                    return canvas;
                  }
                  
                  return {
                    text: d.label,
                    fontColor: ChartJS.defaults.color,
                    datasetIndex: i,
                    hidden: d.hidden,
                    pointStyle: pointStyle(),
                  } as LegendItem;
                });
              },
              usePointStyle: true,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function(val, _) {
                return props.type === 'duration' ? formatDuration(val as number) : formatNumber(val as number);
              },
            }
          }
        }
      }}
      data={props.data}
    />
  </Box>);
}
