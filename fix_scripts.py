import os
import glob

def fix_json_ld():
    astro_files = glob.glob('/Users/shivrajsinhzala/Documents/untitled folder/src/**/*.astro', recursive=True)
    for file in astro_files:
        with open(file, 'r') as f:
            content = f.read()
        
        # Replace all variants of the script tag
        content = content.replace('<script type="application/ld+json">', '<script type="application/ld+json" is:inline>')
        content = content.replace('<script type=\'application/ld+json\'>', '<script type="application/ld+json" is:inline>')
        content = content.replace('<script type="application/ld+json" >', '<script type="application/ld+json" is:inline>')
        
        # Also ensure no double is:inline
        content = content.replace('<script type="application/ld+json" is:inline is:inline>', '<script type="application/ld+json" is:inline>')
        content = content.replace('<script is:inline type="application/ld+json" is:inline>', '<script is:inline type="application/ld+json">')
        
        # Replace remaining generic scripts at bottom
        content = content.replace('<script>\n        lucide.createIcons();', '<script is:inline>\n        lucide.createIcons();')
        
        with open(file, 'w') as f:
            f.write(content)

if __name__ == '__main__':
    fix_json_ld()
    print("Fixed scripts")
