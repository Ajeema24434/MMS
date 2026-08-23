# Machine Learning Module - 40% MVP Milestone

## Overview
This directory contains the Machine Learning pipeline for the **AI-Driven Mentor-Mentee Management System**. For this 40% milestone, the ML module is independently runnable and implements data preprocessing, exploratory data analysis (EDA), and a Logistic Regression baseline classifier.

---

## Dataset Description (`ml/data/student_risk_dataset.csv`)
The dataset consists of 18 synthetic student-semester records with academic, attendance, co-curricular, and disciplinary features.

### Features
1. `attendance_percentage`: Overall attendance percentage (0 to 100).
2. `subjects_below_75_attendance`: Count of subjects where attendance is below 75%.
3. `ise_marks`: In-Semester Exam marks (out of 20).
4. `mse_marks`: Mid-Semester Exam marks (out of 30).
5. `ese_marks`: End-Semester Exam marks (out of 70).
6. `subjects_failed_count`: Number of failed subjects / backlogs.
7. `events_count`: Count of technical/non-technical events attended.
8. `nptel_courses`: Count of completed NPTEL certifications.
9. `internships`: Count of completed internships.
10. `workshops`: Count of workshops attended.
11. `sports_cultural_count`: Participation in sports or cultural events.
12. `complaints_count`: Count of complaints registered.
13. `meetings_attended`: Mentoring meetings attended.
14. `meetings_missed`: Mentoring meetings missed.
15. `defaulter_flag`: Binary indicator (1 = Defaulter, 0 = Normal).
16. `batch`: Academic batch (e.g., `CSE-2024-A`).
17. `division`: Student division (`A` or `B`).

### Target
- `risk_level`: Class label (`Bright`, `Average`, `Weak`).

---

## Pipeline Workflow

### 1. Data Preprocessing & EDA (`data_preprocessing.py`)
- **Missing Values**: Handled using `SimpleImputer(strategy='mean')`.
- **Categorical Encoding**: `batch` and `division` encoded using `pd.get_dummies`.
- **Feature Scaling**: Numerical features scaled using `StandardScaler`.
- **EDA Plots Generated**:
  - `ml/plots/class_distribution.png`: Bar plot showing target distribution.
  - `ml/plots/correlation_heatmap.png`: Seaborn heatmap showing feature correlations.

### 2. Baseline Model Training (`baseline_model.py`)
- **Train/Test Split**: Stratified 80/20 train-test split (`test_size=0.20`, `stratify=y`, `random_state=42`).
- **Algorithm**: `LogisticRegression(max_iter=1000, random_state=42)`.
- **Evaluation**: Accuracy score, classification report, and confusion matrix plot saved to `ml/plots/confusion_matrix.png`.

---

## How to Run

### Execute Preprocessing & EDA:
```bash
python ml/data_preprocessing.py
```

### Train Baseline Model:
```bash
python ml/baseline_model.py
```

---

## Future Roadmap (Next Milestones)
- **Primary Classifier**: Random Forest Classifier.
- **Model Comparison**: XGBoost and K-Nearest Neighbors (KNN).
- **Hyperparameter Tuning**: GridSearchCV / RandomizedSearchCV.
- **Model Persistence**: `joblib.dump()` model serialization.
- **Backend Integration**: Flask / Node.js microservice API endpoint (`POST /api/ml/predict-risk`).
- **Recommendation Engine**: Automated remedial action suggestions for at-risk mentees.
