import React from "react";
import ReactDOM from "react-dom/client";
import { applyStoredTheme } from "./utils/uiTheme";
import App from "./App";
import "./index.css";

applyStoredTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
