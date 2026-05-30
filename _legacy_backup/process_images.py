import os
import subprocess
import glob
import re

SOURCE_DIR = "/Users/shivrajsinhzala/Documents/untitled folder/my_50_images"
DEST_DIR = "/Users/shivrajsinhzala/Documents/untitled folder/assets/images/gallery"

# Create destination directory
os.makedirs(DEST_DIR, exist_ok=True)

SEO_KEYWORDS = [
    "shivrajsinh-zala-frontend-developer",
    "shivrajsinh-zala-rajkot-web-designer",
    "shivrajsinh-zala-react-developer-gujarat",
    "shivrajsinh-zala-wordpress-expert",
    "shivrajsinh-zala-software-engineer-rajkot",
    "shivrajsinh-zala-brutalist-web-design",
    "shivrajsinh-zala-shopify-ecommerce-developer",
    "shivrajsinh-zala-digital-marketing-expert",
    "shivrajsinh-zala-gsap-animation-developer",
    "shivrajsinh-zala-webflow-designer"
]

# Get all files in source directory
files = [f for f in os.listdir(SOURCE_DIR) if os.path.isfile(os.path.join(SOURCE_DIR, f))]
files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.heic', '.heif'))]

print(f"Found {len(files)} valid images.")

image_data = []

for idx, file_name in enumerate(files):
    source_path = os.path.join(SOURCE_DIR, file_name)
    
    keyword_base = SEO_KEYWORDS[idx % len(SEO_KEYWORDS)]
    # Create a unique but SEO-friendly filename
    new_filename = f"{keyword_base}-{idx+1}.jpg"
    dest_path = os.path.join(DEST_DIR, new_filename)
    
    # Use sips to convert to JPEG and resize if it's too huge (max width/height 1600)
    print(f"Processing: {file_name} -> {new_filename}")
    
    try:
        # Convert to jpeg, set compression to 75%
        cmd = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "75", "-Z", "1600", source_path, "--out", dest_path]
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Create readable alt text from filename
        alt_text = " ".join(keyword_base.split("-")).title()
        image_data.append({"filename": new_filename, "alt": alt_text, "url": f"https://shivrajsinhzala.github.io/assets/images/gallery/{new_filename}"})
    except Exception as e:
        print(f"Error processing {file_name}: {e}")

# Generate the HTML for gallery.html
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shivrajsinh Zala - Press Kit & Gallery</title>
    <meta name="description" content="Official press kit and image gallery for Shivrajsinh Zala, Frontend Developer in Rajkot.">
    <link rel="canonical" href="https://shivrajsinhzala.github.io/gallery.html">
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": "Shivrajsinh Zala Press Kit",
      "author": {{
        "@type": "Person",
        "name": "Shivrajsinh Zala"
      }},
      "image": [
        {','.join([f'"{img["url"]}"' for img in image_data])}
      ]
    }}
    </script>
</head>
<body>
    <h1>Shivrajsinh Zala - Official Image Gallery</h1>
    <p>This page serves as an official repository of images for Shivrajsinh Zala, Frontend Developer based in Rajkot, Gujarat.</p>
    <div class="gallery">
"""

for img in image_data:
    html_content += f'        <img src="assets/images/gallery/{img["filename"]}" alt="{img["alt"]}" loading="lazy" />\n'

html_content += """    </div>
</body>
</html>"""

with open("/Users/shivrajsinhzala/Documents/untitled folder/gallery.html", "w") as f:
    f.write(html_content)

print(f"Successfully created gallery.html with {len(image_data)} images.")

# Now let's print out the sitemap XML snippet so we can add it later
print("\nSITEMAP SNIPPET TO ADD:\n")
sitemap_snippet = f"""  <url>
    <loc>https://shivrajsinhzala.github.io/gallery.html</loc>
    <lastmod>2026-05-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>"""
for img in image_data:
    sitemap_snippet += f"""
    <image:image>
      <image:loc>{img['url']}</image:loc>
      <image:title>{img['alt']}</image:title>
    </image:image>"""
sitemap_snippet += "\n  </url>"

with open("/Users/shivrajsinhzala/Documents/untitled folder/sitemap_snippet.txt", "w") as f:
    f.write(sitemap_snippet)
