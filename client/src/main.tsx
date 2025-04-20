import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Update document title
document.title = "Guard-shin - Discord Moderation & Security";

// Add favicon
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%235865F2'%3E%3Cpath d='M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 12H5V7h14v10z'/%3E%3Ccircle cx='8.5' cy='12' r='1.5'/%3E%3Ccircle cx='15.5' cy='12' r='1.5'/%3E%3C/svg%3E";
document.head.appendChild(favicon);

createRoot(document.getElementById("root")!).render(<App />);
