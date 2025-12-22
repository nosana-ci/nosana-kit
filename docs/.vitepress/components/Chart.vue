<template>
  <div class="chart-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
} from 'chart.js';
import { PolarAreaController, RadialLinearScale } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  PolarAreaController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  title?: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: ChartJS | null = null;

const getConfig = () => {
  // Get config from data attribute (set by the markdown plugin)
  if (!canvasRef.value?.parentElement) return null;
  
  const dataConfig = canvasRef.value.parentElement.getAttribute('data-config');
  if (!dataConfig) return null;

  try {
    // Unescape HTML entities and parse JSON
    const json = dataConfig
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse chart config:', e);
    return null;
  }
};

const createChart = () => {
  if (!canvasRef.value) return;

  const config = getConfig();
  if (!config?.type || !config?.data) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new ChartJS(canvasRef.value, config);
};

onMounted(() => {
  if (typeof window === 'undefined') return;
  nextTick(createChart);
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});

</script>

<style scoped>
.chart-container {
  margin: 1.5rem 0;
  position: relative;
  width: 100%;
  max-width: 100%;
  min-height: 300px;
}

.chart-container canvas {
  max-width: 100%;
  height: auto;
  display: block;
}
</style>

