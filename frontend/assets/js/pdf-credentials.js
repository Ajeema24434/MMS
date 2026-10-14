/**
 * MMS - AI & DS Department PDF Credentials Generator
 * Generates sharable, officially branded credential PDF sheets
 * for Students (by Class, Division, and Batch) and Mentors.
 */

const PDFCredentials = {
  DEPARTMENT: 'Department of Artificial Intelligence & Data Science (AI & DS)',
  DEPT_SHORT: 'AI & DS',

  getYearPrefix(yr) {
    switch (parseInt(yr)) {
      case 1: return 'FY';
      case 2: return 'SY';
      case 3: return 'TY';
      case 4: return 'BTECH';
      default: return 'FY';
    }
  },

  /**
   * Helper: Format Date String
   */
  getFormattedTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Check if jsPDF & AutoTable are loaded
   */
  hasJsPdf() {
    return (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined') || typeof window.jsPDF !== 'undefined';
  },

  /**
   * Generate Student Credentials PDF
   * @param {Object} options - { classYear, division, batchName, mentorName, students, title }
   */
  generateStudentPdf(options) {
    const {
      classYear = 'FY',
      division = 'A',
      batchName = 'All Batches',
      mentorName = 'Faculty Mentor',
      students = [],
      title = 'Student Login Credentials Sheet'
    } = options;

    const safeDept = this.DEPT_SHORT.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${safeDept}_${classYear}_Div${division}_${batchName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Credentials.pdf`;

    if (this.hasJsPdf()) {
      try {
        const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        const doc = new jsPDFClass({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

      // Header Banner Background
      doc.setFillColor(30, 58, 138); // Deep Navy (#1e3a8a)
      doc.rect(0, 0, 595, 75, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('MENTOR–MENTEE MANAGEMENT SYSTEM (MMS)', 297, 26, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(219, 234, 254);
      doc.text(this.DEPARTMENT, 297, 42, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(253, 224, 71); // Amber/Yellow
      doc.text(title.toUpperCase(), 297, 58, { align: 'center' });

      // Metadata Info Box
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(30, 85, 535, 60, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      // Meta Row 1
      doc.text('DEPARTMENT:', 42, 102);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('AI & DS', 115, 102);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('CLASS / YEAR:', 215, 102);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${classYear} (AI & DS)`, 290, 102);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('DIVISION:', 415, 102);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Div ${division}`, 465, 102);

      // Meta Row 2
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('BATCH:', 42, 122);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`${batchName}`, 85, 122);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('MENTOR:', 215, 122);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${mentorName || 'Assigned Faculty'}`, 265, 122);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('TOTAL:', 415, 122);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${students.length} Students`, 460, 122);

      // Meta Row 3: Generation Notice
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${this.getFormattedTimestamp()} | Confidential Login Credentials Sheet for Students`, 42, 138);

      // Table Columns
      const tableHeaders = [
        ['Sr', 'Roll No', 'Student Name', 'User ID (URN)', 'Password', 'Batch', 'Email']
      ];

      const tableRows = students.map((s, idx) => [
        idx + 1,
        s.roll_no || `Roll-${idx+1}`,
        s.name,
        s.urn || s.username,
        s.password,
        s.batch_name || batchName,
        s.email || `${s.urn}@student.mms.edu`
      ]);

        const autoTableFn = (typeof doc.autoTable === 'function')
          ? doc.autoTable.bind(doc)
          : (typeof window.jspdf?.autoTable === 'function' ? (opts) => window.jspdf.autoTable(doc, opts) : null);

        if (autoTableFn) {
          autoTableFn({
            startY: 155,
            head: tableHeaders,
            body: tableRows,
            theme: 'grid',
            headStyles: {
              fillColor: [30, 58, 138],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
              halign: 'left'
            },
            styles: {
              fontSize: 7.5,
              cellPadding: 4,
              textColor: [15, 23, 42],
              lineColor: [226, 232, 240],
              lineWidth: 0.5
            },
            columnStyles: {
              0: { cellWidth: 24, halign: 'center' },
              1: { cellWidth: 48, fontStyle: 'bold' },
              2: { cellWidth: 100 },
              3: { cellWidth: 78, fontStyle: 'bold', textColor: [37, 99, 235] },
              4: { cellWidth: 84, fontStyle: 'bold', textColor: [220, 38, 38] },
              5: { cellWidth: 70 },
              6: { cellWidth: 120, fontSize: 6.5 }
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            margin: { left: 30, right: 30 },
            didDrawPage: function(data) {
              const pageCount = doc.internal.getNumberOfPages();
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
              doc.setTextColor(148, 163, 184);
              doc.text(
                `Department of AI & DS — Official Credentials Sheet | Page ${data.pageNumber} of ${pageCount}`,
                297,
                820,
                { align: 'center' }
              );
            }
          });
        } else {
          throw new Error('autoTable plugin unavailable on doc');
        }

        doc.save(fileName);
        return true;
      } catch (err) {
        console.error('jsPDF execution error, using fallback:', err);
        this.openPrintableFallback(options, 'STUDENT');
        return true;
      }
    } else {
      this.openPrintableFallback(options, 'STUDENT');
      return true;
    }
  },

  /**
   * Automatically groups students by batch and downloads separate PDFs for each batch.
   * Mentions Department (AI & DS), Class, Division, and Batch in each PDF.
   * @param {Array} students - List of student credential objects
   * @param {Object} defaultOptions - Default overrides (classYear, division, mentorName)
   */
  generateBatchesSeparatePdfs(students = [], defaultOptions = {}) {
    if (!students || students.length === 0) {
      alert('No student records available to generate credentials PDF.');
      return;
    }

    // Group students by batch name (or batch_id)
    const batchMap = {};
    students.forEach(s => {
      const bKey = s.batch_name || (s.batch_id ? `Batch_${s.batch_id}` : 'General_Batch');
      if (!batchMap[bKey]) batchMap[bKey] = [];
      batchMap[bKey].push(s);
    });

    const batchKeys = Object.keys(batchMap);
    if (batchKeys.length === 0) return;

    if (batchKeys.length === 1) {
      // Single batch
      const bStudents = batchMap[batchKeys[0]];
      const first = bStudents[0];
      this.generateStudentPdf({
        classYear: first.year_name || defaultOptions.classYear || 'FY',
        division: first.division || defaultOptions.division || 'A',
        batchName: first.batch_name || defaultOptions.batchName || batchKeys[0],
        mentorName: first.mentor_name || defaultOptions.mentorName || 'Faculty Mentor',
        students: bStudents,
        title: `${first.batch_name || batchKeys[0]} Student Login Credentials`
      });
      return;
    }

    // Multiple batches: generate separate PDFs for each batch, staggered by 600ms
    batchKeys.forEach((bKey, idx) => {
      setTimeout(() => {
        const bStudents = batchMap[bKey];
        const first = bStudents[0];
        this.generateStudentPdf({
          classYear: first.year_name || defaultOptions.classYear || 'FY',
          division: first.division || defaultOptions.division || 'A',
          batchName: first.batch_name || bKey,
          mentorName: first.mentor_name || defaultOptions.mentorName || 'Faculty Mentor',
          students: bStudents,
          title: `${first.batch_name || bKey} Student Login Credentials`
        });
      }, idx * 600);
    });
  },

  /**
   * Generate Faculty Mentor Credentials PDF
   * @param {Array} mentors - List of mentor objects
   */
  generateMentorPdf(mentors = []) {
    const fileName = `${this.DEPT_SHORT}_Faculty_Mentor_Credentials.pdf`;

    if (this.hasJsPdf()) {
      try {
        const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        const doc = new jsPDFClass({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

      // Header Banner Background
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, 595, 75, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('MENTOR–MENTEE MANAGEMENT SYSTEM (MMS)', 297, 26, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(this.DEPARTMENT, 297, 42, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(52, 211, 153); // Emerald/Teal
      doc.text('FACULTY MENTOR CREDENTIALS DIRECTORY (CONFIDENTIAL)', 297, 58, { align: 'center' });

      // Metadata Info Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(30, 85, 535, 45, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      doc.text('DEPARTMENT:', 42, 102);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('AI & DS', 115, 102);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('TOTAL MENTORS:', 215, 102);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${mentors.length} Faculty Members`, 305, 102);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('ACADEMIC YEAR:', 415, 102);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('2024-2025', 495, 102);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${this.getFormattedTimestamp()} | Official Faculty Access Information`, 42, 118);

      // Table Columns
      const tableHeaders = [
        ['Sr', 'Faculty Name', 'User ID (Code)', 'Password', 'Designation', 'Email', 'Assigned Batches']
      ];

      const tableRows = mentors.map((m, idx) => [
        idx + 1,
        m.name,
        m.mentor_code || m.username,
        m.password,
        m.designation || 'Assistant Professor',
        m.email,
        m.assigned_batches || (m.batches && m.batches.map(b => b.name).join(', ')) || 'None'
      ]);

        const autoTableFn = (typeof doc.autoTable === 'function')
          ? doc.autoTable.bind(doc)
          : (typeof window.jspdf?.autoTable === 'function' ? (opts) => window.jspdf.autoTable(doc, opts) : null);

        if (autoTableFn) {
          autoTableFn({
            startY: 140,
            head: tableHeaders,
            body: tableRows,
            theme: 'grid',
            headStyles: {
              fillColor: [15, 23, 42],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
              halign: 'left'
            },
            styles: {
              fontSize: 7.5,
              cellPadding: 4,
              textColor: [15, 23, 42],
              lineColor: [226, 232, 240],
              lineWidth: 0.5
            },
            columnStyles: {
              0: { cellWidth: 24, halign: 'center' },
              1: { cellWidth: 95, fontStyle: 'bold' },
              2: { cellWidth: 70, fontStyle: 'bold', textColor: [16, 185, 129] },
              3: { cellWidth: 75, fontStyle: 'bold', textColor: [220, 38, 38] },
              4: { cellWidth: 85 },
              5: { cellWidth: 100, fontSize: 6.5 },
              6: { cellWidth: 85, fontSize: 7 }
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            margin: { left: 30, right: 30 },
            didDrawPage: function(data) {
              const pageCount = doc.internal.getNumberOfPages();
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
              doc.setTextColor(148, 163, 184);
              doc.text(
                `Department of AI & DS — Official Mentor Credentials | Page ${data.pageNumber} of ${pageCount}`,
                297,
                820,
                { align: 'center' }
              );
            }
          });
        } else {
          throw new Error('autoTable plugin unavailable on doc');
        }

        doc.save(fileName);
        return true;
      } catch (err) {
        console.error('jsPDF execution error, using fallback:', err);
        this.openPrintableFallback({ mentors }, 'MENTOR');
        return true;
      }
    } else {
      this.openPrintableFallback({ mentors }, 'MENTOR');
      return true;
    }
  },

  /**
   * Printable Fallback window in case jsPDF CDN is blocked
   */
  openPrintableFallback(data, type) {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to download/print the credentials PDF.');
      return;
    }

    let bodyHtml = '';
    if (type === 'STUDENT') {
      const { classYear, division, batchName, mentorName, students } = data;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
          <div style="background: #1e3a8a; color: white; padding: 16px; text-align: center; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 18px;">MENTOR–MENTEE MANAGEMENT SYSTEM (MMS)</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #93c5fd;">Department of Artificial Intelligence & Data Science (AI & DS)</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #fde047; font-weight: bold;">STUDENT LOGIN CREDENTIALS DIRECTORY</p>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; line-height: 1.6;">
            <strong>Department:</strong> AI & DS &nbsp;|&nbsp; <strong>Class:</strong> ${classYear} &nbsp;|&nbsp; <strong>Division:</strong> Div ${division} &nbsp;|&nbsp; <strong>Batch:</strong> ${batchName} &nbsp;|&nbsp; <strong>Faculty Mentor:</strong> ${mentorName || 'Assigned Mentor'}
            <br><span style="color: #64748b; font-size: 10px;">Generated on: ${this.getFormattedTimestamp()} | Confidential Credentials</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px;">
            <thead>
              <tr style="background: #1e3a8a; color: white; text-align: left;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Sr</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Roll No</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Student Name</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">User ID (URN)</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Password</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Batch</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((s, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${s.roll_no}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${s.name}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #2563eb;">${s.urn || s.username}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #dc2626;">${s.password}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${s.batch_name || batchName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      const { mentors } = data;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
          <div style="background: #0f172a; color: white; padding: 16px; text-align: center; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 18px;">MENTOR–MENTEE MANAGEMENT SYSTEM (MMS)</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Department of Artificial Intelligence & Data Science (AI & DS)</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #34d399; font-weight: bold;">FACULTY MENTOR CREDENTIALS DIRECTORY</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px;">
            <thead>
              <tr style="background: #0f172a; color: white; text-align: left;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Sr</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Faculty Name</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">User ID / Code</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Password</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Designation</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Assigned Batches</th>
              </tr>
            </thead>
            <tbody>
              ${mentors.map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${m.name}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #059669;">${m.mentor_code || m.username}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #dc2626;">${m.password}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${m.designation || 'Assistant Professor'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${m.assigned_batches || (m.batches && m.batches.map(b => b.name).join(', ')) || 'None'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MMS Credentials Sheet - AI & DS</title>
        <style>
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
};

window.PDFCredentials = PDFCredentials;
if (typeof window.getYearPrefix === 'undefined') {
  window.getYearPrefix = PDFCredentials.getYearPrefix;
}
