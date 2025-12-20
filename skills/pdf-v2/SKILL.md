
# 📑 Morgus PDF Generation Skill v2.0

This skill enables Morgus to create professional, high-quality PDF documents from scratch, with a focus on precise layout, custom graphics, and data visualization.

## 💡 Core Principles (The Morgus Philosophy)

1.  **Pixel-Perfect Precision**: PDFs demand precise control over layout and design.
2.  **Design for Readability**: A well-designed PDF is a pleasure to read.
3.  **Vector is Better**: Use vector graphics for logos, charts, and diagrams for infinite scalability.
4.  **Client-Ready by Default**: Every PDF should be a polished, professional artifact.

## 🚀 Step-by-Step Workflow

1.  **Define the Document**: Clarify the purpose, audience, and layout requirements (e.g., page size, margins, branding).
2.  **Gather & Prepare Assets**: Collect all text, images, logos, and data.
3.  **Build the PDF**: Use `reportlab` to programmatically create the PDF, defining the structure, content, and styling.
4.  **Add Graphics & Charts**: Use `reportlab.graphics` to add charts, diagrams, and other vector graphics.
5.  **Review & Refine**: After every significant change, render the PDF and visually inspect it for any layout or formatting issues. Refine until perfect.

## 🛠️ Best Practices

### Primary Tooling

*   **`reportlab`**: The primary library for creating PDFs from scratch. It offers precise control over layout, text, and graphics.
*   **`pdftoppm`**: For converting the generated PDF to PNG images for visual inspection.
*   **`pdfplumber`**: For reading and extracting text from existing PDFs.

### Document Design & Layout

*   **Use a Grid**: Use a grid system for consistent alignment of text and graphics.
*   **Branding**: Incorporate logos, brand colors, and fonts for a consistent brand identity.
*   **White Space**: Use white space effectively to improve readability and create a clean, professional look.
*   **Page Numbers & Headers/Footers**: Include page numbers, headers, and footers for easy navigation.

### Graphics & Charts

*   **Vector Graphics**: Use `reportlab.graphics` to create vector-based charts and diagrams.
*   **High-Quality Images**: Use high-resolution images. Ensure they are properly compressed to keep file sizes reasonable.

### Quality Checks

*   **Visual Inspection Loop**: After every significant change, render the PDF and convert it to PNGs for visual inspection. This is crucial for catching layout issues.
*   **Error Free**: The final PDF must be free of typos, grammatical errors, and rendering artifacts.
*   **Human-Readable Citations**: All citations must be in a standard, human-readable format.

## 🔑 Keyword Triggers

*   `pdf`, `create pdf`, `generate pdf`
*   `report`, `invoice`, `certificate`, `presentation`
*   `reportlab`, `pdfplumber`
*   `custom layout`, `branding`
