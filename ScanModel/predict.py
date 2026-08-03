from food_model import FoodFreshnessModel
import cv2
import matplotlib.pyplot as plt

def predict_food_freshness(image_path, model_path='trained_food_freshness_model.h5'):
    """
    Predict food freshness from an image
    """
    # Load model
    model = FoodFreshnessModel()
    model.load_model(model_path)
    
    # Make prediction
    result = model.predict(image_path)
    
    # Display results
    print("\n" + "="*50)
    print("FOOD FRESHNESS ANALYSIS")
    print("="*50)
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print("\nProbabilities:")
    print(f"  Fresh: {result['probabilities']['fresh']:.2%}")
    print(f"  Still Edible: {result['probabilities']['still_edible']:.2%}")
    print(f"  Rotten: {result['probabilities']['rotten']:.2%}")
    print("="*50)
    
    # Visualize the image
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    plt.figure(figsize=(8, 6))
    plt.imshow(img)
    plt.title(f"Prediction: {result['prediction']} ({result['confidence']:.2%})")
    plt.axis('off')
    
    # Add text annotation
    text = f"{result['prediction']}\nConfidence: {result['confidence']:.2%}"
    plt.text(10, 30, text, fontsize=12, color='white',
             bbox=dict(facecolor='red', alpha=0.8))
    
    plt.show()
    
    return result

def batch_predict(image_paths, model_path='trained_food_freshness_model.h5'):
    """
    Predict freshness for multiple images
    """
    model = FoodFreshnessModel()
    model.load_model(model_path)
    
    results = []
    for img_path in image_paths:
        result = model.predict(img_path)
        result['image_path'] = img_path
        results.append(result)
        
        print(f"\nImage: {img_path}")
        print(f"Prediction: {result['prediction']} ({result['confidence']:.2%})")
    
    return results

if __name__ == "__main__":
    # Example usage
    test_image = "test_apple.jpg"  # Replace with your test image
    
    # Single prediction
    result = predict_food_freshness(test_image)
    
    # Batch prediction example
    # images = ["image1.jpg", "image2.jpg", "image3.jpg"]
    # batch_results = batch_predict(images)