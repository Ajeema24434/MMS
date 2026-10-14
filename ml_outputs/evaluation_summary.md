# Mentor Insight — Student Academic Risk Classification Report
**Model**: Logistic Regression Only (Scikit-learn Pipeline)  
**Task**: Three-Class Student Academic Risk Prediction (`Weak`, `Average`, `Bright`)  
**Dataset**: `mentor_insight_student_risk_synthetic.csv`  

---

## 1. Dataset Dimensions & Class Distribution
- **Dataset Source File**: `mentor_insight_student_risk_synthetic.csv`
- **Total Records**: 600 students
- **Total Features**: 15 predictor features (Identified `student_id` strictly excluded)
- **Target Variable**: `risk_level`
- **Missing Values**: 0 (imputed via `SimpleImputer(strategy='median')` in pipeline)
- **Duplicate Rows**: 0

### Class Breakdown
| Class | Student Count | Proportion (%) | Role in Mentoring System |
|---|---|---|---|
| **Average** | 216 | 36.00% | Standard periodic academic check-ins |
| **Bright** | 204 | 34.00% | Encouragement for honors, research, internships |
| **Weak** | 180 | 30.00% | **Priority Remedial Focus**: Early faculty intervention |

---

## 2. Preprocessing & Integrity Protocol
1. **Identifier Exclusion**: `student_id` was strictly omitted from feature matrices to prevent identity-based data leakage.
2. **Leakage-Free Splitting**: An 80:20 stratified split (`random_state=42`) separated training records (480 samples) from the held-out test set (120 samples) before any scaling was fit.
3. **Pipeline Structure**:
   ```python
   Pipeline([
       ('imputer', SimpleImputer(strategy='median')),
       ('scaler', StandardScaler()),
       ('classifier', LogisticRegression(max_iter=2000, class_weight='balanced', random_state=42))
   ])
   ```
4. **Reproducibility**: `random_state=42` applied across train-test splitting, cross-validation, and solver initialization.

---

## 3. Cross-Validation Results (5-Fold Stratified on Training Set)
| Metric | Mean Score | Standard Deviation (±) |
|---|---|---|
| **Accuracy** | 0.7104 (71.04%) | ± 0.0316 |
| **Balanced Accuracy** | 0.7156 | ± 0.0324 |
| **Macro Precision** | 0.7203 | ± 0.0292 |
| **Macro Recall** | 0.7156 | ± 0.0324 |
| **Macro F1-Score** | 0.7148 | ± 0.0307 |

---

## 4. Held-Out Test Set Performance (120 Students)
| Evaluation Metric | Test Set Score | Note |
|---|---|---|
| **Overall Accuracy** | **80.00%** | 96/120 students correctly categorized |
| **Balanced Accuracy** | **0.8064** | Normalized for class sizes |
| **Macro Precision** | **0.8003** | Unweighted average precision |
| **Macro Recall** | **0.8064** | Unweighted average recall |
| **Macro F1-Score** | **0.8026** | Balanced harmonic mean |
| **Weighted F1-Score** | **0.7980** | Sample-weighted F1-score |
| **Multiclass ROC-AUC (OVR)** | **0.9292** | Separability across probability distributions |

### Per-Class Metrics
| Academic Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| **Weak** | **0.8462** | **0.9167 (91.7%)** | **0.8800** | 36 |
| **Average** | 0.7500 | 0.6977 | 0.7229 | 43 |
| **Bright** | 0.8049 | 0.8049 | 0.8049 | 41 |

---

## 5. Confusion Matrix (Held-out Test Set)
```
Actual \ Predicted    Weak    Average    Bright
Weak                   33          3         0
Average                 5         30         8
Bright                  1          7        33
```
- **Weak-Class Support**: Out of 36 actual Weak students, **33 (91.7%)** were correctly detected.
- **Zero Critical False Negatives**: 0 Weak students were incorrectly predicted as Bright.

---

## 6. Model Explainability & Mentoring Decision Support
1. **Assistive Decision Tool**: The model acts as an advisory triage system for faculty mentors. It is strictly non-punitive and must not replace human advisory judgment.
2. **Key Predictive Signals**:
   - High End-Semester Exam (`ese_marks`), In-Semester Exam (`ise_marks`), and Attendance (`attendance_percentage`) strongly reduce Weak-category risk.
   - High `defaulter_flag` and `subjects_failed_count` positively drive Weak-category risk.
3. **Probabilistic Uncertainty**: When predicted probability is borderline (< 60%), mentors are guided to conduct an informal interview to understand holistic factors before planning remedial sessions.

---

## 7. Execution Instructions
To reproduce training and evaluation:
```bash
python train_logistic_regression.py
```
All outputs, plots, and models are generated into `ml_outputs/`.
