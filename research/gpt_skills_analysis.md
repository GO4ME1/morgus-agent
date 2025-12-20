# GPT Skills Analysis

## Source
https://tools.simonwillison.net/zip-wheel-explorer?url=https%3A%2F%2Fstatic.simonwillison.net%2Fstatic%2Fcors-allow%2F2025%2Fskills.zip

## GPT Skills Found

### 1. Spreadsheets Skill
- `skills/spreadsheets/skill.md` - Main skill definition
- `skills/spreadsheets/spreadsheet.md` - Spreadsheet documentation
- `skills/spreadsheets/artifact_tool_spreadsheets_api.md` - API documentation
- `skills/spreadsheets/artifact_tool_spreadsheet_formulas.md` - Formula documentation

**Features:**
- Create basic spreadsheets
- Read existing spreadsheets
- Styling spreadsheets
- Create tables
- Set number formats
- Change existing charts
- Set cell width/height
- Set cell fills
- Set cell borders
- Set merge cells
- Create area charts
- Create pie charts
- Set conditional formatting
- Create bar charts
- Create doughnut charts
- Set text alignment
- Create line charts
- Set font styles
- Set wrap text styles
- Cite cells

### 2. Docs Skill
- `skills/docs/skill.md` - Main skill definition
- `skills/docs/render_docx.py` - DOCX rendering

### 3. PDFs Skill
- `skills/pdfs/skill.md` - Main skill definition

## Gap Analysis: Morgus vs GPT

| GPT Skill | Morgus Has? | Notes |
|-----------|-------------|-------|
| Spreadsheets (Excel/XLSX) | ❌ NO | **MAJOR GAP** - Need to add |
| Docs (DOCX) | ⚠️ Partial | We have Document Generation but not DOCX-specific |
| PDFs | ⚠️ Partial | We have Document Generation but not PDF-specific |

## Detailed GPT Skill Analysis

### 1. Spreadsheet Skill (136 lines)
A comprehensive skill for Excel/XLSX manipulation with:
- Uses `openpyxl` and proprietary `artifact_tool` library
- Formula requirements (no dynamic arrays, proper cell references)
- Formatting requirements (colors, borders, number formats)
- Financial model conventions (blue=input, black=formula, etc.)
- Investment banking specific formatting
- Citation requirements within spreadsheets
- Quality checks with rendering and visual inspection

### 2. Docs Skill (34 lines)
Guidance for DOCX creation with:
- Uses `python-docx` for creation
- Uses `soffice` (LibreOffice) for PDF conversion
- Uses `pdftoppm` for PNG rendering
- Visual inspection loop after every batch of edits
- Quality expectations for client-ready documents
- Citation formatting requirements

### 3. PDFs Skill (30 lines)
Guidance for PDF creation with:
- Uses `reportlab` as primary tool
- Uses `pdftoppm` for PNG rendering
- Uses `pdfplumber` for reading
- Visual inspection loop after each update
- Quality expectations for polished design
- Citation formatting requirements

## Recommendations for Morgus

1. **Add Spreadsheet Skill** - MAJOR GAP. Need comprehensive Excel/XLSX capabilities with:
   - openpyxl integration
   - Formula handling and validation
   - Chart creation (bar, line, pie, area, doughnut)
   - Styling (colors, borders, fonts, conditional formatting)
   - Financial model conventions

2. **Add DOCX Skill** - Enhance document generation with:
   - python-docx integration
   - PDF conversion via LibreOffice
   - Visual inspection workflow
   - Professional formatting standards

3. **Add PDF Skill** - Enhance PDF capabilities with:
   - reportlab integration
   - Visual inspection workflow
   - Professional formatting standards

4. **Add MCP Support** - Enable extensibility for user-provided tools

