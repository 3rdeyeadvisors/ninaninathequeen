

# Replace Nina Armend Vision Image on About Page

## What's changing

1. **About page (`src/pages/About.tsx`)** -- Replace the stock Unsplash photo in "The Nina Armend Vision" section with the uploaded image (`IMG_1307.jpeg`). The image will be saved as `src/assets/nina-vision-about.jpeg` and imported at the top of the file.

2. **Sustainability page (`src/pages/Sustainability.tsx`)** -- Remove the "Nina Armend Vision" section that was mistakenly added there, along with the `ninaVisionImg` import.

## Technical details

- Copy `user-uploads://IMG_1307.jpeg` to `src/assets/nina-vision-about.jpeg`
- In `src/pages/About.tsx`: add `import ninaVisionAboutImg from '@/assets/nina-vision-about.jpeg'` and replace the Unsplash URL on line 46 with `ninaVisionAboutImg`
- In `src/pages/Sustainability.tsx`: remove the `import ninaVisionImg` line and the entire "Nina Armend Vision" `<div>` block (lines 91-103 approximately)

