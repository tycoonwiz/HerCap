# Logo Processing Scripts

Utilities for preparing company logos for optimal display in the HerCap portfolio.

## crop-logos.js

Automatically crops company logos to remove excess whitespace and transparency, ensuring they display optimally in the portfolio without wasted space.

### Features

- **Automatic whitespace detection**: Intelligently finds and removes transparent or white areas
- **Smart padding**: Adds configurable padding around logos for breathing room
- **Batch processing**: Processes entire directories of logos at once
- **Format support**: Works with PNG, JPG, WebP, AVIF, and SVG files
- **Safe**: Creates new cropped versions without modifying originals

### Installation

First, install the required dependency:

```bash
npm install
```

This will install `sharp`, the high-performance image processing library.

### Usage

#### Basic Usage

Process all uncropped logos and save cropped versions to the output directory:

```bash
npm run crop-logos
```

This will process logos from:
- **Input**: `/Users/joshdaghir/Documents/logos_uncropped` (source logos)
- **Output**: `hercap/logos/` (cropped logos ready for the app)

#### Custom Directories

You can also specify custom input and output directories:

```bash
node scripts/crop-logos.js [input-dir] [output-dir]
```

**Examples:**

```bash
# Use different directories
node scripts/crop-logos.js /path/to/raw-logos /path/to/output

# Process a subdirectory
node scripts/crop-logos.js ~/Downloads/new-logos ~/Documents/processed-logos
```

### How It Works

1. **Scans** the input directory for image files
2. **Analyzes** each image to find non-transparent, non-white pixels
3. **Calculates** the minimal bounding box around logo content
4. **Adds** configurable padding (default: 10px)
5. **Crops** the image to the optimized dimensions
6. **Saves** the result to the output directory

### Configuration

You can modify these constants in the script:

```javascript
const PADDING = 10; // pixels of padding around the logo
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'];
```

### Output

The script provides detailed feedback:

```
🎨 Logo Cropping Utility

Input directory:  /Users/joshdaghir/Documents/logos_uncropped
Output directory: /Users/joshdaghir/Documents/Hercap/hercap/logos
Padding:          10px

📂 Scanning for images...

Found 127 images

✂️  Cropping images...

  ✓ Cropped: AnimalBiome.png (45% reduction)
  ✓ Cropped: Awair.png (62% reduction)
  ✓ Copied SVG: brave.svg
  ✓ Cropped: Blink.png (38% reduction)
  ...

✅ Done! Cropped logos saved to: /Users/joshdaghir/Documents/logos_uncropped
```

### Workflow Recommendations

1. **Place source logos**: Add new logo files to `/Users/joshdaghir/Documents/logos_uncropped`
2. **Process**: Run `npm run crop-logos` to crop all logos
3. **Review**: Check the cropped logos in `hercap/logos/`
4. **Test**: View logos in the portfolio app with `npm run dev`
5. **Deploy**: Commit the optimized logos to your repository

### Troubleshooting

**"No images found!"**
- Check that your input directory exists and contains image files
- Ensure file extensions are lowercase or add them to `SUPPORTED_FORMATS`

**"Error processing [filename]"**
- The file may be corrupted or in an unsupported format
- Try opening it in an image editor and re-saving

**Logo appears too tightly cropped**
- Increase the `PADDING` constant in the script
- Default is 10px, try 15px or 20px for more breathing room

### Performance

The script uses `sharp`, a highly optimized image processing library:
- Processes 100+ images in seconds
- Minimal memory usage
- Preserves image quality

### Notes

- **SVG files** are copied without modification (they're vector-based)
- Original images are never modified
- Subdirectory structure is preserved in the output
- Safe to run multiple times (overwrites previous output)
