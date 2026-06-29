<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import TelemetryChart from './components/TelemetryChart.svelte';
  import RiskMap from './components/RiskMap.svelte';
  import ForecastPanel from './components/ForecastPanel.svelte';

  let mapContainer;
  let map;
  let telemetryData = [];
  let alerts = [];
  let forecast = null;

  onMount(async () => {
    // Initialize Mapbox
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
    map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [-87.9944, 37.8575],
      pitch: 45,
      bearing: -17.6,
      zoom: 15.5
    });

    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      telemetryData = [...telemetryData.slice(-100), data];
      
      if (data.alert_triggered) {
        alerts = [...alerts.slice(-10), data];
      }
    };

    // Fetch initial forecast
    const forecastResponse = await fetch('/api/v21/forecast/ensemble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_id: 'PTSHIP-01', horizon_hours: 24 })
    });
    forecast = await forecastResponse.json();
  });
</script>

<div class="dashboard">
  <header>
    <h1>🌊 Point Township Digital Twin v21.0</h1>
    <div class="status">
      {#if alerts.length > 0}
        <span class="alert">🚨 {alerts.length} ACTIVE ALERTS</span>
      {:else}
        <span class="ok">✓ OPERATIONAL</span>
      {/if}
    </div>
  </header>

  <main>
    <div class="map-container">
      <div bind:this={mapContainer} class="map"></div>
    </div>

    <div class="sidebar">
      <TelemetryChart data={telemetryData} />
      <ForecastPanel {forecast} />
      <RiskMap />
    </div>
  </main>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #0f172a;
    color: #e2e8f0;
  }

  header {
    background: rgba(15, 23, 42, 0.95);
    border-bottom: 1px solid #334155;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .status {
    font-size: 0.9rem;
  }

  .alert {
    color: #ef4444;
    font-weight: bold;
  }

  .ok {
    color: #10b981;
  }

  main {
    display: flex;
    flex: 1;
    gap: 1rem;
    padding: 1rem;
  }

  .map-container {
    flex: 2;
    border-radius: 8px;
    overflow: hidden;
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .sidebar {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }
</style>