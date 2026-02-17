/**
 * Plotly loaded from CDN (window.Plotly). Used so the build does not bundle plotly.js,
 * which is large and can cause OOM on low-memory systems.
 */
export default typeof window !== "undefined" ? (window as unknown as { Plotly: unknown }).Plotly : undefined;
