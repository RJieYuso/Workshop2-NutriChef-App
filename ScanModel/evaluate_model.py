from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import os

def evaluate_model():
    # Load the trained model
    model_path = "trained_food_freshness_model_v2.h5"
    if not os.path.exists(model_path):
        print(f"Model file '{model_path}' not found. Please ensure the model is trained and saved.")
        return

    model = load_model(model_path)

    # Create a data generator for the test dataset
    test_datagen = ImageDataGenerator(rescale=1.0 / 255)
    test_generator = test_datagen.flow_from_directory(
        "dataset/Test",
        target_size=(224, 224),
        batch_size=32,
        class_mode="categorical",
        shuffle=False,
    )

    # Evaluate the model
    print("Evaluating the model on the test dataset...")
    test_loss, test_accuracy = model.evaluate(test_generator, verbose=1)
    print(f"Test Loss: {test_loss}")
    print(f"Test Accuracy: {test_accuracy}")

    # Generate predictions
    predictions = model.predict(test_generator)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_generator.classes

    # Classification report
    print("Classification Report:")
    class_indices = {k: v for k, v in test_generator.class_indices.items() if k in ['fresh', 'spoiled']}
    print(classification_report(y_true, y_pred, target_names=list(class_indices.keys())))

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=class_indices.keys(), 
                yticklabels=class_indices.keys())
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    plt.show()

if __name__ == "__main__":
    evaluate_model()