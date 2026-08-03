from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

def test_data_generators():
    data_dir = 'organized_meat_dataset'

    # Enhanced data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    print("Testing training data generator...")
    train_gen = train_datagen.flow_from_directory(
        data_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='training',
        shuffle=True,
        seed=42
    )

    print("Testing validation data generator...")
    val_gen = val_datagen.flow_from_directory(
        data_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='validation',
        shuffle=False,
        seed=42
    )

    print("\nClasses found:")
    print(train_gen.class_indices)

    print("\nTraining data samples:")
    for i, (images, labels) in enumerate(train_gen):
        print(f"Batch {i+1}: {images.shape}, {labels.shape}")
        if i == 2:  # Limit to 3 batches
            break

    print("\nValidation data samples:")
    for i, (images, labels) in enumerate(val_gen):
        print(f"Batch {i+1}: {images.shape}, {labels.shape}")
        if i == 2:  # Limit to 3 batches
            break

if __name__ == "__main__":
    test_data_generators()