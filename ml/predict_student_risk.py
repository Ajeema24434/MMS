"""
MENTOR INSIGHT — STUDENT ACADEMIC RISK PREDICTION SERVICE
Uses the trained, leakage-free Scikit-learn Pipeline (best_model.joblib)
to perform actual machine learning risk analysis on all active students in the database.
"""

import os
import sys
import json
import sqlite3
import joblib
import pandas as pd
import numpy as np

def run_ml_analysis(db_path=None, model_path=None):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if not db_path:
        db_path = os.path.join(base_dir, 'database', 'mentor_mentee.db')
    if not model_path:
        model_path = os.path.join(base_dir, 'ml_outputs', 'best_model.joblib')

    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at: {db_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained model not found at: {model_path}")

    print("=" * 70)
    print("  MENTOR INSIGHT — RUNNING ACTUAL ML RISK PREDICTION PIPELINE")
    print("=" * 70)
    print(f"Loading trained pipeline from: {model_path}")
    pipeline = joblib.load(model_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Query all students with academic records, activities, complaints, and meetings
    sql = """
    SELECT 
        s.id as student_id,
        s.urn,
        s.roll_no,
        s.year,
        s.division,
        s.batch_id,
        u.name,
        COALESCE(ar.attendance_percentage, 80.0) as attendance_percentage,
        COALESCE(ar.ise_marks, 18.0) as ise_marks,
        COALESCE(ar.mse_marks, 20.0) as mse_marks,
        COALESCE(ar.ese_marks, 55.0) as ese_marks,
        COALESCE(ar.subjects_failed_count, 0) as subjects_failed_count,
        COALESCE(ar.defaulter_flag, 0) as defaulter_flag,
        (SELECT COUNT(*) FROM activities WHERE student_id = s.id AND category = 'Technical Event') as events_count,
        (SELECT COUNT(*) FROM activities WHERE student_id = s.id AND category = 'Certification') as nptel_courses,
        (SELECT COUNT(*) FROM activities WHERE student_id = s.id AND category = 'Internship') as internships,
        (SELECT COUNT(*) FROM activities WHERE student_id = s.id AND category = 'Workshop') as workshops,
        (SELECT COUNT(*) FROM activities WHERE student_id = s.id AND category IN ('Sports', 'Cultural')) as sports_cultural_count,
        (SELECT COUNT(*) FROM complaints WHERE student_id = s.id) as complaints_count,
        (SELECT COUNT(*) FROM meeting_attendees WHERE student_id = s.id AND status = 'Present') as meetings_attended,
        (SELECT COUNT(*) FROM meeting_attendees WHERE student_id = s.id AND status = 'Absent') as meetings_missed
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN (
        SELECT student_id, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag
        FROM academic_records
        GROUP BY student_id
        HAVING MAX(semester)
    ) ar ON s.id = ar.student_id
    ORDER BY s.id ASC
    """

    df = pd.read_sql_query(sql, conn)
    print(f"Fetched {len(df)} student records from database.")

    if len(df) == 0:
        print("No student records found to analyze.")
        conn.close()
        return

    # Derive missing feature columns required by model
    # 1. subjects_below_75_attendance
    df['subjects_below_75_attendance'] = df['attendance_percentage'].apply(
        lambda att: 0 if att >= 75.0 else (1 if att >= 65.0 else (2 if att >= 55.0 else 3))
    )
    # 2. meetings_missed
    df['meetings_missed'] = df['meetings_missed'].fillna(0).astype(float)

    feature_cols = [
        'attendance_percentage',
        'subjects_below_75_attendance',
        'ise_marks',
        'mse_marks',
        'ese_marks',
        'subjects_failed_count',
        'events_count',
        'nptel_courses',
        'internships',
        'workshops',
        'sports_cultural_count',
        'complaints_count',
        'meetings_attended',
        'meetings_missed',
        'defaulter_flag'
    ]

    X = df[feature_cols].copy()

    # Perform actual predictions
    predictions = pipeline.predict(X)
    probabilities = pipeline.predict_proba(X)
    classes = list(pipeline.classes_)

    results = []
    update_batch = []

    for idx, row in df.iterrows():
        pred_label = str(predictions[idx])
        probs = {cls_name: round(float(probabilities[idx][c_idx]), 4) for c_idx, cls_name in enumerate(classes)}
        conf = probs.get(pred_label, 0.90)

        update_batch.append((pred_label, int(row['student_id'])))

        results.append({
            'student_id': int(row['student_id']),
            'urn': row['urn'],
            'roll_no': row['roll_no'],
            'name': row['name'],
            'year': int(row['year']),
            'predicted_risk_level': pred_label,
            'confidence': conf,
            'probabilities': probs,
            'features': {k: float(row[k]) for k in feature_cols}
        })

    # Update database
    cursor.executemany("UPDATE students SET ml_risk_level = ? WHERE id = ?", update_batch)
    conn.commit()
    conn.close()

    # Save detailed analysis JSON
    out_json = os.path.join(base_dir, 'ml_outputs', 'student_risk_predictions.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({
            'total_students_analyzed': len(results),
            'model_name': 'LogisticRegression (StandardScaler + Balanced)',
            'classes': classes,
            'class_distribution': {
                'Bright': sum(1 for r in results if r['predicted_risk_level'] == 'Bright'),
                'Average': sum(1 for r in results if r['predicted_risk_level'] == 'Average'),
                'Weak': sum(1 for r in results if r['predicted_risk_level'] == 'Weak')
            },
            'predictions_by_id': { str(r['student_id']): r for r in results },
            'sample_predictions': results[:10]
        }, f, indent=2)

    print("\n[SUCCESS] Actual ML Predictions Applied to Database!")
    print(f"Total students updated: {len(update_batch)}")
    print("Class Distribution:")
    print(f"  - Bright:  {sum(1 for r in results if r['predicted_risk_level'] == 'Bright')} students")
    print(f"  - Average: {sum(1 for r in results if r['predicted_risk_level'] == 'Average')} students")
    print(f"  - Weak:    {sum(1 for r in results if r['predicted_risk_level'] == 'Weak')} students")
    print(f"Analysis saved to: {out_json}")

if __name__ == '__main__':
    run_ml_analysis()
