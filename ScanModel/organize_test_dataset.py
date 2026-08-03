import os
import shutil

def organize_test_dataset():
    base_dir = "dataset/Test"
    fresh_classes = [
        "freshapples", "freshbanana", "freshcucumber", "freshokra", "freshoranges", "freshpatato", "freshtamto"
    ]
    rotten_classes = [
        "rottenapples", "rottenbanana", "rottencucumber", "rottenokra", "rottenoranges", "rottenpatato", "rottentamto"
    ]

    # Create target directories
    fresh_dir = os.path.join(base_dir, "fresh")
    rotten_dir = os.path.join(base_dir, "spoiled")
    os.makedirs(fresh_dir, exist_ok=True)
    os.makedirs(rotten_dir, exist_ok=True)

    # Move files to fresh directory
    for fresh_class in fresh_classes:
        class_dir = os.path.join(base_dir, fresh_class)
        if os.path.exists(class_dir):
            for file_name in os.listdir(class_dir):
                file_path = os.path.join(class_dir, file_name)
                if os.path.isfile(file_path):
                    shutil.move(file_path, fresh_dir)

    # Move files to spoiled directory
    for rotten_class in rotten_classes:
        class_dir = os.path.join(base_dir, rotten_class)
        if os.path.exists(class_dir):
            for file_name in os.listdir(class_dir):
                file_path = os.path.join(class_dir, file_name)
                if os.path.isfile(file_path):
                    shutil.move(file_path, rotten_dir)

    # Remove empty class directories
    for class_dir in fresh_classes + rotten_classes:
        dir_path = os.path.join(base_dir, class_dir)
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)  # Use shutil.rmtree to remove directories and their contents

if __name__ == "__main__":
    organize_test_dataset()
    print("Test dataset reorganized successfully.")