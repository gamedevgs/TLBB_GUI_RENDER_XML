# TLBB Image Converter Script
# Chuyển đổi file .tga và .dds sang .png để sử dụng trong web browser

import os
import sys
from PIL import Image
import argparse

def convert_tga_to_png(input_path, output_path=None):
    """
    Chuyển đổi file TGA sang PNG
    """
    try:
        if output_path is None:
            output_path = input_path.rsplit('.', 1)[0] + '.png'
            
        with Image.open(input_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                # Keep alpha channel
                img.save(output_path, 'PNG')
            else:
                # Convert to RGB
                rgb_img = img.convert('RGB')
                rgb_img.save(output_path, 'PNG')
                
        print(f"✅ Converted: {input_path} -> {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error converting {input_path}: {e}")
        return False

def convert_directory(input_dir, output_dir=None):
    """
    Chuyển đổi tất cả file .tga trong thư mục
    """
    if output_dir is None:
        output_dir = input_dir
    
    os.makedirs(output_dir, exist_ok=True)
    
    converted_count = 0
    total_count = 0
    
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.tga', '.dds')):
                total_count += 1
                input_path = os.path.join(root, file)
                
                # Maintain directory structure
                rel_path = os.path.relpath(root, input_dir)
                output_subdir = os.path.join(output_dir, rel_path)
                os.makedirs(output_subdir, exist_ok=True)
                
                output_filename = os.path.splitext(file)[0] + '.png'
                output_path = os.path.join(output_subdir, output_filename)
                
                if convert_tga_to_png(input_path, output_path):
                    converted_count += 1
    
    print(f"\n📊 Conversion Summary:")
    print(f"Total files: {total_count}")
    print(f"Converted: {converted_count}")
    print(f"Failed: {total_count - converted_count}")

def main():
    parser = argparse.ArgumentParser(description='Convert TLBB TGA/DDS files to PNG for web use')
    parser.add_argument('input', help='Input file or directory')
    parser.add_argument('-o', '--output', help='Output file or directory')
    parser.add_argument('-r', '--recursive', action='store_true', help='Process directories recursively')
    
    args = parser.parse_args()
    
    if os.path.isfile(args.input):
        # Convert single file
        convert_tga_to_png(args.input, args.output)
    elif os.path.isdir(args.input):
        # Convert directory
        convert_directory(args.input, args.output)
    else:
        print(f"❌ Input path not found: {args.input}")
        sys.exit(1)

if __name__ == "__main__":
    main()

# Usage examples:
# python tga_converter.py UIIcons.tga
# python tga_converter.py Material/Common/ -o tlbb_web_ui/converted/
# python tga_converter.py Material/ -r -o web_assets/
