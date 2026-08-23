"""
============================================================
AI-DRIVEN MENTOR-MENTEE MANAGEMENT SYSTEM
ML MODULE: LOGISTIC REGRESSION BASELINE MODEL (40% MVP)
============================================================
Description:
This script trains a Logistic Regression baseline classifier on the preprocessed
synthetic academic dataset using a stratified 80/20 train-test split.
Evaluates Accuracy, Confusion Matrix, and Classification Report.
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

def train_baseline_model():
    print("============================================================")
    print("  LOGISTIC REGRESSION BASELINE MODEL TRAINING")
    print("============================================================")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    processed_path = os.path.join(base_dir, 'data', 'processed_student_dataset.csv')
    plots_dir = os.path.join(base_dir, 'plots')
    os.makedirs(plots_dir, exist_ok=True)

    if not os.path.exists(processed_path):
        print("[WARNING] Processed dataset not found. Running preprocessing first...")
        from data_preprocessing import run_preprocessing
        run_preprocessing()

    df = pd.read_csv(processed_path)

    X = df.drop(columns=['risk_level'])
    y = df['risk_level']

    # 1. Stratified 80/20 Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=42
    )

    print(f"[INFO] Train set size: {len(X_train)} samples")
    print(f"[INFO] Test set size:  {len(X_test)} samples\n")

    # 2. Train Logistic Regression Model
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)

    # 3. Model Predictions & Evaluation
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred, labels=['Bright', 'Average', 'Weak'])

    print("============================================================")
    print("  MODEL EVALUATION RESULTS")
    print("============================================================")
    print(f"Baseline Accuracy: {acc * 100:.2f}%\n")

    print("--- Classification Report ---")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("--- Confusion Matrix ---")
    print("Labels: ['Bright', 'Average', 'Weak']")
    print(cm)

    # 4. Generate & Save Confusion Matrix Plot
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Bright', 'Average', 'Weak'],
                yticklabels=['Bright', 'Average', 'Weak'])
    plt.title('Logistic Regression Confusion Matrix (Baseline)', fontsize=12, fontweight='bold')
    plt.xlabel('Predicted Risk Level', fontsize=10)
    plt.ylabel('Actual Risk Level', fontsize=10)

    cm_plot_path = os.path.join(plots_dir, 'confusion_matrix.png')
    plt.savefig(cm_plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"\n[SAVED] Confusion Matrix plot saved to: {cm_plot_path}")

    # 5. Viva Explanation Rationale
    print("\n============================================================")
    print("  VIVA EXPLANATION SUMMARY")
    print("============================================================")
    print("• Model Rationale: Logistic Regression was selected as the simple, explainable baseline for 40% MVP.")
    print("• Dataset Scope: 18 synthetic student-semester records created for workflow demonstration.")
    print("• Stratified Split: Ensured class proportions (Bright, Average, Weak) are preserved in train/test splits.")
    print("• Next Milestone: Random Forest primary classifier, XGBoost & KNN comparison, model serialization (joblib), and Flask API integration.")
    print("============================================================\n")

if __name__ == '__main__':
    train_baseline_model()
