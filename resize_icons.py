from PIL import Image
import sys
import os

source_path = r"C:/Users/tuval/.gemini/antigravity/brain/7d6932cc-e368-4e5c-9660-9432f114bd4e/uploaded_media_1769254104264.png"
public_dir = r"c:/Users/tuval/WishU/public"

if not os.path.exists(source_path):
    print(f"Source file not found: {source_path}")
    sys.exit(1)

try:
    img = Image.open(source_path)
    
    # Resize and save 192x192
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save(os.path.join(public_dir, "pwa-192x192.png"))
    print("Saved pwa-192x192.png")

    # Resize and save 512x512
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(os.path.join(public_dir, "pwa-512x512.png"))
    print("Saved pwa-512x512.png")
    
    # Also save as favicon (32x32) just in case
    img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    img_32.save(os.path.join(public_dir, "favicon.ico"), format="ICO")
    print("Saved favicon.ico")

except Exception as e:
    print(f"Error processing image: {e}")
    sys.exit(1)
