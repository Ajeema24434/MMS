// Unified Subject & Attendance Evaluation Service
// Synchronizes academic calculations between Student Dashboard and Mentor Mentee Profile

const subjectsBySemester = {
  1: [
    { code: 'AIDS101', name: 'Engineering Mathematics-I', credits: 4 },
    { code: 'AIDS102', name: 'Engineering Physics', credits: 4 },
    { code: 'AIDS103', name: 'Basic Electrical Engineering', credits: 3 },
    { code: 'AIDS104', name: 'Programming & Problem Solving', credits: 4 },
    { code: 'AIDS105', name: 'Engineering Graphics & Design', credits: 3 }
  ],
  2: [
    { code: 'AIDS201', name: 'Engineering Mathematics-II', credits: 4 },
    { code: 'AIDS202', name: 'Engineering Chemistry', credits: 4 },
    { code: 'AIDS203', name: 'Basic Electronics Engineering', credits: 3 },
    { code: 'AIDS204', name: 'Engineering Mechanics', credits: 3 },
    { code: 'AIDS205', name: 'Workshop Practices & Manufacturing', credits: 3 }
  ],
  3: [
    { code: 'AIDS301', name: 'Discrete Mathematics & Graph Theory', credits: 4 },
    { code: 'AIDS302', name: 'Data Structures & Algorithms', credits: 4 },
    { code: 'AIDS303', name: 'Object Oriented Programming with Java', credits: 4 },
    { code: 'AIDS304', name: 'Digital Logic & Microprocessors', credits: 3 },
    { code: 'AIDS305', name: 'Principles of Communication Engineering', credits: 3 }
  ],
  4: [
    { code: 'AIDS401', name: 'Applied Statistics & Linear Algebra', credits: 4 },
    { code: 'AIDS402', name: 'Database Management Systems', credits: 4 },
    { code: 'AIDS403', name: 'Operating Systems & System Software', credits: 4 },
    { code: 'AIDS404', name: 'Computer Networks & Security', credits: 3 },
    { code: 'AIDS405', name: 'Software Engineering & Agile Methodologies', credits: 3 }
  ],
  5: [
    { code: 'AIDS501', name: 'Machine Learning', credits: 4 },
    { code: 'AIDS502', name: 'Design & Analysis of Algorithms', credits: 4 },
    { code: 'AIDS503', name: 'Artificial Intelligence & Expert Systems', credits: 4 },
    { code: 'AIDS504', name: 'Theory of Computation & Automata', credits: 3 },
    { code: 'AIDS505', name: 'Web Application & Cloud Technologies', credits: 3 }
  ],
  6: [
    { code: 'AIDS601', name: 'Deep Learning & Neural Networks', credits: 4 },
    { code: 'AIDS602', name: 'Data Mining & Data Warehousing', credits: 4 },
    { code: 'AIDS603', name: 'Natural Language Processing', credits: 3 },
    { code: 'AIDS604', name: 'Information & Cyber Security', credits: 3 },
    { code: 'AIDS605', name: 'Cloud Computing & DevOps', credits: 3 }
  ],
  7: [
    { code: 'AIDS701', name: 'Big Data Analytics & Hadoop Ecosystem', credits: 4 },
    { code: 'AIDS702', name: 'Distributed Systems & Parallel Computing', credits: 4 },
    { code: 'AIDS703', name: 'Reinforcement Learning & Robotics', credits: 3 },
    { code: 'AIDS704', name: 'Internet of Things & Edge Computing', credits: 3 },
    { code: 'AIDS705', name: 'Project Management & Financial Accounting', credits: 3 }
  ],
  8: [
    { code: 'AIDS801', name: 'High Performance Computing', credits: 4 },
    { code: 'AIDS802', name: 'MLOps & AI Systems Engineering', credits: 4 },
    { code: 'AIDS803', name: 'Autonomous Robotics & Vision Systems', credits: 3 },
    { code: 'AIDS804', name: 'Cyber Physical Systems', credits: 3 },
    { code: 'AIDS805', name: 'Capstone Major Project & Internship', credits: 6 }
  ]
};

const getSemesterSubjectEvaluation = (student, academicRecord, targetSemester, storedSubjectAttendance = []) => {
  const sem = parseInt(targetSemester) || (student?.semester ? parseInt(student.semester) : 5);
  const subjects = subjectsBySemester[sem] || subjectsBySemester[5];

  const overallAtt = academicRecord?.attendance_percentage !== undefined 
    ? parseFloat(academicRecord.attendance_percentage) 
    : 85.0;

  const iseBase = academicRecord?.ise_marks !== undefined ? parseFloat(academicRecord.ise_marks) : 20.0;
  const mseBase = academicRecord?.mse_marks !== undefined ? parseFloat(academicRecord.mse_marks) : 25.0;
  const eseBase = academicRecord?.ese_marks !== undefined ? parseFloat(academicRecord.ese_marks) : 60.0;

  const sid = student?.id || 1;

  return subjects.map((subjObj, idx) => {
    // Check if custom attendance was saved in DB for this student & subject in this semester
    const stored = (storedSubjectAttendance || []).find(
      sa => (sa.subject_code === subjObj.code || sa.subject_name === subjObj.name) && parseInt(sa.semester) === sem
    );

    let totalConducted, totalAttended, subjectAttPct, remarks;
    if (stored) {
      totalConducted = parseInt(stored.conducted_sessions) || 36;
      totalAttended = parseInt(stored.attended_sessions) || 0;
      subjectAttPct = stored.attendance_percentage !== undefined 
        ? parseFloat(stored.attendance_percentage) 
        : (totalConducted > 0 ? parseFloat(((totalAttended / totalConducted) * 100).toFixed(1)) : 0);
      remarks = stored.remarks || '';
    } else {
      totalConducted = 36 + (idx % 3) * 2; // 36, 38, or 40 sessions
      const attDelta = (((sid * 5 + sem * 3 + idx * 7) % 7) - 3) * 1.5;
      subjectAttPct = Math.min(100, Math.max(45, parseFloat((overallAtt + attDelta).toFixed(1))));
      totalAttended = Math.round((subjectAttPct / 100) * totalConducted);
      remarks = '';
    }

    const isDefaulter = subjectAttPct < 75.0;

    // Component Marks calculation
    const delta = (((sid * 7 + sem * 13 + idx * 11) % 9) - 4);
    const subIse = Math.min(30, Math.max(12, Math.round(iseBase + delta * 0.4)));
    const subMse = Math.min(30, Math.max(12, Math.round(mseBase + delta * 0.3)));
    const subEse = Math.min(70, Math.max(28, Math.round((eseBase / 100 * 70) + delta * 0.5)));
    const total = Math.min(100, Math.round((subIse / 30 * 15) + (subMse / 30 * 15) + subEse));

    let grade = 'P';
    if (total >= 85) grade = 'O';
    else if (total >= 75) grade = 'A+';
    else if (total >= 65) grade = 'A';
    else if (total >= 55) grade = 'B+';
    else if (total >= 45) grade = 'B';
    else if (total >= 40) grade = 'C';
    else grade = 'F';

    return {
      name: subjObj.name,
      code: subjObj.code,
      subject: subjObj.name,
      credits: subjObj.credits,
      ise: subIse,
      mse: subMse,
      ese: subEse,
      internal: subIse,
      exam: subEse,
      total: total,
      grade: grade,
      status: total >= 40 ? 'Pass' : 'Backlog',
      conducted: totalConducted,
      attended: totalAttended,
      attendance_pct: subjectAttPct,
      defaulter: isDefaulter,
      remarks: remarks,
      attendance: {
        conducted: totalConducted,
        attended: totalAttended,
        percentage: subjectAttPct,
        status: isDefaulter ? 'Below 75% Defaulter' : 'Good Standing',
        isDefaulter: isDefaulter
      }
    };
  });
};

module.exports = {
  subjectsBySemester,
  getSemesterSubjectEvaluation
};
