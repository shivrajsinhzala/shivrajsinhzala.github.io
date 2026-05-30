import os
import glob
import re

def fix_layout_attributes():
    astro_files = glob.glob('/Users/shivrajsinhzala/Documents/untitled folder/src/**/*.astro', recursive=True)
    for file in astro_files:
        with open(file, 'r') as f:
            content = f.read()
        
        # We need to find the <Layout title="..." description="..."> tag
        # And escape any double quotes inside the attribute values.
        # But wait, my script generated it exactly as:
        # <Layout title="..." description="...">
        
        match = re.search(r'<Layout title="(.*?)" description="(.*?)">', content, re.DOTALL)
        if match:
            title = match.group(1).replace('"', '&quot;')
            desc = match.group(2).replace('"', '&quot;')
            new_tag = f'<Layout title="{title}" description="{desc}">'
            content = content[:match.start()] + new_tag + content[match.end():]
            
            with open(file, 'w') as f:
                f.write(content)

if __name__ == '__main__':
    fix_layout_attributes()
    print("Fixed layout attributes")
