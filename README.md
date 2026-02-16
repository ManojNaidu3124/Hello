# Bosch Power Solutions - ROW Sales Dashboard

A browser-based dashboard for the ROW sales team with no coding required for daily usage.

## Features

- Checkbox-based multi-selection filtering by **Region** and **Product**.
- Year filter for slicing analysis periods.
- KPI cards for:
  - Total revenue
  - Target attainment
  - MoM growth %
  - YoY growth %
  - Average price impact %
- Visual analytics:
  - Month-wise revenue trend
  - QoQ analysis
  - Target vs Actual
  - Revenue forecast (next 3 months)
  - Price impact by product
- In-browser form to add/update project entries.
- PDF report generation and download.
- Data persistence via browser localStorage (entries with zero revenue are excluded).

## Run

Because this is a static project, any simple web server will run it.

```bash
python3 -m http.server 4173
```

Then open:

- http://localhost:4173

## Team Usage Notes

- Non-technical team members can use the filters and form directly in the UI.
- New entries are saved in the browser storage.
- Use **Download PDF Report** to export a summary.
