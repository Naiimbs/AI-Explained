import os
import json
from docx import Document

folder = r"c:\Users\aii\Desktop\MCPidea\Courses-md\Sources"
files = [f for f in os.listdir(folder) if f.endswith('.docx')]

all_content = []

for f in files:
    path = os.path.join(folder, f)
    doc = Document(path)
    text = "\n".join([p.text for p in doc.paragraphs if p.text.strip() != ""])
    all_content.append({"file": f, "content": text})

output_path = r"c:\Users\aii\Desktop\MCPidea\Courses-md\scratch\raw_content.json"
with open(output_path, "w", encoding="utf-8") as f_out:
    json.dump(all_content, f_out, ensure_ascii=False, indent=2)

