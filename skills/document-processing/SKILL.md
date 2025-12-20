# Document Processing Skill

## Overview
This skill guides processing of various document types including PDFs, Word documents, spreadsheets, and text files.

## Supported Formats

| Format | Extension | Processing Method |
|--------|-----------|-------------------|
| PDF | .pdf | PyPDF2 |
| Word | .docx | python-docx |
| Excel | .xlsx | openpyxl/pandas |
| CSV | .csv | pandas |
| Text | .txt, .md | Direct read |
| Images | .png, .jpg | Vision/OCR |

## Processing Patterns

### PDF Documents
```python
import base64, io
from PyPDF2 import PdfReader

# Decode from data URL
data_url = "data:application/pdf;base64,..."
base64_data = data_url.split(',')[1]
pdf_bytes = base64.b64decode(base64_data)

# Read PDF
reader = PdfReader(io.BytesIO(pdf_bytes))
text = ''
for page in reader.pages:
    text += page.extract_text()
print(text[:5000])
```

### Word Documents
```python
import base64, io
from docx import Document

data_url = "data:application/vnd.openxmlformats...;base64,..."
base64_data = data_url.split(',')[1]
doc_bytes = base64.b64decode(base64_data)

doc = Document(io.BytesIO(doc_bytes))
text = []
for para in doc.paragraphs:
    if para.text.strip():
        text.append(para.text)
print('\n'.join(text))
```

### Excel/CSV Files
```python
import pandas as pd
import base64, io

# For CSV
df = pd.read_csv(io.StringIO(decoded_text))

# For Excel
df = pd.read_excel(io.BytesIO(decoded_bytes))

print(df.head())
print(df.describe())
```

## Analysis Patterns

### Summarization
1. Extract full text
2. Identify key sections
3. Extract main points
4. Generate concise summary

### Data Extraction
1. Parse document structure
2. Identify data patterns
3. Extract to structured format
4. Validate extracted data

### Comparison
1. Process both documents
2. Identify common elements
3. Find differences
4. Generate comparison report

## Best Practices

### Before Processing
- Check file type from data URL
- Verify file is not corrupted
- Note file size limitations

### During Processing
- Handle encoding issues
- Catch extraction errors
- Truncate large outputs
- Preserve important formatting

### After Processing
- Summarize key findings
- Highlight important sections
- Provide actionable insights
- Offer follow-up options

## Error Handling

### Common Issues
- **Encrypted PDFs**: Cannot process, inform user
- **Scanned PDFs**: May need OCR, text extraction limited
- **Complex formatting**: May lose some structure
- **Large files**: Truncate output, process in chunks

### Recovery Strategies
```python
try:
    text = page.extract_text()
except Exception as e:
    text = f"[Error extracting page: {e}]"
```

## Output Guidelines
- Always confirm successful extraction
- Quote relevant sections
- Provide page/section references
- Offer to extract specific parts
