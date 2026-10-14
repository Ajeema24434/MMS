const fs = require('fs');
const path = require('path');
const Database = require(path.join(__dirname, '../../backend/node_modules/better-sqlite3'));

const db = new Database(path.join(__dirname, '../../database/mentor_mentee.db'));

let sql = '-- AI-Driven Mentor-Mentee Management System\n-- Database Seed File for AI & DS Department (393 Students)\n\nUSE mentor_mentee;\n\n';

// 1. Users
const users = db.prepare('SELECT id, role, identifier, password_hash, initial_password, name, email, is_active FROM users ORDER BY id').all();
sql += '-- 1. Insert Users (Admin, Mentors, 393 Students)\nINSERT INTO users (id, role, identifier, password_hash, initial_password, name, email, is_active) VALUES\n';
sql += users.map(u => `(${u.id}, '${u.role}', '${u.identifier}', '${u.password_hash}', '${(u.initial_password||'').replace(/'/g, "''")}', '${u.name.replace(/'/g, "''")}', '${u.email}', ${u.is_active})`).join(',\n') + ';\n\n';

// 2. Admins
const admins = db.prepare('SELECT id, user_id, department FROM admins ORDER BY id').all();
sql += '-- 2. Insert Admin\nINSERT INTO admins (id, user_id, department) VALUES\n';
sql += admins.map(a => `(${a.id}, ${a.user_id}, '${a.department}')`).join(',\n') + ';\n\n';

// 3. Mentors
const mentors = db.prepare('SELECT id, user_id, mentor_code, department, designation, phone FROM mentors ORDER BY id').all();
sql += '-- 3. Insert Mentors\nINSERT INTO mentors (id, user_id, mentor_code, department, designation, phone) VALUES\n';
sql += mentors.map(m => `(${m.id}, ${m.user_id}, '${m.mentor_code}', '${m.department}', '${m.designation}', '${m.phone}')`).join(',\n') + ';\n\n';

// 4. Divisions
const divs = db.prepare('SELECT id, department, year, name FROM divisions ORDER BY id').all();
sql += '-- 4. Insert Divisions\nINSERT INTO divisions (id, department, year, name) VALUES\n';
sql += divs.map(d => `(${d.id}, '${d.department}', ${d.year}, '${d.name}')`).join(',\n') + ';\n\n';

// 5. Batches
const batches = db.prepare('SELECT id, name, department, academic_year, year, division, mentor_id FROM batches ORDER BY id').all();
sql += '-- 5. Insert Batches\nINSERT INTO batches (id, name, department, academic_year, year, division, mentor_id) VALUES\n';
sql += batches.map(b => `(${b.id}, '${b.name}', '${b.department}', '${b.academic_year}', ${b.year}, '${b.division}', ${b.mentor_id || 'NULL'})`).join(',\n') + ';\n\n';

// 6. Students
const students = db.prepare('SELECT id, user_id, urn, roll_no, department, year, division, semester, phone, batch_id, ml_risk_level FROM students ORDER BY id').all();
sql += '-- 6. Insert Students (AI & DS Department, 393 Students with URNs)\nINSERT INTO students (id, user_id, urn, roll_no, department, year, division, semester, phone, batch_id, ml_risk_level) VALUES\n';
sql += students.map(s => `(${s.id}, ${s.user_id}, '${s.urn}', '${s.roll_no}', '${s.department}', ${s.year}, '${s.division}', ${s.semester}, '${s.phone}', ${s.batch_id || 'NULL'}, '${s.ml_risk_level}')`).join(',\n') + ';\n\n';

// 7. Academic records
const academics = db.prepare('SELECT id, student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag FROM academic_records ORDER BY id').all();
sql += '-- 7. Insert Academic Records\nINSERT INTO academic_records (id, student_id, semester, cgpa, attendance_percentage, ise_marks, mse_marks, ese_marks, subjects_failed_count, defaulter_flag) VALUES\n';
sql += academics.map(a => `(${a.id}, ${a.student_id}, ${a.semester}, ${a.cgpa}, ${a.attendance_percentage}, ${a.ise_marks}, ${a.mse_marks}, ${a.ese_marks}, ${a.subjects_failed_count}, ${a.defaulter_flag})`).join(',\n') + ';\n\n';

// 8. Activities
const activities = db.prepare('SELECT id, student_id, title, category, description, date_achieved FROM activities ORDER BY id').all();
sql += '-- 8. Insert Activities\nINSERT INTO activities (id, student_id, title, category, description, date_achieved) VALUES\n';
sql += activities.map(ac => `(${ac.id}, ${ac.student_id}, '${ac.title.replace(/'/g, "''")}', '${ac.category}', '${ac.description.replace(/'/g, "''")}', '${ac.date_achieved}')`).join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, '../../database/seed.sql'), sql, 'utf8');
console.log('Successfully updated database/seed.sql with all 393 students!');
