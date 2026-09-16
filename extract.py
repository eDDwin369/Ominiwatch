import cv2
import os
import sys

video_path = 'public/assets/video.mp4'
output_dir = 'public/assets/frames'

if not os.path.exists(video_path):
    print(f"Error: {video_path} not found.")
    sys.exit(1)

os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
count = 0

print("Extracting frames...")
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # Save frame as JPEG with 80% quality to save space
    frame_path = os.path.join(output_dir, f'frame_{count:04d}.jpg')
    cv2.imwrite(frame_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    count += 1

cap.release()
print(f"Extracted {count} frames successfully to {output_dir}.")
