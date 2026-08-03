import os
import shutil
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Define the source and target directories
source_dir = "dataset/Train"
target_dir = "dataset/Train_Augmented"

# Create the target directories
for category in ["fresh", "spoiled"]:
    os.makedirs(os.path.join(target_dir, category), exist_ok=True)

# Define the data augmentation generator
data_gen = ImageDataGenerator(
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode="nearest",
)

# Augment the dataset
for category in ["fresh", "spoiled"]:
    source_category_dir = os.path.join(source_dir, category)
    target_category_dir = os.path.join(target_dir, category)

    if os.path.exists(source_category_dir):
        for file_name in os.listdir(source_category_dir):
            source_file = os.path.join(source_category_dir, file_name)

            # Load the image
            img = data_gen.flow_from_directory(
                directory=source_category_dir,
                target_size=(224, 224),
                batch_size=1,
                save_to_dir=target_category_dir,
                save_prefix="aug_",
                save_format="jpeg",
            )

print("Dataset augmentation complete. Augmented data saved in 'dataset/Train_Augmented'.")