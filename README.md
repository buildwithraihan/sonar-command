# Sonar Command

Build a React + Tailwind frontend called SENTINEL — an AI-powered underwater sonar 

anomaly detection dashboard, styled as a dark tactical/military command center UI.

Do NOT generate a backend. I already have a live FastAPI backend. Only build the 

frontend and connect to it via fetch/axios.

BACKEND API:

- Base URL: https://sentinel-2h7a.onrender.com (store as env variable VITE_API_URL)

- Endpoint: POST {API_URL}/analyze

- Request: multipart/form-data, field name "file" (the sonar image)

- Note: this is a free-tier Render deployment that may cold-start (30-60s delay) 

  if inactive — show an appropriate "waking up server..." message if the first 

  request takes unusually long, don't just show a generic loading spinner

- Response JSON shape:

  {

    "filename": string,

    "total_detections": number,

    "detections": [

      {

        "class": string,               // "ship" | "aircraft" | "human"

        "confidence": number,          // 0 to 1

        "bbox": { "x1": number, "y1": number, "x2": number, "y2": number }, 

                                        // pixel coords relative to ORIGINAL image resolution

        "category": string,            // "Artificial" | "Uncertain — Review Required"

        "detection_quality": string,   // "HIGH" | "MEDIUM" | "LOW"

        "priority": string             // "HIGH" | "MEDIUM" | "LOW"

      }

    ]

  }

REQUIRED SCREENS/COMPONENTS:

1. Header bar: "SENTINEL" title + "UNDERWATER INTELLIGENCE SYSTEM" subtitle, 

   live status indicator (dot + text: "STANDBY" / "ANALYZING" / "COMPLETE" / "ERROR")

2. Upload panel:

   - Clickable AND drag-and-drop zone, accepts PNG/JPG only

   - Show filename + file size once selected

   - "RUN ANALYSIS" button, disabled until a file is chosen, loading state while 

     in flight, animated progress bar

   - Clear error message on failure (never fail silently or hang indefinitely — 

     45s timeout to account for possible cold start)

3. Sonar Viewer panel:

   - Displays the uploaded image

   - Draws bounding box overlays from detections[].bbox, correctly scaled from 

     original image pixel coordinates to displayed image size

   - Each box labeled with class name + confidence %

   - Box color coded by priority: HIGH=red, MEDIUM=amber, LOW=cyan

   - "AWAITING SONAR FEED INPUT" placeholder before any analysis

4. Detections Panel:

   - Table of all detections: class, confidence %, category, detection_quality, priority

   - Color-coded priority badges

   - Sortable by confidence or priority

5. Analytics summary bar (after successful analysis):

   - Total detections, breakdown by priority, breakdown by class

6. Export controls:

   - "EXPORT CSV" and "EXPORT JSON" buttons — client-side export, no backend call

7. Footer: "SENTINEL v1.0 — CLASSIFICATION: RESTRICTED"

VISUAL STYLE:

- Dark navy/black background (#020b18 to #040f1e range)

- Cyan/teal accent (#00d4ff), red for HIGH priority, amber for MEDIUM

- Monospace, uppercase, letter-spaced labels and headers

- Angular/sharp bordered panels, thin 1px borders

- Subtle background grid texture

- Bracket-style section labels like "[ SONAR FEED INPUT ]"

- Naval command center / military tactical console feel

DO NOT INCLUDE: authentication, database, map/geolocation, real-time streaming, 

or any fake/placeholder data panels not backed by the actual API response.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7c3f51f5-96b0-4780-ad44-b3eb3bbf54a0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
