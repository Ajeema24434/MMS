"""
============================================================
AI-DRIVEN MENTOR-MENTEE MANAGEMENT SYSTEM
ML MODULE: DATA PREPROCESSING & EDA (40% MVP Milestone)
============================================================
Description:
This script loads the synthetic student academic dataset, performs missing
value check/imputation, encodes categorical variables, scales numerical
features, and generates exploratory data analysis (EDA) visualizations.
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def run_preprocessing():
    print("============================================================")
    print("  PHASE 1: LOADING DATASET & INITIAL INSPECTION")
    print("============================================================")

    # Set file paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, 'data', 'student_risk_dataset.csv')
    plots_dir = os.path.join(base_dir, 'plots')
    os.makedirs(plots_dir, exist_ok=True)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    # 1. Load CSV
    df = pd.read_csv(data_path)
    print(f"[INFO] Dataset loaded successfully from: {data_path}")
    print(f"[INFO] Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\n")

    print("--- Head (First 5 records) ---")
    print(df.head())

    print("\n--- Summary Statistics ---")
    print(df.describe())

    # 2. Check Missing Values
    print("\n============================================================")
    print("  PHASE 2: MISSING VALUE CHECK & IMPUTATION")
    print("============================================================")
    missing_count = df.isnull().sum()
    print("Missing values per column:")
    print(missing_count[missing_count > 0] if missing_count.sum() > 0 else "No missing values found in raw dataset.")

    # Apply SimpleImputer for numerical columns if missing values exist
    num_cols = df.select_dtypes(include=[np.number]).columns
    imputer = SimpleImputer(strategy='mean')
    df[num_cols] = imputer.fit_transform(df[num_cols])

    # 3. Exploratory Data Analysis (EDA) & Visualization
    print("\n============================================================")
    print("  PHASE 3: EDA & PLOT GENERATION")
    print("============================================================")

    # Plot 1: Class Distribution
    plt.figure(figsize=(7, 5))
    palette = {'Bright': '#10b981', 'Average': '#f59e0b', 'Weak': '#ef4444'}
    sns.countplot(data=df, x='risk_level', hue='risk_level', palette=palette, order=['Bright', 'Average', 'Weak'], legend=False)
    plt.title('Student Risk Level Class Distribution (Mock Sample)', fontsize=13, fontweight='bold')
    plt.xlabel('Risk Level Category', fontsize=11)
    plt.ylabel('Student Count', fontsize=11)
    plt.grid(axis='y', linestyle='--', alpha=0.5)

    class_dist_path = os.path.join(plots_dir, 'class_distribution.png')
    plt.savefig(class_dist_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[SAVED] Class distribution plot saved to: {class_dist_path}")

    # Plot 2: Correlation Heatmap
    plt.figure(figsize=(10, 8))
    corr = df[num_cols].corr()
    sns.heatmap(corr, annot=True, fmt=".2f", cmap='coolwarm', linewidths=0.5)
    plt.title('Feature Correlation Heatmap', fontsize=13, fontweight='bold')

    corr_heatmap_path = os.path.join(plots_dir, 'correlation_heatmap.png')
    plt.savefig(corr_heatmap_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[SAVED] Correlation heatmap saved to: {corr_heatmap_path}")

    # 4. Feature Encoding & Scaling
    print("\n============================================================")
    print("  PHASE 4: ENCODING & FEATURE SCALING")
    print("============================================================")

    X = df.drop(columns=['risk_level'])
    y = df['risk_level']

    # One-Hot Encoding for categorical fields ('batch', 'division')
    cat_cols = ['batch', 'division']
    X_encoded = pd.get_dummies(X, columns=cat_cols, drop_first=True)

    # Scale numerical features
    scaler = StandardScaler()
    scaled_feature_names = [col for col in X_encoded.columns if col not in ['defaulter_flag']]
    X_scaled = X_encoded.copy()
    X_scaled[scaled_feature_names] = scaler.fit_transform(X_encoded[scaled_feature_names])

    print(f"[INFO] Features after encoding & scaling: {X_scaled.shape[1]} features.")
    print("Feature columns:", list(X_scaled.columns))

    # Save processed data for baseline training
    processed_path = os.path.join(base_dir, 'data', 'processed_student_dataset.csv')
    df_processed = X_scaled.copy()
    df_processed['risk_level'] = y.values
    df_processed.to_csv(processed_path, index=False)
    print(f"\n[SUCCESS] Preprocessing completed. Processed data saved to: {processed_path}")

    return X_scaled, y

if __name__ == '__main__':
    run_preprocessing()
