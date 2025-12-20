'''
# 📊 Morgus Spreadsheet & Excel Skill v2.0

This skill enables Morgus to perform advanced spreadsheet operations, including data analysis, visualization, and financial modeling, with a focus on creating client-ready, professional-grade Excel workbooks (.xlsx).

## 💡 Core Principles (The Morgus Philosophy)

1.  **Clarity First**: Spreadsheets must be easy to understand. A clear model is a correct model.
2.  **Automate, Don't Obfuscate**: Use formulas for all derived values. No magic numbers.
3.  **Structure is Everything**: A well-organized layout is crucial for readability and maintainability.
4.  **Visualize to Understand**: Use charts and conditional formatting to reveal insights.
5.  **Client-Ready by Default**: Every spreadsheet should be polished and professional.

## 🚀 Step-by-Step Workflow

1.  **Understand the Goal**: Clarify the user's objective (e.g., build a financial model, analyze sales data, create a project plan).
2.  **Gather & Structure Data**: Collect all necessary inputs and organize them logically.
3.  **Build the Model**: Create the core structure with formulas and cell references.
4.  **Apply Formatting**: Implement styling, number formats, and conditional formatting.
5.  **Create Visualizations**: Add charts and graphs to illustrate key insights.
6.  **Review & Refine**: Thoroughly check for errors, recalculate all formulas, and ensure a professional finish.

## 🛠️ Best Practices

### Primary Tooling

*   **`openpyxl`**: The primary library for all .xlsx operations (reading, writing, styling, charts).
*   **`pandas`**: For complex data manipulation and analysis before writing to Excel.
*   **`matplotlib`**: For generating complex charts as images to be inserted into the workbook.

### Formula Requirements

*   **Use Formulas for Derived Values**: All calculations must be done with Excel formulas.
*   **No Dynamic Array Functions**: Avoid `FILTER`, `XLOOKUP`, `SORT`, etc., as they are not universally supported.
*   **Simple & Legible**: Use helper cells for intermediate calculations.
*   **Use Cell References**: No hardcoded numbers in formulas (e.g., `=A1 * (1 + $B$1)`, not `=A1 * 1.05`).
*   **Error Handling**: Use `IFERROR` to gracefully handle potential errors.

### Formatting & Styling

*   **Number Formats**: Use appropriate formats for dates, currencies, percentages, etc.
*   **Clear Layout**: Use headers, fill colors, and borders to create a professional look.
*   **Standard Colors (for new models)**:
    *   **Blue Text**: User inputs.
    *   **Black Text**: Formulas and derived values.
    *   **Green Text**: Links to other sheets.
*   **Financial Models**:
    *   Negative numbers in red with parentheses: `(500)`.
    *   Zeros formatted as `-`.
    *   Specify units in headers (e.g., "Revenue ($M)").

### Charting & Visualization

*   **Choose the Right Chart**: Use bar, line, pie, etc., as appropriate for the data.
*   **Clear & Concise**: Charts should be easy to read with clear titles, labels, and legends.
*   **Native Charts**: Use `openpyxl.chart` to create native Excel charts whenever possible.

### Quality Checks

*   **Recalculate All**: Ensure all formulas are calculated and values are up-to-date.
*   **Visual Inspection**: If possible, render sheets to images to check for formatting issues (though this is a GPT-specific capability, the principle of visual verification is key).
*   **Error Free**: The final workbook must not contain any formula errors (`#REF!`, `#DIV/0!`, etc.).

## 🔑 Keyword Triggers

*   `spreadsheet`, `excel`, `xlsx`, `csv`
*   `financial model`, `dcf`, `lbo`
*   `data analysis`, `pivot table`, `charts`, `graphs`
*   `budget`, `forecast`, `project plan`
*   `openpyxl`, `pandas`
'''
