
# 📄 Morgus DOCX Generation Skill v2.0

This skill enables Morgus to create and edit professional, client-ready Microsoft Word documents (.docx) with a focus on structure, formatting, and visual quality.

## 💡 Core Principles (The Morgus Philosophy)

1.  **Structure First**: A well-structured document is easy to navigate and understand.
2.  **Consistency is Key**: Consistent formatting (fonts, spacing, styles) is the hallmark of professionalism.
3.  **Visuals Matter**: Use tables, images, and charts to break up text and convey information effectively.
4.  **Client-Ready by Default**: Every document should be polished and ready for review.

## 🚀 Step-by-Step Workflow

1.  **Define the Document**: Clarify the purpose, audience, and key sections of the document.
2.  **Gather & Outline Content**: Collect all necessary text, images, and data, and create a detailed outline.
3.  **Create the Document**: Use `python-docx` to build the document structure, add content, and apply styles.
4.  **Insert Visuals**: Add tables, images, and charts as needed.
5.  **Review & Refine**: Convert to PDF for visual inspection, check for formatting errors, and refine until perfect.

## 🛠️ Best Practices

### Primary Tooling

*   **`python-docx`**: The primary library for creating and editing .docx files.
*   **`soffice` (LibreOffice)**: For converting .docx to .pdf for visual review (`soffice --headless --convert-to pdf ...`).
*   **`pdftoppm`**: For converting the resulting PDF to PNG images for detailed inspection.

### Document Structure & Formatting

*   **Use Styles**: Use built-in styles (e.g., 'Heading 1', 'Normal') for consistent formatting.
*   **Clear Hierarchy**: Use headings, subheadings, and lists to create a clear visual hierarchy.
*   **Consistent Spacing**: Ensure consistent paragraph spacing and line height.
*   **Professional Fonts**: Use standard, professional fonts (e.g., Calibri, Times New Roman, Arial).

### Tables & Images

*   **Clear Tables**: Use table styles for consistent formatting. Ensure columns are wide enough for content.
*   **High-Quality Images**: Use high-resolution images. Ensure they are properly sized and aligned.

### Quality Checks

*   **Visual Inspection Loop**: After every significant change, convert the .docx to .pdf and then to .png images to visually inspect the output. This is a critical step to catch formatting errors.
*   **Error Free**: The final document must be free of typos, grammatical errors, and formatting issues.
*   **No Placeholder Text**: Ensure all placeholder text is replaced with final content.
*   **Human-Readable Citations**: All citations must be in a standard, human-readable format.

## 🔑 Keyword Triggers

*   `docx`, `word document`, `report`, `proposal`
*   `document generation`, `create a doc`
*   `python-docx`, `soffice`, `libreoffice`
*   `memo`, `letter`, `article`
