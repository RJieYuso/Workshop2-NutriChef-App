from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0, MobileNetV2, ResNet50
import tensorflow as tf

class TransferLearningFoodModel:
    def __init__(self, base_model_name='EfficientNetB0', input_shape=(224, 224, 3), num_classes=3):
        self.base_model_name = base_model_name
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = None
        
    def build_model(self, freeze_base=True):
        """Build model with transfer learning"""
        
        # Select base model
        if self.base_model_name == 'EfficientNetB0':
            base_model = EfficientNetB0(
                include_top=False,
                weights='imagenet',
                input_shape=self.input_shape
            )
        elif self.base_model_name == 'MobileNetV2':
            base_model = MobileNetV2(
                include_top=False,
                weights='imagenet',
                input_shape=self.input_shape
            )
        elif self.base_model_name == 'ResNet50':
            base_model = ResNet50(
                include_top=False,
                weights='imagenet',
                input_shape=self.input_shape
            )
        else:
            raise ValueError(f"Unsupported base model: {self.base_model_name}")
        
        # Freeze base model layers
        if freeze_base:
            base_model.trainable = False
        
        # Build custom head
        inputs = keras.Input(shape=self.input_shape)
        
        # Data augmentation layers
        x = layers.RandomRotation(0.2)(inputs)
        x = layers.RandomZoom(0.2)(x)
        x = layers.RandomFlip("horizontal")(x)
        
        # Preprocess input based on base model
        if self.base_model_name == 'EfficientNetB0':
            x = keras.applications.efficientnet.preprocess_input(x)
        elif self.base_model_name == 'MobileNetV2':
            x = keras.applications.mobilenet_v2.preprocess_input(x)
        elif self.base_model_name == 'ResNet50':
            x = keras.applications.resnet.preprocess_input(x)
        
        # Base model
        x = base_model(x, training=False)
        
        # Global pooling and dense layers
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.5)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.5)(x)
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        # Create model
        self.model = keras.Model(inputs, outputs)
        
        return self.model
    
    def unfreeze_layers(self, num_layers=100):
        """Unfreeze some layers for fine-tuning"""
        if self.model is None:
            raise ValueError("Model not built yet")
        
        # Unfreeze top layers of base model
        base_model = self.model.layers[4]  # The base model layer
        base_model.trainable = True
        
        # Freeze all layers first
        for layer in base_model.layers[:-num_layers]:
            layer.trainable = False
        
        # Unfreeze the last few layers
        for layer in base_model.layers[-num_layers:]:
            layer.trainable = True
        
        # Recompile model with lower learning rate
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=1e-5),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print(f"Unfroze last {num_layers} layers for fine-tuning")

# Usage example
if __name__ == "__main__":
    # Create transfer learning model
    tl_model = TransferLearningFoodModel(base_model_name='EfficientNetB0')
    model = tl_model.build_model(freeze_base=True)
    model.summary()